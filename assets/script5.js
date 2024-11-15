const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// Start video streaming
async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

startVideo();

// Load face-api.js models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(() => {
  video.addEventListener("play", () => {
    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

      detections.forEach((detection) => {
        const landmarks = detection.landmarks;

        // Slim nose
        adjustNose(landmarks);

        // Plump lips
        adjustLips(landmarks);

        // Enlarge eyes
        adjustEyes(landmarks);

        // Clear blemishes
        clearBlemishes(detection.detection.box);
      });
    }, 100);
  });
});

// Slim nose function
function adjustNose(landmarks) {
  const nose = landmarks.getNose();
  const noseTip = nose[3];
  ctx.drawImage(
    video,
    noseTip.x - 10,
    noseTip.y - 10,
    20,
    40,
    noseTip.x - 5,
    noseTip.y - 10,
    10,
    40
  );
}

// Plump lips function
function adjustLips(landmarks) {
  const mouth = landmarks.getMouth();
  const [topLip, bottomLip] = [mouth[3], mouth[9]];

  ctx.drawImage(
    video,
    topLip.x - 20,
    topLip.y - 10,
    40,
    bottomLip.y - topLip.y + 20,
    topLip.x - 30,
    topLip.y - 10,
    60,
    bottomLip.y - topLip.y + 40
  );
}

// Enlarge eyes function
function adjustEyes(landmarks) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  leftEye.forEach((point, i) => {
    if (i === 1 || i === 5) {
      // Upper and lower middle points of eye
      ctx.drawImage(
        video,
        point.x - 10,
        point.y - 10,
        20,
        20,
        point.x - 15,
        point.y - 15,
        30,
        30
      );
    }
  });

  rightEye.forEach((point, i) => {
    if (i === 1 || i === 5) {
      // Upper and lower middle points of eye
      ctx.drawImage(
        video,
        point.x - 10,
        point.y - 10,
        20,
        20,
        point.x - 15,
        point.y - 15,
        30,
        30
      );
    }
  });
}

// Clear blemishes
function clearBlemishes(faceBox) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(
    faceBox.x + 20,
    faceBox.y + 50,
    faceBox.width - 40,
    faceBox.height - 100
  );
}
