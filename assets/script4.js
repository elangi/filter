let filterActive = false;

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
  // Clear the previous drawing
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Get specific facial landmarks
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const faceOutline = landmarks.getJawOutline();

  const leftEyeWidth = Math.abs(leftEye[3].x - leftEye[0].x);
  const rightEyeWidth = Math.abs(rightEye[3].x - rightEye[0].x);

  // Dynamically adjust nose coordinates to narrow the nose bridge
  const centerX = (nose[0].x + nose[6].x) / 2; // Find the center of the nose

  // Adjust nose bridge landmarks (move them towards the centerX to narrow the nose)
  const narrowedNose = nose.map((point, index) => {
    if (index >= 0 && index <= 3) {
      // These points represent the top of the nose bridge, closer to the eyes
      return { x: point.x * 0.9 + centerX * 0.1, y: point.y }; // Move points towards the center by reducing x
    }
    return point; // Don't alter points at the bottom of the nose
  });

  // Modify left and right eyes (enlarge by adjusting width)
  leftEye.forEach((point) => {
    point.x -= leftEyeWidth * 0.2; // Move left eye points outward
  });

  rightEye.forEach((point) => {
    point.x += rightEyeWidth * 0.2; // Move right eye points outward
  });

  // Example: apply a smoothing/blur effect over the whole face (you can adjust the region)
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
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");
      if (resizedDetections.length > 0 && filterActive) {
        const landmarks = resizedDetections[0].landmarks;
        manipulateFace(landmarks, ctx, displaySize);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas if no detection or filter is off
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
