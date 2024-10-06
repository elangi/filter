// Load FaceMesh and Camera utils
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

const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("overlay");
const canvasCtx = canvasElement.getContext("2d");

let filterOn = false;

const camera = new Camera(videoElement, {
  onFrame: async () => {
    if (filterOn) {
      await faceMesh.send({ image: videoElement });
    } else {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
  },
  width: 640,
  height: 480,
});
camera.start();

document.getElementById("toggleFilter").addEventListener("click", () => {
  filterOn = !filterOn;
});

function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    applyFacialEnhancements(landmarks);
  }
}

function applyFacialEnhancements(landmarks) {
  // Slimming the Nose
  slimNose(landmarks);

  // Plumping the Lips
  plumpLips(landmarks);

  // Enlarging the Eyes
  enlargeEyes(landmarks);

  // Clearing Blemishes
  clearBlemishes();
}

function slimNose(landmarks) {
  const leftNostril = landmarks[36];
  const rightNostril = landmarks[266];
  const noseBridge = landmarks[6];

  // Bring the outer nostrils closer to the nose bridge
  const noseSlimFactor = 0.8;
  landmarks[36].x =
    (leftNostril.x - noseBridge.x) * noseSlimFactor + noseBridge.x;
  landmarks[266].x =
    (rightNostril.x - noseBridge.x) * noseSlimFactor + noseBridge.x;

  drawLandmarks(landmarks);
}

function plumpLips(landmarks) {
  const lipExpandFactor = 1.1;

  // Upper lip (example landmark points)
  for (let point of [61, 185, 40, 39, 37]) {
    landmarks[point].y -=
      lipExpandFactor * (landmarks[point].y - landmarks[13].y);
  }

  // Lower lip (example landmark points)
  for (let point of [146, 91, 181, 84, 17]) {
    landmarks[point].y +=
      lipExpandFactor * (landmarks[point].y - landmarks[13].y);
  }

  drawLandmarks(landmarks);
}

function enlargeEyes(landmarks) {
  const eyeExpandFactor = 1.2;

  // Left eye
  for (let point of [33, 7, 144, 153, 154]) {
    landmarks[point].x -=
      eyeExpandFactor * (landmarks[33].x - landmarks[168].x);
    landmarks[point].y -=
      eyeExpandFactor * (landmarks[33].y - landmarks[168].y);
  }

  // Right eye
  for (let point of [263, 249, 390, 373, 374]) {
    landmarks[point].x +=
      eyeExpandFactor * (landmarks[263].x - landmarks[168].x);
    landmarks[point].y -=
      eyeExpandFactor * (landmarks[263].y - landmarks[168].y);
  }

  drawLandmarks(landmarks);
}

function clearBlemishes() {
  // Implement basic blemish clearing logic
}

function drawLandmarks(landmarks) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.beginPath();
  for (const point of landmarks) {
    canvasCtx.lineTo(
      point.x * canvasElement.width,
      point.y * canvasElement.height
    );
  }
  canvasCtx.stroke();
}
