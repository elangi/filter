const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Start video feed
async function startVideo() {
  const video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });
    video.srcObject = stream;
    console.log("Video stream started successfully");
  } catch (error) {
    console.error("Error accessing the camera: ", error);
  }
}

// Load face-api.js models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models/dist"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models/dist"),
]).then(() => {
  video.addEventListener("play", () => {
    const renderInterval = setInterval(() => detectAndRender(), 100);
  });
});

async function detectAndRender() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Detect face and landmarks
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();
  if (!detections.length) return;

  detections.forEach((detection) => {
    const landmarks = detection.landmarks;
    applyAugmentations(landmarks);
  });
}

// Apply transformations to facial landmarks
function applyAugmentations(landmarks) {
  // Slim nose
  slimNose(landmarks.getNose());

  // Plump lips
  plumpLips(landmarks.getMouth());

  // Enlarge eyes
  enlargeEyes(landmarks.getLeftEye(), landmarks.getRightEye());

  // Clear blemishes
  clearBlemishes();
}

// Slim nose function
function slimNose(nose) {
  const [left, right] = [nose[1], nose[2]];
  const noseGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.05);
  const noseMaterial = new THREE.MeshBasicMaterial({ color: 0xffcccc });
  const noseMesh = new THREE.Mesh(noseGeometry, noseMaterial);

  noseMesh.position.set(
    (left.x + right.x) / 2 / video.videoWidth - 0.5,
    -(left.y + right.y) / 2 / video.videoHeight + 0.5,
    -0.5
  );
  scene.add(noseMesh);
}

// Plump lips function
function plumpLips(mouth) {
  const lipGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.05);
  const lipMaterial = new THREE.MeshBasicMaterial({ color: 0xff9999 });
  const lipMesh = new THREE.Mesh(lipGeometry, lipMaterial);

  const topLip = mouth[3];
  lipMesh.position.set(
    topLip.x / video.videoWidth - 0.5,
    -topLip.y / video.videoHeight + 0.5,
    -0.5
  );
  scene.add(lipMesh);
}

// Enlarge eyes function
function enlargeEyes(leftEye, rightEye) {
  const eyeGeometry = new THREE.CircleGeometry(0.08, 32);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff });

  const leftEyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
  const rightEyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);

  leftEyeMesh.position.set(
    leftEye[0].x / video.videoWidth - 0.5,
    -leftEye[0].y / video.videoHeight + 0.5,
    -0.5
  );

  rightEyeMesh.position.set(
    rightEye[0].x / video.videoWidth - 0.5,
    -rightEye[0].y / video.videoHeight + 0.5,
    -0.5
  );

  scene.add(leftEyeMesh);
  scene.add(rightEyeMesh);
}

// Clear blemishes function
function clearBlemishes() {
  // Clear area around detected face region
  const faceArea = new THREE.PlaneGeometry(1, 1);
  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  const faceMesh = new THREE.Mesh(faceArea, faceMaterial);
  faceMesh.position.z = -1;
  scene.add(faceMesh);
}

// Animate and render Three.js scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
