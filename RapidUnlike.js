//┌─────────────────────────────────────────────────────┐
//│  ____             _     _ _   _       _ _ _         │
//│ |  _ \ __ _ _ __ (_) __| | | | |_ __ | (_) | _____  │
//│ | |_) / _` | '_ \| |/ _` | | | | '_ \| | | |/ / _ \ │
//│ |  _ < (_| | |_) | | (_| | |_| | | | | | |   <  __/ │
//│ |_| \_\__,_| .__/|_|\__,_|\___/|_| |_|_|_|_|\_\___| │
//│            |_|   https://github.com/ajwdd           │
//└─────────────────────────────────────────────────────┘

// Configuration settings
const config = {
  MAX_UNLIKES: 15000, // Maximum number of tweets to unlike in a session
  RATE_LIMIT_WINDOW: 60 * 1000, // Time window for rate limiting (in milliseconds)
  RATE_LIMIT_MAX_UNLIKES: 60, // Maximum unlikes allowed within the rate limit window
  TOKEN_REFILL_RATE: 60 / (60 * 1000), // Rate at which tokens are refilled (per millisecond)
  PROGRESS_REPORT_INTERVAL: 60 * 1000, // Interval for reporting progress (in milliseconds)
  BASE_WAIT_TIME: 250, // Base wait time between actions (in milliseconds)
  INCREMENT_WAIT: 200, // Incremental wait time added after errors (in milliseconds)
  DECREMENT_WAIT: 50, // Decremental wait time reduced after successful actions (in milliseconds)
  RETRY_COUNT: 3, // Number of retries allowed for errors
};

// Injects custom CSS for "ghost" button styling
const ghostStyle = document.createElement("style");
ghostStyle.textContent = `
  .ghost { opacity: 0.5; pointer-events: none; }
`;
document.head.appendChild(ghostStyle);

// Rate limiter to manage API request limits
const rateLimiter = {
  tokens: config.RATE_LIMIT_MAX_UNLIKES, // Initial token count
  lastRefill: Date.now(), // Timestamp of the last token refill
  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const toAdd = elapsed * config.TOKEN_REFILL_RATE;
    this.tokens = Math.min(config.RATE_LIMIT_MAX_UNLIKES, this.tokens + toAdd);
    this.lastRefill = now;
  },
  async removeToken() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const needed = 1 - this.tokens;
    const waitMs = needed / config.TOKEN_REFILL_RATE;
    console.log(`Token bucket empty — waiting ${waitMs.toFixed(0)}ms`);
    await wait(waitMs);
    this.refill();
    this.tokens -= 1;
  },
};

// Utility function to pause execution for a specified duration
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Attempts to get the CSRF token from cookies
function getCsrfToken() {
  const match = document.cookie.match(/ct0=([^;]+)/);
  return match ? match[1] : null;
}

// Attempts to get the authorization token from the global state
function getAuthToken() {
  try {
    return window.__INITIAL_STATE__.config.authorization.replace("Bearer ", "");
  } catch {
    return null;
  }
}

// Extracts the tweet ID from a button element
function extractTweetId(btn) {
  const link = btn.closest("article").querySelector('a[href*="/status/"]');
  return link ? link.href.split("/").pop() : null;
}

// Fetches the text content of a tweet
function fetchTweetText(btn) {
  const tweetElement = btn
    .closest("article")
    .querySelector('[data-testid="tweetText"]');
  return tweetElement ? tweetElement.textContent : "No text";
}

// Saves the progress of unliked tweets to local storage
function saveProgress(count) {
  localStorage.setItem("totalUnlikeCount", count);
}

// Loads the progress of unliked tweets from local storage
function loadProgress() {
  return parseInt(localStorage.getItem("totalUnlikeCount") || "0", 10);
}

