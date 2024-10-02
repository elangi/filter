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
  // Get specific facial landmarks
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const faceOutline = landmarks.getJawOutline();
  const mouth = landmarks.getMouth(); // New: Get mouth landmarks

  // Dynamically adjust nose coordinates to narrow the nose bridge
  const centerX = (nose[0].x + nose[6].x) / 2; // Find the center of the nose

  // Adjust nose bridge landmarks (move them towards the centerX to narrow the nose)
  const narrowedNose = nose.map((point, index) => {
    if (index >= 0 && index <= 3) {
      return { x: point.x * 0.9 + centerX * 0.1, y: point.y }; // Move points towards the center
    }
    return point; // Don't alter points at the bottom of the nose
  });

  // Draw enlarged and elongated eyes (longer in length and width)
  const leftEyeWidth = Math.abs(leftEye[3].x - leftEye[0].x);
  const rightEyeWidth = Math.abs(rightEye[3].x - rightEye[0].x);

  ctx.beginPath();
  ctx.ellipse(
    leftEye[0].x,
    leftEye[0].y,
    leftEyeWidth * 1.5, // width expansion
    leftEyeWidth * 1.2, // also make them longer
    0,
    0,
    2 * Math.PI
  );
  ctx.ellipse(
    rightEye[0].x,
    rightEye[0].y,
    rightEyeWidth * 1.5,
    rightEyeWidth * 1.2,
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();

  // Widen the lips
  const leftMouthCorner = mouth[0];
  const rightMouthCorner = mouth[6];
  const mouthCenterX = (leftMouthCorner.x + rightMouthCorner.x) / 2;

  const widenedMouth = mouth.map((point, index) => {
    if (index === 0 || index === 6) {
      return { x: point.x + (point.x - mouthCenterX) * 0.2, y: point.y }; // Widen mouth by adjusting corners
    }
    return point;
  });

  // Draw the widened lips
  ctx.beginPath();
  ctx.moveTo(widenedMouth[0].x, widenedMouth[0].y);
  for (let i = 1; i < widenedMouth.length; i++) {
    ctx.lineTo(widenedMouth[i].x, widenedMouth[i].y);
  }
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Apply a smoothing effect (blur) over the face
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
        // Only apply the filter when it's active and detections are present
        const landmarks = resizedDetections[0].landmarks;
        manipulateFace(landmarks, ctx, displaySize);
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
