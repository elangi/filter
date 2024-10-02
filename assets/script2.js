let filterActive = false;

// Load models for face detection and landmarks
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models/weights");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models/weights");
}

// Start video feed
async function startVideo() {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;
}

// Manipulate facial features based on landmarks
function manipulateFace(landmarks, ctx, displaySize) {
  // Clear the previous drawing
  ctx.clearRect(0, 0, displaySize.width, displaySize.height);

  // Get specific facial landmarks
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();

  // Draw enlarged eyes
  ctx.beginPath();
  ctx.ellipse(leftEye[0].x, leftEye[0].y, 20, 10, 0, 0, 2 * Math.PI);
  ctx.ellipse(rightEye[0].x, rightEye[0].y, 20, 10, 0, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fill();

  // Narrow the nose bridge (simplified)
  const noseStart = nose[0];
  const noseEnd = nose[6]; // Center of the nose
  ctx.beginPath();
  ctx.moveTo(noseStart.x, noseStart.y);
  ctx.lineTo(noseEnd.x, noseEnd.y);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Example: apply smoothing effect over the whole face (you can adjust the region)
  ctx.filter = "blur(2px)"; // Apply a blur filter to simulate skin clearing
}

// Run face detection and apply filter
function runFaceDetection(video, canvas) {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
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
  }, 100);
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
  runFaceDetection(video, canvas);
});