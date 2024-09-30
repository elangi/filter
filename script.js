// script.js

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const toggleButton = document.getElementById('toggleFilter');
let filterActive = false;

// Load Face-api.js models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
]).then(startVideo).catch(err => {
    console.error("Error loading Face-api.js models:", err);
});

function startVideo() {
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "user", // Front camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing the camera: ", err);
    });
}

video.addEventListener('play', () => {
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        if (!filterActive) {
            // Clear canvas if filter is not active
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear canvas before drawing
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Apply filters
        resizedDetections.forEach(detection => {
            const landmarks = detection.landmarks;

            // Example: Slim nose (this is a simplistic approach)
            const nose = landmarks.getNose();
            // Implement your nose slimming logic here

            // Example: Enlarge lips
            const mouth = landmarks.getMouth();
            // Implement your lip enlarging logic here

            // Example: Clear blemishes
            // Implement your blemish removal logic here

            // For demonstration, let's draw the landmarks
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        });
    }, 100);
});

toggleButton.addEventListener('click', () => {
    filterActive = !filterActive;
    toggleButton.textContent = filterActive ? 'Disable Filter' : 'Enable Filter';
});
