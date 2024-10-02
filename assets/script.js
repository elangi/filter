const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const toggleButton = document.getElementById("toggleFilter");
let filterActive = false;

// Load face-api.js models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models/dist"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models/dist"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models/dist"),
]).then(startVideo);

// Start the video stream
async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Error accessing the camera:", err.name, err.message);
  }
}

// Event listener for when the video plays
video.addEventListener("play", () => {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(overlay, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);

    if (filterActive) {
      applyFilter(resizedDetections);
    }
  }, 100);
});

// Apply filter to the face
function applyFilter(detections) {
  detections.forEach((detection) => {
    const landmarks = detection.landmarks;
    const ctx = overlay.getContext("2d");

    // Slim the nose
    const nose = landmarks.getNose();
    ctx.beginPath();
    ctx.moveTo(nose[0].x, nose[0].y);
    ctx.lineTo(nose[3].x, nose[3].y);
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Enlarge the lips
    const mouth = landmarks.getMouth();
    ctx.beginPath();
    ctx.moveTo(mouth[0].x, mouth[0].y);
    mouth.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fill();

    // Clear blemishes (simplified)
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(
      detection.box.x,
      detection.box.y,
      detection.box.width,
      detection.box.height
    );
  });
}

// Toggle the filter
toggleButton.addEventListener("click", () => {
  filterActive = !filterActive;
  toggleButton.textContent = filterActive ? "Disable Filter" : "Enable Filter";
});
