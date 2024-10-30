const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Start video streaming
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => console.error("Error accessing camera: ", err));

// Initialize tracking.js for face detection
tracking.track("#video", new tracking.ObjectTracker("face"), { camera: true });

tracking.on("track", function (event) {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  if (event.data.length > 0) {
    event.data.forEach(function (rect) {
      // Draw a rectangle around the detected face
      ctx.strokeStyle = "#00FF00"; // Green border
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      // Call adjustment functions
      adjustFacialFeatures(rect);
    });
  }
});

function adjustFacialFeatures(faceRect) {
  // Example adjustments based on detected face rectangle
  slimNose(faceRect);
  plumpLips(faceRect);
  enlargeEyes(faceRect);
  clearBlemishes(faceRect);
}

function slimNose(faceRect) {
  // Adjust nose position and size based on faceRect
  ctx.drawImage(
    video,
    faceRect.x + 20,
    faceRect.y + 50,
    30,
    60,
    faceRect.x + 40,
    faceRect.y + 40,
    15,
    40
  );
}

function plumpLips(faceRect) {
  // Adjust lip position and size based on faceRect
  ctx.drawImage(
    video,
    faceRect.x + 20,
    faceRect.y + 110,
    80,
    20,
    faceRect.x + 10,
    faceRect.y + 110,
    100,
    30
  );
}

function enlargeEyes(faceRect) {
  // Adjust eye position and size based on faceRect
  ctx.drawImage(
    video,
    faceRect.x + 10,
    faceRect.y + 30,
    50,
    30,
    faceRect.x,
    faceRect.y + 30,
    70,
    50
  );
}

function clearBlemishes(faceRect) {
  // Example blemish removal based on faceRect
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Light color to cover blemishes
  ctx.fillRect(faceRect.x + 30, faceRect.y + 80, 50, 50); // Example blemish area
}