// UI setup for displaying controls and status
const uiContainer = document.createElement("div");
Object.assign(uiContainer.style, {
  position: "fixed", // Fixes the UI container to a specific position on the screen
  top: "10px", // Distance from the top of the screen
  right: "10px", // Distance from the right of the screen
  width: "260px", // Width of the container
  backgroundColor: "#333", // Background color of the container
  color: "#fff", // Text color
  padding: "15px", // Padding inside the container
  borderRadius: "4px", // Rounded corners for the container
  zIndex: 9999, // Ensures the container appears above other elements
  fontFamily: "sans-serif", // Font style for the text
  textAlign: "center", // Centers the text inside the container
});
document.body.appendChild(uiContainer); // Adds the container to the document body

// Close button for the UI container
const closeBtn = document.createElement("span");
Object.assign(closeBtn.style, {
  position: "absolute", // Positions the button relative to the container
  top: "5px", // Distance from the top of the container
  right: "8px", // Distance from the right of the container
  cursor: "pointer", // Changes the cursor to a pointer when hovering
  fontSize: "16px", // Font size of the button
  fontWeight: "bold", // Makes the button text bold
});
closeBtn.textContent = "×"; // Sets the text content of the button
uiContainer.appendChild(closeBtn); // Adds the close button to the container

// Control buttons for starting, stopping, pausing, and resuming
const startBtn = document.createElement("button");
const stopBtn = document.createElement("button");
const pauseBtn = document.createElement("button");
const resumeBtn = document.createElement("button");
[startBtn, stopBtn, pauseBtn, resumeBtn].forEach((b) => {
  b.style.margin = "5px"; // Adds margin around each button
  uiContainer.appendChild(b); // Adds each button to the container
});
startBtn.textContent = "Start"; // Label for the start button
stopBtn.textContent = "Stop"; // Label for the stop button
pauseBtn.textContent = "Pause"; // Label for the pause button
resumeBtn.textContent = "Resume"; // Label for the resume button

// Status and error text elements
const statusText = document.createElement("div");
const errorText = document.createElement("div");
const preloadText = document.createElement("div");
statusText.style.marginTop = "10px"; // Adds margin above the status text
errorText.style.marginTop = "4px"; // Adds margin above the error text
preloadText.style.marginTop = "10px"; // Adds margin above the preload text
preloadText.style.fontWeight = "bold"; // Makes the preload text bold
uiContainer.append(statusText, errorText, preloadText); // Adds the text elements to the container

// State variables to manage the script's execution state
let isRunning = false, // Indicates if the script is currently running
  isPaused = false, // Indicates if the script is paused
  shouldStop = false; // Indicates if the script should stop

// Counters and timers for tracking progress and errors
let sessionCount = 0, // Number of tweets unliked in the current session
  totalCount = loadProgress(), // Total number of tweets unliked (loaded from storage)
  errorCount = 0, // Number of consecutive errors encountered
  waitTime = config.BASE_WAIT_TIME; // Current wait time between actions

// Set to track processed tweet IDs
const processed = new Set();

// Variables for managing animations and observers
let observer, // Mutation observer for detecting new tweets
  preloadAnimId, // ID for preload animation interval
  preloadCountdownId, // ID for preload countdown interval
  preloadScrollerId, // ID for preload scrolling interval
  preloadTimeoutId, // ID for preload timeout
  statusAnimId; // ID for status animation interval

// Updates the state of control buttons based on the script's current state
function updateButtonStates() {
  [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
    (b) => b.classList.add("ghost") // Disables all buttons initially
  );
  if (!isRunning && !isPaused) startBtn.classList.remove("ghost"); // Enable "Start" if not running or paused
  if (isRunning && !isPaused)
    [stopBtn, pauseBtn].forEach((b) => b.classList.remove("ghost")); // Enable "Stop" and "Pause" if running
  if (isRunning && isPaused)
    [stopBtn, resumeBtn].forEach((b) => b.classList.remove("ghost")); // Enable "Stop" and "Resume" if paused
}
updateButtonStates(); // Initialize button states

// Logic for the close button to stop the script and clean up resources
closeBtn.addEventListener("click", () => {
  shouldStop = true; // Signal the script to stop
  isRunning = false; // Set running state to false
  isPaused = false; // Set paused state to false
  updateButtonStates(); // Update button states
  if (observer) observer.disconnect(); // Disconnect the mutation observer
  clearInterval(preloadAnimId); // Clear preload animation interval
  clearInterval(preloadCountdownId); // Clear preload countdown interval
  clearInterval(preloadScrollerId); // Clear preload scrolling interval
  clearTimeout(preloadTimeoutId); // Clear preload timeout
  clearInterval(statusAnimId); // Clear status animation interval
  document.head.removeChild(ghostStyle); // Remove injected CSS
  document.body.removeChild(uiContainer); // Remove the UI container
});

