async function applyFacialEnhancement() {
  const video = document.getElementById("camera");

  // Load face-api.js models
  await faceapi.nets.tinyFaceDetector.loadFromUri("models/weights");
  await faceapi.nets.faceLandmark68Net.loadFromUri("models/weights");

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

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Apply the nose slimming, lip plumping, and blemish clearing
      resizedDetections.forEach(({ landmarks }) => {
        const ctx = canvas.getContext("2d");
        applyNoseSlimming(landmarks, ctx);
        applyLipPlumping(landmarks, ctx);
        clearBlemishes(landmarks, ctx, video);
      });
    }, 100);
  });
}


function applyNoseSlimming(landmarks, ctx) {
  const nose = landmarks.getNose();

  // Slim the nose by adjusting the outer points
  const noseBridge = [nose[0], nose[1], nose[2], nose[3]];
  const noseLower = [nose[4], nose[5], nose[6], nose[7]];

  // Example of slimming: move the outermost points slightly inward
  const scaleFactor = 0.9; // Adjust this factor to control slimming effect
  noseLower.forEach((point, i) => {
    const xCenter = (nose[4].x + nose[6].x) / 2;
    point.x = xCenter + (point.x - xCenter) * scaleFactor; // Move points closer to center
  });

  drawLandmark(ctx, noseBridge);
  drawLandmark(ctx, noseLower);
}

function drawLandmark(ctx, points) {
  ctx.beginPath();
  points.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; // Customize the color if needed
  ctx.stroke();
}

function applyLipPlumping(landmarks, ctx) {
  const mouth = landmarks.getMouth();

  // Plump the lips by slightly enlarging the mouth area
  const upperLip = mouth.slice(0, 7); // Upper lip landmarks
  const lowerLip = mouth.slice(7); // Lower lip landmarks

  // Stretch the lips by modifying landmark positions
  const plumpFactor = 1.1; // Adjust the plump factor to control how much lips are stretched

  upperLip.forEach((point) => {
    point.y *= plumpFactor; // Push the upper lip upward
  });

  lowerLip.forEach((point) => {
    point.y *= plumpFactor; // Push the lower lip downward
  });

  drawLandmark(ctx, upperLip);
  drawLandmark(ctx, lowerLip);
}

function clearBlemishes(landmarks, ctx, video) {
  const face = landmarks.getFace(); // All face points

  // Loop through the detected face area and apply a smoothing filter to blemish-like areas
  // This is a basic approach, you may need to refine it

  const faceRect = getBoundingBox(face); // Get a bounding box around the face

  // Extract the face region from the video and detect potential blemishes
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

  // Example: Simple smoothing over detected blemishes
  // Use a basic image processing algorithm to blur out red spots (blemishes)
  // You can integrate advanced processing libraries like tracking.js for better detection

  ctx.filter = "blur(5px)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
}

function getBoundingBox(points) {
  const xCoords = points.map((p) => p.x);
  const yCoords = points.map((p) => p.y);

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
