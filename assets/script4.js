let filterActive = false;
let previousLandmarks = null; // To store previous landmarks for comparison
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
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
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

// Function to compare two sets of landmarks
function landmarksChanged(currentLandmarks, previousLandmarks) {
  if (!previousLandmarks) return true; // If there's no previous landmarks, render.
  const threshold = 2; // Small threshold to reduce flickering caused by minor changes
  for (let i = 0; i < currentLandmarks.length; i++) {
    if (
      Math.abs(currentLandmarks[i].x - previousLandmarks[i].x) > threshold ||
      Math.abs(currentLandmarks[i].y - previousLandmarks[i].y) > threshold
    ) {
      return true;
    }
  }
  return false;
}

// Define the blur function to handle blemish-prone regions
function applyLocalizedBlur(region, ctx, video, displaySize) {
  ctx.save(); // Save the current canvas state
  ctx.beginPath();
  region.forEach((point) => ctx.lineTo(point.x, point.y)); // Create a path around the region
  ctx.clip(); // Clip the specific region to limit the blur effect
  ctx.filter = "blur(3px)"; // Apply slight blur to clear blemishes
  ctx.drawImage(video, 0, 0, displaySize.width, displaySize.height); // Redraw video with blur applied to the clipped region
  ctx.restore(); // Restore the canvas to prevent further blurring
}

// Manipulate facial features based on landmarks
function manipulateFace(landmarks, ctx, displaySize) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Get specific facial landmarks directly using the positions array
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);
  const nose = landmarks.slice(27, 36);
  const mouth = landmarks.slice(48, 68);
  const faceOutline = landmarks.slice(0, 17);
  const leftCheek = landmarks.slice(1, 6);
  const rightCheek = landmarks.slice(11, 16);
  const forehead = [landmarks[19], landmarks[24]];
  const chin = [landmarks[8]];

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

  // Apply blur to blemish-prone areas
  applyLocalizedBlur(leftCheek, ctx, video, displaySize);
  applyLocalizedBlur(rightCheek, ctx, video, displaySize);
  applyLocalizedBlur(nose, ctx, video, displaySize);
  applyLocalizedBlur(forehead, ctx, video, displaySize);
  applyLocalizedBlur(chin, ctx, video, displaySize);

  /* Example: apply smoothing effect over the whole face (you can adjust the region)
  ctx.save(); // Save current canvas state
  ctx.beginPath();
  faceOutline.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.clip();
  ctx.filter = "blur(2px)"; // Apply a blur filter to simulate skin clearing
  ctx.drawImage(video, 0, 0, displaySize.width, displaySize.height);
  ctx.restore();*/
}

// Run face detection and apply filter
function runFaceDetection(video, canvas) {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");

      if (resizedDetections.length > 0 && filterActive) {
        const landmarks = resizedDetections[0].landmarks.positions;

        if (landmarksChanged(landmarks, previousLandmarks)) {
          manipulateFace(landmarks, ctx, displaySize);
          previousLandmarks = landmarks;
        }
      } else if (!filterActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        previousLandmarks = null;
      }
    }
  }, smoothingInterval);
}

// Toggle the filter effect
document.getElementById("toggleFilter").addEventListener("click", () => {
  filterActive = !filterActive;
  previousLandmarks = null;
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");
  if (!filterActive) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
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
  });
});
