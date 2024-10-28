const video = document.getElementById("video");
const toggleFilterButton = document.getElementById("toggleFilter");
const overlay = document.getElementById("overlay");
let filterActive = false;

// Load face-api models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices
    .getUserMedia({
      video: {},
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => console.error(err));
}

video.addEventListener("play", async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    if (filterActive) {
      applyFilters(resizedDetections);
    }
  }, 100);
});

toggleFilterButton.addEventListener("click", () => {
  filterActive = !filterActive;
  toggleFilterButton.textContent = filterActive
    ? "Remove Filter"
    : "Apply Filter";
});

function applyFilters(detections) {
  const ctx = overlay.getContext("2d");
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  detections.forEach((detection) => {
    const landmarks = detection.landmarks.positions;

    // Get important facial landmarks
    const leftEye = landmarks.slice(36, 42); // Points for the left eye
    const rightEye = landmarks.slice(42, 48); // Points for the right eye
    const nose = landmarks.slice(27, 30); // Points for the nose
    const lips = landmarks.slice(48, 60); // Points for the lips

    // Apply modifications
    plumpLips(ctx, lips);
    enlargeEyes(ctx, leftEye, rightEye);
    slimNose(ctx, nose);
    clearBlemishes(ctx, landmarks);
  });
}

function plumpLips(ctx, lips) {
  // Example function to plump lips
  ctx.fillStyle = "rgba(255, 182, 193, 0.8)"; // Light pink color
  ctx.beginPath();
  ctx.moveTo(lips[0]._x, lips[0]._y);
  lips.forEach((point) => ctx.lineTo(point._x, point._y));
  ctx.closePath();
  ctx.fill();
}

function enlargeEyes(ctx, leftEye, rightEye) {
  // Example function to enlarge eyes
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // White color for eye enlargement
  leftEye.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point._x, point._y, 5, 0, Math.PI * 2); // Draw larger eye
    ctx.fill();
  });
  rightEye.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point._x, point._y, 5, 0, Math.PI * 2); // Draw larger eye
    ctx.fill();
  });
}

function slimNose(ctx, nose) {
  // Example function to slim nose
  ctx.fillStyle = "rgba(255, 224, 189, 0.8)"; // Skin tone color
  ctx.beginPath();
  ctx.moveTo(nose[0]._x, nose[0]._y);
  ctx.lineTo(nose[1]._x, nose[1]._y);
  ctx.lineTo(nose[2]._x, nose[2]._y);
  ctx.closePath();
  ctx.fill();
}

function clearBlemishes(ctx, landmarks) {
  // Example function to clear blemishes
  landmarks.forEach((point) => {
    ctx.fillStyle = "rgba(255, 224, 189, 0.9)"; // Skin color for blemish cover
    ctx.beginPath();
    ctx.arc(point._x, point._y, 2, 0, Math.PI * 2); // Cover blemishes
    ctx.fill();
  });
}
