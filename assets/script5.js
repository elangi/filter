// Select elements
const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("overlay");
const toggleFilterButton = document.getElementById("toggleFilter");
const canvasCtx = canvasElement.getContext("2d");
let filterActive = false;

// Initialize MediaPipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
camera.start();

toggleFilterButton.addEventListener("click", () => {
  filterActive = !filterActive;
});

// Draw results onto the canvas
function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw the original feed
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  if (!filterActive) return;

  if (results.multiFaceLandmarks) {
    results.multiFaceLandmarks.forEach((landmarks) => {
      applyFaceTransformations(landmarks);
    });
  }
}

function applyFaceTransformations(landmarks) {
  // Slim the nose bridge (key landmarks 6, 168 for top, 195, 5 for bottom of the nose)
  canvasCtx.beginPath();
  canvasCtx.moveTo(
    landmarks[6].x * canvasElement.width,
    landmarks[6].y * canvasElement.height
  );
  canvasCtx.lineTo(
    landmarks[168].x * canvasElement.width,
    landmarks[168].y * canvasElement.height
  );
  canvasCtx.lineTo(
    landmarks[195].x * canvasElement.width,
    landmarks[195].y * canvasElement.height
  );
  canvasCtx.lineTo(
    landmarks[5].x * canvasElement.width,
    landmarks[5].y * canvasElement.height
  );
  canvasCtx.closePath();
  canvasCtx.fillStyle = "rgba(255, 235, 235, 0.8)"; // Adjust color to match skin tone
  canvasCtx.fill();

  // Plump the lips by spreading outer lip areas (landmarks 78, 308 for outer points)
  const lipXOffset = 5; // Offset to "plump" the lips
  const lipYOffset = 2;
  canvasCtx.beginPath();
  canvasCtx.moveTo(
    landmarks[78].x * canvasElement.width - lipXOffset,
    landmarks[78].y * canvasElement.height + lipYOffset
  );
  canvasCtx.lineTo(
    landmarks[308].x * canvasElement.width + lipXOffset,
    landmarks[308].y * canvasElement.height + lipYOffset
  );
  canvasCtx.closePath();
  canvasCtx.fillStyle = "rgba(255, 182, 193, 0.7)"; // Light pink tone for lips
  canvasCtx.fill();

  // Enlarge eyes by expanding the outer eye areas (landmarks 33, 263 for outer corners)
  const eyeXOffset = 3;
  const eyeYOffset = 3;
  canvasCtx.beginPath();
  canvasCtx.ellipse(
    landmarks[33].x * canvasElement.width,
    landmarks[33].y * canvasElement.height,
    eyeXOffset,
    eyeYOffset,
    0,
    0,
    2 * Math.PI
  );
  canvasCtx.ellipse(
    landmarks[263].x * canvasElement.width,
    landmarks[263].y * canvasElement.height,
    eyeXOffset,
    eyeYOffset,
    0,
    0,
    2 * Math.PI
  );
  canvasCtx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Darken edges for larger eye effect
  canvasCtx.fill();

  // Clear blemishes by applying a smooth skin layer (averaging colors around landmarks 10, 338)
  const blemishRadius = 6;
  canvasCtx.globalAlpha = 0.6;
  canvasCtx.beginPath();
  canvasCtx.arc(
    landmarks[10].x * canvasElement.width,
    landmarks[10].y * canvasElement.height,
    blemishRadius,
    0,
    2 * Math.PI
  );
  canvasCtx.fillStyle = "rgba(255, 224, 189, 0.5)"; // Adjust to approximate skin tone
  canvasCtx.fill();
  canvasCtx.globalAlpha = 1.0;
}
