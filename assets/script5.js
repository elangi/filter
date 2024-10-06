let enhancementsEnabled = false;

// Start the camera feed
async function startCamera() {
  const video = document.getElementById("camera");
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;

  // Load face-api.js models
  await faceapi.nets.tinyFaceDetector.loadFromUri("models/weights");
  await faceapi.nets.faceLandmark68Net.loadFromUri("models/weights");

  video.addEventListener("play", () => {
    const canvas = document.getElementById("overlay");
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      if (enhancementsEnabled) {
        resizedDetections.forEach(({ landmarks }) => {
          const ctx = canvas.getContext("2d");
          applyNoseSlimming(landmarks, ctx);
          applyLipPlumping(landmarks, ctx);
          clearBlemishes(landmarks, ctx, video);
        });
      }
    }, 100);
  });
}

// Toggle Button
document.getElementById("toggleButton").addEventListener("click", () => {
  enhancementsEnabled = !enhancementsEnabled;
  document.getElementById("toggleButton").textContent = enhancementsEnabled
    ? "Remove Enhancements"
    : "Apply Enhancements";
});

// Slimming the Nose
function applyNoseSlimming(landmarks, ctx) {
  const nose = landmarks.getNose();
  const noseLower = [nose[4], nose[5], nose[6], nose[7]];
  const scaleFactor = 0.9; // Adjust this factor to control slimming effect
  noseLower.forEach((point) => {
    const xCenter = (nose[4].x + nose[6].x) / 2;
    point.x = xCenter + (point.x - xCenter) * scaleFactor; // Move points closer to center
  });
  drawLandmark(ctx, noseLower);
}

// Plumping the Lips
function applyLipPlumping(landmarks, ctx) {
  const mouth = landmarks.getMouth();
  const upperLip = mouth.slice(0, 7); // Upper lip landmarks
  const lowerLip = mouth.slice(7); // Lower lip landmarks
  const plumpFactor = 1.1; // Adjust the plump factor to control how much lips are stretched
  upperLip.forEach((point) => {
    point.y *= plumpFactor;
  }); // Push the upper lip upward
  lowerLip.forEach((point) => {
    point.y *= plumpFactor;
  }); // Push the lower lip downward
  drawLandmark(ctx, upperLip);
  drawLandmark(ctx, lowerLip);
}

// Clearing Blemishes
function clearBlemishes(landmarks, ctx, video) {
  const face = landmarks.getFace();
  const faceRect = getBoundingBox(face);
  ctx.drawImage(
    video,
    faceRect.x,
    faceRect.y,
    faceRect.width,
    faceRect.height,
    faceRect.x,
    faceRect.y,
    faceRect.width,
    faceRect.height
  );
  ctx.filter = "blur(5px)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
}

function getBoundingBox(points) {
  const xCoords = points.map((p) => p.x);
  const yCoords = points.map((p) => p.y);
  return {
    x: Math.min(...xCoords),
    y: Math.min(...yCoords),
    width: Math.max(...xCoords) - Math.min(...xCoords),
    height: Math.max(...yCoords) - Math.min(...yCoords),
  };
}

function drawLandmark(ctx, points) {
  ctx.beginPath();
  points.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; // Customize the color if needed
  ctx.stroke();
}

startCamera();
