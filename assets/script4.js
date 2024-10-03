let filterActive = false;
let smoothingInterval = 50; // Adjusting interval for smoother transitions

// Load models for face detection and landmarks
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("models/weights");
  await faceapi.nets.faceLandmark68Net.loadFromUri("models/weights");
}

// Start video feed
async function startVideo() {
  const video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
    video.srcObject = stream;
    console.log("Video stream started successfully");
  } catch (error) {
    console.error("Error accessing the camera: ", error);
  }
}

function adjustCanvasSize(video, canvas) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  console.log(`Canvas adjusted to: ${canvas.width}x${canvas.height}`);
}

// Manipulate facial features based on landmarks
function manipulateFace(landmarks, ctx, displaySize) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Get specific facial landmarks
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const faceOutline = landmarks.getJawOutline();
  const mouth = landmarks.getMouth(); // Use getMouth() to get all mouth points

  // Separate the upper and lower lips manually
  const upperLip = mouth.slice(0, 7); // Points from 0 to 6 are the upper lip
  const lowerLip = mouth.slice(6, 12); // Points from 6 to 11 are the lower lip

  // Dynamically adjust nose coordinates to narrow the nose bridge
  const centerX = (nose[0].x + nose[6].x) / 2; // Find the center of the nose

  // Adjust nose bridge landmarks (move them towards the centerX to narrow the nose)
  const narrowedNose = nose.map((point, index) => {
    if (index >= 0 && index <= 3) {
      return { x: point.x * 0.9 + centerX * 0.1, y: point.y }; // Move points towards the center
    }
    return point; // Don't alter points at the bottom of the nose
  });

  // Manipulate eye landmarks to "enlarge" eyes
  const enlargeFactor = 1.3; // Control how much to adjust eye size

  const modifiedLeftEye = leftEye.map((point) => ({
    x: point.x * enlargeFactor,
    y: point.y * enlargeFactor,
  }));

  const modifiedRightEye = rightEye.map((point) => ({
    x: point.x * enlargeFactor,
    y: point.y * enlargeFactor,
  }));

  // Manipulate lips to make them plumper
  const lipEnhanceFactor = 1.2; // Control lip enhancement

  const modifiedUpperLip = upperLip.map((point) => ({
    x: (point.x - upperLip[3].x) * lipEnhanceFactor + upperLip[3].x, // Scale relative to the center
    y: (point.y - upperLip[3].y) * lipEnhanceFactor + upperLip[3].y,
  }));

  const modifiedLowerLip = lowerLip.map((point) => ({
    x: (point.x - lowerLip[3].x) * lipEnhanceFactor + lowerLip[3].x, // Scale relative to the center
    y: (point.y - lowerLip[3].y) * lipEnhanceFactor + lowerLip[3].y,
  }));

  // Use the manipulated eye points but without rendering anything visible
  ctx.beginPath();
  modifiedLeftEye.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineWidth = 0; // No visible drawing
  ctx.stroke();

  ctx.beginPath();
  modifiedRightEye.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineWidth = 0; // No visible drawing
  ctx.stroke();

  // Adjust the lips without drawing
  ctx.beginPath();
  modifiedUpperLip.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineWidth = 0; // No visible drawing
  ctx.stroke();

  ctx.beginPath();
  modifiedLowerLip.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineWidth = 0; // No visible drawing
  ctx.stroke();

  // Draw the nose with modified landmarks (invisible path)
  ctx.beginPath();
  ctx.moveTo(narrowedNose[0].x, narrowedNose[0].y);
  for (let i = 1; i < narrowedNose.length; i++) {
    ctx.lineTo(narrowedNose[i].x, narrowedNose[i].y);
  }
  ctx.strokeStyle = "rgba(0, 0, 0, 0)"; // No visible drawing
  ctx.lineWidth = 0;
  ctx.stroke();

  // Example: apply smoothing effect over the whole face (you can adjust the region)
  ctx.save(); // Save current canvas state
  ctx.beginPath();
  faceOutline.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.clip();
  ctx.filter = "blur(2px)"; // Apply a blur filter to simulate skin clearing
  ctx.drawImage(video, 0, 0, displaySize.width, displaySize.height);
  ctx.restore();
}

// Run face detection and apply filter
function runFaceDetection(video, canvas) {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      console.log("Detections: ", detections);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      console.log("Resized Detections: ", resizedDetections);

      const ctx = canvas.getContext("2d");

      if (resizedDetections.length > 0 && filterActive) {
        // Only apply the filter when it's active and detections are present
        const landmarks = resizedDetections[0].landmarks;
        manipulateFace(landmarks, ctx, displaySize);
        console.log("Landmarks: ", landmarks);
      } else if (!filterActive) {
        // Clear the canvas only when the filter is inactive
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, 50); // Adjusted the interval to 50ms for smoother results
}

// Toggle the filter effect
document.getElementById("toggleFilter").addEventListener("click", () => {
  filterActive = !filterActive;
});

window.addEventListener("load", async () => {
  await loadModels();
  startVideo();

  const video = document.getElementById("video");
  const canvas = document.getElementById("overlay");

  video.addEventListener("playing", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width > 0 && canvas.height > 0) {
      adjustCanvasSize(video, canvas);
      runFaceDetection(video, canvas);
    }

    console.log(`Video size: ${video.videoWidth}x${video.videoHeight}`);
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
  });
});