// Preload helper function to load tweets for a specified duration
async function preloadTweets(durationMs) {
  return new Promise((resolve) => {
    console.log(
      `
┌─────────────────────────────────────────────────────┐
│  ____             _     _ _   _       _ _ _         │
│ |  _ \\ __ _ _ __ (_) __| | | | |_ __ | (_) | _____  │
│ | |_) / _\` | '_ \\| |/ _\` | | | | '_ \\| | | |/ / _ \\ │
│ |  _ < (_| | |_) | | (_| | |_| | | | | | |   <  __/ │
│ |_| \\_\\__,_| .__/|_|\\__,_|\\___/|_| |_|_|_|_|\\_\\___| │
│            |_|   https://github.com/ajwdd           │
└─────────────────────────────────────────────────────┘
`
    );
    console.log("Preload started");

    const start = Date.now();
    let dots = 0;

    // Animation for preload status
    preloadAnimId = setInterval(() => {
      dots = (dots % 3) + 1;
      preloadText.textContent = `Preloading ${".".repeat(dots)}`;
    }, 1000);

    // Countdown timer for preload duration
    preloadCountdownId = setInterval(() => {
      const elapsed = Date.now() - start;
      const remain = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      preloadText.textContent = `Preloading ${".".repeat(dots)} (${remain}s)`;
    }, 1000);

    // Scroll periodically to load more tweets
    preloadScrollerId = setInterval(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 2000);

    // Resolve the preload process after the specified duration
    preloadTimeoutId = setTimeout(() => {
      clearInterval(preloadAnimId);
      clearInterval(preloadCountdownId);
      clearInterval(preloadScrollerId);
      window.scrollTo(0, 0);
      console.log("Preload finished");
      resolve();
    }, durationMs);
  });
}

// Observer to detect new tweets in the main container
const mainContainer = document.querySelector('main[role="main"]');
if (mainContainer) {
  observer = new MutationObserver((records) => {
    if (!isRunning || isPaused) return; // Skip processing if not running or paused
    unlikeNext(); // Process the next tweet
  });
  observer.observe(mainContainer, { childList: true, subtree: true }); // Observe changes in the DOM
}

// Function to handle unliking the next tweet
async function unlikeNext() {
  if (shouldStop) return; // Exit if the script should stop

  // Find the next "unlike" button that hasn't been processed
  const btns = Array.from(document.querySelectorAll('[data-testid="unlike"]'));
  const btn = btns.find((b) => {
    const id = extractTweetId(b);
    return id && !processed.has(id);
  });
  if (!btn) return; // Exit if no button is found

  const tid = extractTweetId(btn); // Extract the tweet ID
  btn.scrollIntoView({ block: "center" }); // Scroll to the button
  await wait(200); // Wait for the scroll to complete
  await rateLimiter.removeToken(); // Ensure rate limits are respected

  try {
    const csrf = getCsrfToken(), // Retrieve CSRF token
      auth = getAuthToken(); // Retrieve authorization token

    // Perform the unlike action via API or fallback to button click
    if (tid && csrf && auth) {
      const res = await fetch(
        `https://api.twitter.com/1.1/favorites/destroy.json?id=${tid}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "x-csrf-token": csrf,
            authorization: `Bearer ${auth}`,
            "content-type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`); // Handle HTTP errors

      // Calculate delay based on rate limit headers
      const rem = +res.headers.get("x-rate-limit-remaining"),
        reset = +res.headers.get("x-rate-limit-reset") * 1000,
        now = Date.now(),
        base =
          rem > 0 ? Math.max((reset - now) / rem, 0) : config.RATE_LIMIT_WINDOW;
      const delay = base * (0.8 + Math.random() * 0.4);
      await wait(delay); // Wait for the calculated delay
    } else {
      btn.click(); // Fallback to clicking the button
    }

    processed.add(tid); // Mark the tweet as processed
    console.log(`Unliked: "${fetchTweetText(btn).slice(0, 150)}"`); // Log the unliked tweet
    console.log(`%cSession: ${++sessionCount}`, "color:darkseagreen;"); // Log session progress
    totalCount++;
    saveProgress(totalCount); // Save progress to local storage
    statusText.textContent = `Session: ${sessionCount} | Total: ${totalCount}`; // Update status text
    errorCount = 0; // Reset error count
    await wait(waitTime); // Wait for the configured time
    if (waitTime > 1000 && errorCount === 0) waitTime -= config.DECREMENT_WAIT; // Decrease wait time on success
  } catch (e) {
    console.error(e); // Log the error
    errorText.textContent = `Error: ${e.message || e}`; // Display the error message
    errorCount++; // Increment error count
    waitTime += config.INCREMENT_WAIT; // Increase wait time on error
    if (errorCount >= config.RETRY_COUNT) shouldStop = true; // Stop the script after exceeding retry count
  }
}

