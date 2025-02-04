// Copyright (c) 2022 8th Wall, Inc.

console.log("app.js is running");

// The AR content to load in the iframe.
const INNER_FRAME_URL = "https://juliacoffey.8thwall.app/facemorph/";

// User control elements for the iframe AR experience.
const IFRAME_ID = "my-iframe"; // iframe containing AR content.
const CONTROLS_ID = "iframeControls"; // Top bar including Stop Button and Expand Button.
const START_BTN_ID = "startBtn"; // Button to start AR.
const STOP_BTN_ID = "stopBtn"; // Button to stop AR.
const EXPAND_BTN_ID = "expandBtn"; // Button to expand AR iframe to fill screen.
const LOGO_ID = "poweredByLogo"; // Powered by 8th Wall logo

// CSS classes for toggling appearance of elements when the iframe is full screen.
const FULLSCREEN_IFRAME_CLASS = "fullscreen-iframe";
const FULLSCREEN_CONTROLS_CLASS = "fullscreen-iframeControls";
const FULLSCREEN_EXPAND_BTN_CLASS = "fullscreen-btn";
const FULLSCREEN_STOP_BTN_CLASS = "hidden";

// Handles stop AR button behavior; also called when scrolled away from active AR iframe.
const stopAR = () => {
  // LEGACY METHOD ONLY: deregisters the XRIFrame
  // window.XRIFrame.deregisterXRIFrame()

  const controls = document.getElementById(CONTROLS_ID);
  controls.style.opacity = 1;
  controls.classList.remove("fade-in");
  controls.classList.add("fade-out");

  const startBtn = document.getElementById(START_BTN_ID);
  startBtn.style.opacity = 0;
  startBtn.style.display = "block";
  startBtn.classList.remove("fade-out");
  startBtn.classList.add("fade-in");

  const poweredByLogo = document.getElementById(LOGO_ID);
  poweredByLogo.style.opacity = 0;
  poweredByLogo.style.display = "block";
  poweredByLogo.classList.remove("fade-out");
  poweredByLogo.classList.add("fade-in");

  // removes AR iframe's source to end AR session
  document.getElementById(IFRAME_ID).setAttribute("src", "");

  const styleCleanup = setTimeout(() => {
    startBtn.style.opacity = 1;
    startBtn.classList.remove("fade-in");

    poweredByLogo.style.opacity = 1;
    poweredByLogo.classList.remove("fade-in");

    controls.style.display = "none";
    controls.style.opacity = 0;
    controls.classList.remove("fade-out");
  }, 300);

  setTimeout(() => {
    clearTimeout(styleCleanup);
  }, 900);
};

// Create an interaction observer that stops AR when the user scrolls away from active AR session.
const createObserver = () => {
  let cameraActive;

  const handleIntersect = (entries, observer) => {
    entries.forEach((entry) => {
      if (cameraActive && !entry.isIntersecting) {
        stopAR();
        cameraActive = false;
      }
    });
  };

  window.addEventListener("message", (event) => {
    if (event.data === "acceptedCamera") {
      cameraActive = true;
    }
  });

  // How much of the iframe is still visible when scrolling away before stopping AR.
  const options = { threshold: 0.2 };

  new IntersectionObserver(handleIntersect, options).observe(
    document.getElementById(IFRAME_ID)
  );
};

// Handles fullscreen button behavior
const toggleFullscreen = () => {
  document.getElementById(IFRAME_ID).classList.toggle(FULLSCREEN_IFRAME_CLASS);
  document
    .getElementById(CONTROLS_ID)
    .classList.toggle(FULLSCREEN_CONTROLS_CLASS);
  document
    .getElementById(EXPAND_BTN_ID)
    .classList.toggle(FULLSCREEN_EXPAND_BTN_CLASS);
  document
    .getElementById(STOP_BTN_ID)
    .classList.toggle(FULLSCREEN_STOP_BTN_CLASS);
};

// Handles start AR button behavior.
const startAR = () => {
  // LEGACY METHOD ONLY: registers the XRIFrame by iframe ID
  // window.XRIFrame.registerXRIFrame(IFRAME_ID)

  const iframe = document.getElementById(IFRAME_ID);
  const controls = document.getElementById(CONTROLS_ID);

  const startBtn = document.getElementById(START_BTN_ID);
  startBtn.classList.add("fade-out");

  const poweredByLogo = document.getElementById(LOGO_ID);
  poweredByLogo.classList.add("fade-out");

  // checks if camera has been accepted in iframe before displaying controls
  window.addEventListener("message", (event) => {
    if (event.data !== "acceptedCamera") {
      return;
    }

    controls.style.opacity = 0;

    const styleCleanup = setTimeout(() => {
      startBtn.style.display = "none";
      poweredByLogo.style.display = "none";

      controls.style.display = "block";
    }, 300);

    const uiFadeIn = setTimeout(() => {
      controls.classList.add("fade-in");
    }, 800);

    setTimeout(() => {
      clearTimeout(styleCleanup);
      clearTimeout(uiFadeIn);
    }, 900);
  });

  iframe.setAttribute("src", INNER_FRAME_URL); // This is where the AR iframe's source is set.
};

// Set up.
const onLoad = () => {
  createObserver(); // handles intersection observer behavior
  dateCheck(); // sets today's date in the article
};

// Add event listeners and callbacks for the body DOM.
window.addEventListener("load", onLoad, false);
window.toggleFullscreen = toggleFullscreen;
window.startAR = startAR;
window.stopAR = stopAR;
