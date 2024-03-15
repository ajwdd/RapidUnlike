//┌─────────────────────────────────────────────────────┐
//│  ____             _     _ _   _       _ _ _         │
//│ |  _ \ __ _ _ __ (_) __| | | | |_ __ | (_) | _____  │
//│ | |_) / _` | '_ \| |/ _` | | | | '_ \| | | |/ / _ \ │
//│ |  _ < (_| | |_) | | (_| | |_| | | | | | |   <  __/ │
//│ |_| \_\__,_| .__/|_|\__,_|\___/|_| |_|_|_|_|\_\___| │
//│            |_|   https://github.com/ajwdd           │
//└─────────────────────────────────────────────────────┘

// Configuration
const config = {
  MAX_UNLIKES: 5500,
  BASE_WAIT_TIME: 100,
  INCREMENT_WAIT: 200,
  DECREMENT_WAIT: 50,
  RETRY_COUNT: 3,
  RATE_LIMIT_WINDOW: 60 * 1000,
  RATE_LIMIT_MAX_UNLIKES: 50,
  PROGRESS_REPORT_INTERVAL: 60 * 1000,
};

// Helper functions
function fetchLikes(lastButton = null) {
  const buttons = document.querySelectorAll('[data-testid="unlike"]');
  if (lastButton) {
    const lastButtonIndex = Array.from(buttons).findIndex(
      (button) => button === lastButton
    );
    return Array.from(buttons).slice(lastButtonIndex + 1);
  }
  return buttons;
}

function fetchTweetText(button) {
  const tweetElement = button
    .closest("article")
    .querySelector('[data-testid="tweetText"]');
  return tweetElement ? tweetElement.textContent : "No text found";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function saveProgress(count) {
  localStorage.setItem("totalUnlikeCount", count);
}

function loadProgress() {
  return localStorage.getItem("totalUnlikeCount") || 0;
}

// UI elements
const uiContainer = document.createElement("div");
uiContainer.style.position = "fixed";
uiContainer.style.top = "10px";
uiContainer.style.right = "10px";
uiContainer.style.backgroundColor = "#333";
uiContainer.style.color = "#fff";
uiContainer.style.padding = "10px";
uiContainer.style.zIndex = "9999";

const startButton = document.createElement("button");
startButton.textContent = "Start";
startButton.style.marginRight = "10px";
const stopButton = document.createElement("button");
stopButton.textContent = "Stop";
stopButton.disabled = true;
stopButton.style.marginRight = "10px";
const pauseButton = document.createElement("button");
pauseButton.textContent = "Pause";
pauseButton.disabled = true;
pauseButton.style.marginRight = "10px";
const resumeButton = document.createElement("button");
resumeButton.textContent = "Resume";
resumeButton.disabled = true;
const statusText = document.createElement("div");
statusText.style.marginTop = "10px";
const errorText = document.createElement("div");
errorText.style.marginTop = "5px";

uiContainer.appendChild(startButton);
uiContainer.appendChild(stopButton);
uiContainer.appendChild(pauseButton);
uiContainer.appendChild(resumeButton);
uiContainer.appendChild(statusText);
uiContainer.appendChild(errorText);
document.body.appendChild(uiContainer);

let isRunning = false;
let isPaused = false;
let shouldStop = false;
let unlikeCount = 0;
let totalUnlikeCount = loadProgress();
let errorCount = 0;
let waitTime = config.BASE_WAIT_TIME;
let lastUnlikeTime = Date.now();
let lastProcessedButton = null;

async function unlikeAll() {
  isRunning = true;
  isPaused = false;
  shouldStop = false;
  startButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;
  resumeButton.disabled = true;

  const startTime = performance.now();
  let likeButtons = fetchLikes();
  let retryCount = 0;

  while (
    likeButtons.length > 0 &&
    unlikeCount < config.MAX_UNLIKES &&
    !shouldStop
  ) {
    for (const button of likeButtons) {
      if (isPaused) {
        await waitForResume();
      }

      if (shouldStop) {
        break;
      }

      try {
        const tweetText = fetchTweetText(button).slice(0, 150);
        console.log(`Unliking tweet: "${tweetText}"`);
        button.click();
        console.log(`%cUnliked ${++unlikeCount} tweets`, "color: aqua;");
        totalUnlikeCount++;
        saveProgress(totalUnlikeCount);
        updateUI();
        await wait(waitTime);

        // Adaptive timing
        if (waitTime > 1000 && errorCount === 0) {
          waitTime -= config.DECREMENT_WAIT;
        }

        // Rate limiting
        const now = Date.now();
        const elapsedTime = now - lastUnlikeTime;
        if (elapsedTime < config.RATE_LIMIT_WINDOW) {
          const unlikes = unlikeCount - loadProgress();
          if (unlikes >= config.RATE_LIMIT_MAX_UNLIKES) {
            const remainingTime = config.RATE_LIMIT_WINDOW - elapsedTime;
            console.log(
              `Rate limit reached, waiting ${remainingTime / 1000} seconds`
            );
            await wait(remainingTime);
          }
        }
        lastUnlikeTime = now;
        retryCount = 0;
        lastProcessedButton = button;
      } catch (error) {
        console.error(`%cError unliking tweet: ${error}`, "color: red;");
        errorCount++;
        updateError(error);
        waitTime += config.INCREMENT_WAIT;
        retryCount++;

        if (retryCount >= config.RETRY_COUNT) {
          break;
        }
      }
    }

    if (errorCount === 0 && likeButtons.length > 0) {
      window.scrollTo(0, document.body.scrollHeight);
      await wait(3000);
      likeButtons = fetchLikes(lastProcessedButton);
    } else {
      errorCount = 0;
    }
  }

  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000;
  console.log(`%cUnliked this session: ${unlikeCount}`, "color: aquamarine;");
  console.log(
    `%cTotal unliked with RapidUnlike = ${totalUnlikeCount}`,
    "color: aquamarine;"
  );
  console.log(
    `%cTotal time taken: ${totalTime.toFixed(2)} seconds`,
    "color: aquamarine;"
  );

  isRunning = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  pauseButton.disabled = true;
  resumeButton.disabled = true;
  unlikeCount = 0;
}

function updateUI() {
  statusText.textContent = `Unliked this session: ${unlikeCount} | Total unliked with RapidUnlike: ${totalUnlikeCount}`;

  if (isRunning && !shouldStop) {
    setTimeout(updateUI, config.PROGRESS_REPORT_INTERVAL);
  }
}

function updateError(error) {
  errorText.textContent = `Error: ${error}`;
}

function waitForResume() {
  return new Promise((resolve) => {
    const checkResume = () => {
      if (!isPaused) {
        resolve();
      } else {
        setTimeout(checkResume, 1000);
      }
    };
    checkResume();
  });
}

startButton.addEventListener("click", unlikeAll);
stopButton.addEventListener("click", () => {
  shouldStop = true;
});
pauseButton.addEventListener("click", () => {
  isPaused = true;
  pauseButton.disabled = true;
  resumeButton.disabled = false;
});
resumeButton.addEventListener("click", () => {
  isPaused = false;
  pauseButton.disabled = false;
  resumeButton.disabled = true;
});