startBtn.addEventListener("click", async () => {
  shouldStop = false;
  // Reset session and processed tweets to start from top
  processed.clear();
  sessionCount = 0;
  // Hide controls
  [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
    (b) => (b.style.display = "none")
  );
  // Preload tweets for 10s
  await preloadTweets(10000);
  // Ensure scroll top and allow time for content to settle
  window.scrollTo(0, 0);
  await wait(5000);
  // Restore controls
  [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
    (b) => (b.style.display = "")
  );
  updateButtonStates();
  preloadText.textContent = "";

  isRunning = true;
  isPaused = false;
  unlikeAll();
});

// Button logic
stopBtn.addEventListener("click", () => {
  // Ensure pausing state is reset so start unghosts
  isPaused = false;
  shouldStop = true;
  isRunning = false;
  clearInterval(preloadAnimId);
  clearInterval(preloadCountdownId);
  clearInterval(preloadScrollerId);
  clearTimeout(preloadTimeoutId);
  clearInterval(statusAnimId);
  [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
    (b) => (b.style.display = "none")
  );
  statusText.style.display = "none";
  animateStatus("Stopping", 3000);
});

pauseBtn.addEventListener("click", () => {
  isPaused = true;
  clearInterval(statusAnimId);
  [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
    (b) => (b.style.display = "none")
  );
  statusText.style.display = "none";
  animateStatus("Pausing", 3000);
});

resumeBtn.addEventListener("click", () => {
  isPaused = false;
  clearInterval(statusAnimId);
  [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
    (b) => (b.style.display = "none")
  );
  statusText.style.display = "none";
  animateStatus("Resuming", 3000);
});

// Animation helper
function animateStatus(label, duration) {
  let dots = 0;
  statusAnimId = setInterval(() => {
    dots = (dots % 3) + 1;
    preloadText.textContent = `${label} ${".".repeat(dots)}`;
  }, 1000);
  setTimeout(() => {
    clearInterval(statusAnimId);
    preloadText.textContent = "";
    [startBtn, stopBtn, pauseBtn, resumeBtn].forEach(
      (b) => (b.style.display = "")
    );
    statusText.style.display = "";
    updateButtonStates();
  }, duration);
}

// Main unlike function
async function unlikeAll() {
  updateButtonStates(); // Update button states before starting
  while (!shouldStop && sessionCount < config.MAX_UNLIKES) {
    while (isPaused) await wait(500); // Wait if the script is paused
    await unlikeNext(); // Attempt to unlike the next tweet
    if (!document.querySelector('[data-testid="unlike"]')) {
      window.scrollTo(0, document.body.scrollHeight); // Scroll to load more tweets
      await wait(2000); // Wait for tweets to load
    }
  }
  console.log(`Finished: session=${sessionCount}, total=${totalCount}`); // Log completion
  isRunning = false; // Reset running state
  isPaused = false; // Reset paused state
  sessionCount = 0; // Reset session count
  updateButtonStates(); // Update button states after completion
}
