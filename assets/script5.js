async function applyFacialEnhancement() {
  const video = document.getElementById("camera");

  // Load face-api.js models
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

  // Detect face landmarks continuously
  video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear the canvas before each frame
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Loop through detections and apply facial modifications
      resizedDetections.forEach(({ landmarks }) => {
        applyNoseSlimming(landmarks, ctx);
        applyLipPlumping(landmarks, ctx);
        clearBlemishes(landmarks, ctx, video);
      });
    }, 100);
  });
}

function applyNoseSlimming(landmarks, ctx) {
  const nose = landmarks.getNose();

  // Slim the nose by adjusting outer points
  const noseBridge = [nose[0], nose[1], nose[2], nose[3]];
  const noseLower = [nose[4], nose[5], nose[6], nose[7]];

  const scaleFactor = 0.9; // Control slimming effect
  noseLower.forEach((point) => {
    const xCenter = (nose[4].x + nose[6].x) / 2;
    point.x = xCenter + (point.x - xCenter) * scaleFactor; // Move points inward
  });

  drawLandmark(ctx, noseBridge);
  drawLandmark(ctx, noseLower);
}

function drawLandmark(ctx, points) {
  ctx.beginPath();
  points.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.stroke();
}

function applyLipPlumping(landmarks, ctx) {
  const mouth = landmarks.getMouth();

  // Plump lips by enlarging the mouth area
  const upperLip = mouth.slice(0, 7); // Upper lip landmarks
  const lowerLip = mouth.slice(7); // Lower lip landmarks

  const plumpFactor = 1.1; // Control lip enhancement

  // Stretch upper and lower lips
  upperLip.forEach((point) => (point.y *= plumpFactor));
  lowerLip.forEach((point) => (point.y *= plumpFactor));

  drawLandmark(ctx, upperLip);
  drawLandmark(ctx, lowerLip);
}

function clearBlemishes(landmarks, ctx, video) {
  const faceOutline = landmarks.getJawOutline();
  ctx.save();
  ctx.beginPath();
  faceOutline.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.clip(); // Clip to the face region
  ctx.filter = "blur(2px)"; // Apply blur for blemish clearing
  ctx.drawImage(video, 0, 0, video.width, video.height);
  ctx.restore();
}

// Initialize video and enhancement on load
window.addEventListener("load", applyFacialEnhancement);
