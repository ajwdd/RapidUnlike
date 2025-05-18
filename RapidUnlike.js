//┌─────────────────────────────────────────────────────┐
//│  ____             _     _ _   _       _ _ _         │
//│ |  _ \ __ _ _ __ (_) __| | | | |_ __ | (_) | _____  │
//│ | |_) / _` | '_ \| |/ _` | | | | '_ \| | | |/ / _ \ │
//│ |  _ < (_| | |_) | | (_| | |_| | | | | | |   <  __/ │
//│ |_| \_\__,_| .__/|_|\__,_|\___/|_| |_|_|_|_|\_\___| │
//│  v1.0.0    |_|   https://github.com/ajwdd           │
//└─────────────────────────────────────────────────────┘

// Configuration settings
const config = {
  MAX_UNLIKES: 15000,
  RATE_LIMIT_WINDOW: 60 * 1000,
  RATE_LIMIT_MAX_UNLIKES: 60,
  TOKEN_REFILL_RATE: 60 / (60 * 1000),
  PROGRESS_REPORT_INTERVAL: 60 * 1000,
  BASE_WAIT_TIME: 50,
  INCREMENT_WAIT: 150,
  DECREMENT_WAIT: 50,
  RETRY_COUNT: 3,
};

const PRELOAD_TRANSITION_MS = 250;
const FAST_TRANSITION_MS = 150;

const enhancedStyles = document.createElement("style");
enhancedStyles.textContent = `
  :root {
    --primary-color: #1DA1F2;
    --primary-hover-color: #0c85d0;
    --danger-color: #E0245E;
    --danger-hover-color: #c01f4c;
    --warning-color: #F5A623; 
    --warning-hover-color: #D89620;
    --success-color: #17BF63;
    --success-hover-color: #14a353;
    --text-color: #e1e8ed;
    --bg-color: rgba(21, 32, 43, 0.97);
    --border-color: rgba(56, 68, 77, 0.7);
    --container-shadow: rgba(0, 0, 0, 0.6);
    --button-shadow: rgba(0, 0, 0, 0.3);
    --border-radius: 12px;
    --transition-speed-fast: 0.15s;
    --transition-speed-medium: 0.25s;
    --transition-speed-slow: 0.4s;
  }
  .twitter-unliker-ui {
    position: fixed; top: 20px; right: 20px; width: 300px;
    background-color: var(--bg-color); color: var(--text-color);
    padding: 20px; border-radius: var(--border-radius); z-index: 100000;
    font-family: "TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    box-shadow: 0 8px 25px var(--container-shadow);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    opacity: 0; transform: translateY(-20px);
    display: flex; flex-direction: column; align-items: center;
  }
  .ui-container-enter { animation: fadeInSlideDown var(--transition-speed-slow) ease-out forwards; }
  .ui-container-exit { animation: fadeOutSlideUp var(--transition-speed-medium) ease-in forwards; }
  @keyframes fadeInSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeOutSlideUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }

  .button-group { display: flex; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
  .control-button {
    margin: 5px; padding: 10px 16px; border: none; border-radius: 20px;
    cursor: pointer; font-weight: bold; font-size: 14px;
    transition: background-color var(--transition-speed-fast) ease, opacity var(--transition-speed-medium) ease, transform var(--transition-speed-fast) ease, box-shadow var(--transition-speed-fast) ease;
    box-shadow: 0 2px 4px var(--button-shadow); outline: none;
    display: inline-flex; align-items: center; justify-content: center; color: white; 
  }
  .control-button:hover:not(.ghost) { transform: translateY(-2px); box-shadow: 0 4px 8px var(--button-shadow); }
  .control-button:active:not(.ghost) { transform: translateY(0px); box-shadow: 0 2px 3px var(--button-shadow); }
  .ghost { opacity: 0.45 !important; pointer-events: none !important; transform: translateY(0) !important; box-shadow: 0 2px 4px var(--button-shadow) !important; }

  .btn-start { background-color: var(--primary-color); }
  .btn-start:hover:not(.ghost) { background-color: var(--primary-hover-color); }
  .btn-pause { background-color: var(--warning-color); } 
  .btn-pause:hover:not(.ghost) { background-color: var(--warning-hover-color); }
  .btn-resume { background-color: var(--success-color); }
  .btn-resume:hover:not(.ghost) { background-color: var(--success-hover-color); }

  .ui-close-btn { position: absolute; top: 12px; right: 15px; cursor: pointer; font-size: 26px; line-height: 1; font-weight: bold; color: #8899a6; transition: color var(--transition-speed-fast) ease, transform var(--transition-speed-medium) ease; }
  .ui-close-btn:hover { color: var(--primary-color); transform: rotate(90deg) scale(1.1); }

  .text-container { width: 100%; text-align: center; margin-top: 5px; margin-bottom: 5px; transition: opacity var(--transition-speed-medium) ease, transform var(--transition-speed-medium) ease, max-height var(--transition-speed-medium) ease-in-out, min-height var(--transition-speed-medium) ease-in-out, margin-top var(--transition-speed-medium) ease-in-out, padding var(--transition-speed-medium) ease-in-out; overflow: hidden; }
  .status-text-style { font-size: 15px; font-weight: 500; color: var(--text-color); min-height: 20px; }
  .status-label, .status-separator { color: var(--text-color); }
  .status-value { color: var(--text-color); display: inline-block; min-width: 10px; text-align: left; }
  .status-suffix-message { font-style: italic; }

  .error-text-container-style, .preload-text-container-style { max-height: 0; opacity: 0; margin-top: 0 !important; margin-bottom: 0 !important; min-height: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; }
  .error-text-container-style.active, .preload-text-container-style.active { max-height: 50px; opacity: 1; margin-top: 8px !important; margin-bottom: 8px !important; min-height: 20px; }
  .error-text-style { color: var(--danger-color); font-size: 13px; font-weight: 500; }
  .preload-text-style { font-weight: bold; font-size: 14px; color: var(--primary-color); }
  .preload-pulse { animation: pulseAnim 1.5s infinite ease-in-out; }
  @keyframes pulseAnim { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

  body::-webkit-scrollbar { width: 10px; } body::-webkit-scrollbar-track { background: #15202b; } body::-webkit-scrollbar-thumb { background-color: var(--primary-color); border-radius: 10px; border: 2px solid #15202b; }
`;
document.head.appendChild(enhancedStyles);

const rateLimiter = {
  tokens: config.RATE_LIMIT_MAX_UNLIKES,
  lastRefill: Date.now(),
  refill() {
    const now = Date.now(),
      elapsed = now - this.lastRefill;
    this.tokens = Math.min(
      config.RATE_LIMIT_MAX_UNLIKES,
      this.tokens + elapsed * config.TOKEN_REFILL_RATE
    );
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
    await wait(waitMs);
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
    } else {
      console.warn(
        "[RateLimiter] Still no token after waiting. Potential issue or extreme load."
      );
      await wait(config.RATE_LIMIT_WINDOW / config.RATE_LIMIT_MAX_UNLIKES);
      this.tokens = Math.max(0, this.tokens - 1);
    }
  },
};
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTweetId(btn) {
  const article = btn.closest("article");
  if (!article) return null;
  const links = Array.from(article.querySelectorAll('a[href*="/status/"]'));
  for (const link of links) {
    const href = link.getAttribute("href");
    if (href) {
      const parts = href.split("/"),
        statusIndex = parts.indexOf("status");
      if (statusIndex !== -1 && parts.length > statusIndex + 1) {
        const pId = parts[statusIndex + 1].split("?")[0];
        if (/^\d+$/.test(pId)) return pId;
      }
    }
  }
  return null;
}
function fetchTweetText(btn) {
  const el = btn.closest("article")?.querySelector('[data-testid="tweetText"]');
  return el ? el.textContent.trim() : "No text found";
}
function saveProgress(count) {
  localStorage.setItem("totalUnlikeCount_v2", count);
}
function loadProgress() {
  return parseInt(localStorage.getItem("totalUnlikeCount_v2") || "0", 10);
}

const uiContainer = document.createElement("div");
uiContainer.className = "twitter-unliker-ui";
document.body.appendChild(uiContainer);
setTimeout(() => uiContainer.classList.add("ui-container-enter"), 50);
const closeBtn = document.createElement("span");
closeBtn.className = "ui-close-btn";
closeBtn.textContent = "×";
uiContainer.appendChild(closeBtn);
const buttonGroup = document.createElement("div");
buttonGroup.className = "button-group";
uiContainer.appendChild(buttonGroup);
const startBtn = document.createElement("button"),
  pauseBtn = document.createElement("button"),
  resumeBtn = document.createElement("button");
[
  { btn: startBtn, text: "Start", class: "btn-start" },
  { btn: pauseBtn, text: "Pause", class: "btn-pause" },
  { btn: resumeBtn, text: "Resume", class: "btn-resume" },
].forEach((c) => {
  c.btn.textContent = c.text;
  c.btn.className = `control-button ${c.class}`;
  buttonGroup.appendChild(c.btn);
});
const statusTextContainer = document.createElement("div");
statusTextContainer.className = "text-container";
const statusText = document.createElement("div");
statusText.className = "status-text-style";
statusTextContainer.appendChild(statusText);
const errorTextContainer = document.createElement("div");
errorTextContainer.className = "text-container error-text-container-style";
const errorText = document.createElement("div");
errorText.className = "error-text-style";
errorTextContainer.appendChild(errorText);
const preloadTextContainer = document.createElement("div");
preloadTextContainer.className = "text-container preload-text-container-style";
const preloadText = document.createElement("div");
preloadText.className = "preload-text-style";
preloadTextContainer.appendChild(preloadText);
uiContainer.append(
  statusTextContainer,
  errorTextContainer,
  preloadTextContainer
);

let uiSessionCountEl, uiTotalCountEl;
let isRunning = false,
  isPaused = false,
  shouldStop = false,
  isProcessingTweet = false;
let sessionCount = 0,
  totalCount = loadProgress(),
  errorCount = 0;
let waitTime = config.BASE_WAIT_TIME;
const processed = new Set();
let observer,
  preloadAnimId,
  preloadScrollerId,
  preloadTimeoutId,
  statusAnimIntervalId;

async function setStatusTextContainerVisible(isVisible) {
  if (isVisible) {
    statusTextContainer.style.display = "block";
    await wait(10);
    statusTextContainer.style.opacity = "1";
    statusTextContainer.style.transform = "translateY(0)";
  } else {
    statusTextContainer.style.opacity = "0";
    statusTextContainer.style.transform = "translateY(5px)";
    await wait(FAST_TRANSITION_MS);
    statusTextContainer.style.display = "none";
  }
}
async function setPreloadTextContainerActive(isActive) {
  const c = preloadTextContainer.classList.contains("active");
  if (isActive && !c) preloadTextContainer.classList.add("active");
  else if (!isActive && c) {
    preloadTextContainer.classList.remove("active");
    await wait(PRELOAD_TRANSITION_MS);
  }
}
async function updatePreloadTextMessage(text, pulse = false) {
  preloadText.textContent = text;
  preloadText.classList.toggle("preload-pulse", pulse && text.includes("..."));
}
async function setErrorTextContainerActive(isActive) {
  const c = errorTextContainer.classList.contains("active");
  if (isActive && !c) errorTextContainer.classList.add("active");
  else if (!isActive && c) {
    errorTextContainer.classList.remove("active");
    await wait(PRELOAD_TRANSITION_MS);
  }
}
async function updateErrorText(newErrorText) {
  if (newErrorText && newErrorText.trim() !== "") {
    await setErrorTextContainerActive(true);
    errorText.textContent = newErrorText;
  } else {
    errorText.textContent = "";
    await setErrorTextContainerActive(false);
  }
}
async function updateCountValue(element, newValue) {
  const v = String(newValue);
  if (!element || element.textContent === v) return;
  element.style.transition = "opacity 0.1s ease-out";
  element.style.opacity = "0";
  await wait(100);
  element.textContent = v;
  element.style.transition = "opacity 0.15s ease-in";
  element.style.opacity = "1";
  await wait(150);
  element.style.transition = "";
}
function setupStatusDisplay(mode = "totalOnly") {
  const s = statusText.querySelector(".status-suffix-message"),
    h = s ? s.outerHTML : "";
  if (mode === "sessionAndTotal")
    statusText.innerHTML = `<span class="status-label">Session: </span><span class="status-value" id="uiSessCount">0</span><span class="status-separator"> | </span><span class="status-label">Total: </span><span class="status-value" id="uiTotCount">${totalCount}</span>${h}`;
  else
    statusText.innerHTML = `<span class="status-label">Welcome to RapidUnlike!</span>${h}`;
  uiSessionCountEl = document.getElementById("uiSessCount");
  uiTotalCountEl = document.getElementById("uiTotCount");
}
function updateButtonStates() {
  [startBtn, pauseBtn, resumeBtn].forEach((b) => {
    b.classList.add("ghost");
    b.style.display = "inline-flex";
  });
  if (!isRunning && !isPaused) startBtn.classList.remove("ghost");
  else if (isRunning && !isPaused) pauseBtn.classList.remove("ghost");
  else if (isRunning && isPaused) resumeBtn.classList.remove("ghost");
}

closeBtn.addEventListener("click", async () => {
  shouldStop = true;
  isRunning = false;
  isPaused = false;
  if (observer) observer.disconnect();
  [preloadAnimId, preloadScrollerId, statusAnimIntervalId].forEach(
    clearInterval
  );
  clearTimeout(preloadTimeoutId);
  uiContainer.classList.remove("ui-container-enter");
  uiContainer.classList.add("ui-container-exit");
  await wait(PRELOAD_TRANSITION_MS);
  if (enhancedStyles.parentNode)
    enhancedStyles.parentNode.removeChild(enhancedStyles);
  if (uiContainer.parentNode) uiContainer.parentNode.removeChild(uiContainer);
  console.log("Unliker script closed and cleaned up.");
});

async function preloadTweets(durationMs) {
  return new Promise(async (resolve) => {
    await setStatusTextContainerVisible(false);
    await setPreloadTextContainerActive(true);
    await updatePreloadTextMessage(`Preloading tweets`, true);
    const start = Date.now();
    let dots = 0;
    preloadAnimId = setInterval(async () => {
      dots = (dots % 3) + 1;
      const elapsed = Date.now() - start,
        r = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      if (elapsed < durationMs)
        await updatePreloadTextMessage(
          `Preloading tweets ${".".repeat(dots)} (${r}s left)`,
          true
        );
    }, 7000);
    preloadScrollerId = setInterval(() => {
      const c = window.scrollY;
      window.scrollBy(0, window.innerHeight * 1.5);
      if (
        Math.abs(window.scrollY - c) < 100 &&
        document.body.scrollHeight - (c + window.innerHeight) > 100
      )
        window.scrollTo(0, document.body.scrollHeight);
    }, 1200);
    preloadTimeoutId = setTimeout(async () => {
      clearInterval(preloadAnimId);
      clearInterval(preloadScrollerId);
      window.scrollTo(0, 0);
      await updatePreloadTextMessage("Preload finished.", false);
      await wait(1000);
      await updatePreloadTextMessage("", false);
      await setPreloadTextContainerActive(false);
      resolve();
    }, durationMs);
  });
}
const mainTimelineSelector = 'div[aria-label*="Timeline"]';
let mainContainer = document.querySelector(mainTimelineSelector);
function setupObserver() {
  if (observer) observer.disconnect();
  mainContainer = document.querySelector(mainTimelineSelector);
  if (!mainContainer) {
    console.warn("[Setup] Timeline container not found. Retrying in 5s...");
    setTimeout(setupObserver, 5000);
    return;
  }
  observer = new MutationObserver(async (m) => {
    if (!isRunning || isPaused || shouldStop || isProcessingTweet) return;
    for (const mut of m)
      if (
        mut.type === "childList" &&
        mut.addedNodes.length > 0 &&
        Array.from(mut.addedNodes).some(
          (n) =>
            n.nodeType === 1 &&
            (n.tagName === "ARTICLE" || n.querySelector("article"))
        )
      ) {
        await unlikeNext();
        break;
      }
  });
  observer.observe(mainContainer, { childList: true, subtree: true });
}

async function unlikeNext() {
  if (shouldStop || isProcessingTweet) return false;
  isProcessingTweet = true;
  try {
    const unlikeButtons = Array.from(
      document.querySelectorAll('article [data-testid="unlike"]')
    );
    let btnToProcess = null,
      tidToProcess = null;
    for (const btn of unlikeButtons) {
      const isButtonVisible = btn.offsetParent !== null;
      const tid = extractTweetId(btn);
      const alreadyProcessedInSet = tid ? processed.has(tid) : false;
      const isMarkedByScript = btn.classList.contains("processed-by-script");
      if (
        !isButtonVisible ||
        isMarkedByScript ||
        (tid && alreadyProcessedInSet)
      )
        continue;
      if (tid) {
        btnToProcess = btn;
        tidToProcess = tid;
        break;
      }
    }
    if (!btnToProcess) {
      isProcessingTweet = false;
      return false;
    }

    processed.add(tidToProcess);
    btnToProcess.style.transition = "opacity 0.3s ease";
    btnToProcess.style.opacity = "0.3";
    btnToProcess.classList.add("processed-by-script");
    btnToProcess.scrollIntoView({ block: "center", behavior: "smooth" });
    await wait(100 + Math.random() * 10);
    await rateLimiter.removeToken();
    const tweetTextForLog = fetchTweetText(btnToProcess).slice(0, 100);
    try {
      btnToProcess.click();
      await wait(config.BASE_WAIT_TIME + Math.random() * 10);
      sessionCount++;
      totalCount++;
      saveProgress(totalCount);
      console.log(`Unliked: "${tweetTextForLog}..." (ID: ${tidToProcess})`);
      if (
        statusTextContainer.style.display === "none" ||
        statusTextContainer.style.opacity === "0"
      )
        await setStatusTextContainerVisible(true);
      if (uiSessionCountEl)
        await updateCountValue(uiSessionCountEl, sessionCount);
      if (uiTotalCountEl) await updateCountValue(uiTotalCountEl, totalCount);
      await updateErrorText("");
      errorCount = 0;
      if (waitTime > config.BASE_WAIT_TIME)
        waitTime = Math.max(
          config.BASE_WAIT_TIME,
          waitTime - config.DECREMENT_WAIT
        );
      btnToProcess.style.display = "none";
      return true;
    } catch (e) {
      console.error(
        `Error during click-based unlike for T${tidToProcess}:`,
        e.message
      );
      await updateErrorText(`Click Error: ${e.message.substring(0, 60)}...`);
      errorCount++;
      waitTime = Math.min(waitTime + config.INCREMENT_WAIT, 3000);
      if (processed.has(tidToProcess)) processed.delete(tidToProcess);
      if (btnToProcess) {
        btnToProcess.style.opacity = "1";
        btnToProcess.classList.remove("processed-by-script");
      }
      return false;
    }
  } finally {
    isProcessingTweet = false;
  }
}

async function findAndProcessFirstTweetSlowly(maxScrollAttempts = 30) {
  // Max attempts increased
  await setStatusTextContainerVisible(false);
  await setPreloadTextContainerActive(true);
  await updatePreloadTextMessage("Searching for first tweet...", true); // Static message
  for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
    if (shouldStop) {
      await updatePreloadTextMessage("Search stopped.", false);
      await wait(1000);
      await setPreloadTextContainerActive(false);
      return false;
    }
    const processedThisAttempt = await unlikeNext();
    if (processedThisAttempt) {
      await updatePreloadTextMessage("First tweet processed!", false);
      await wait(1000);
      await setPreloadTextContainerActive(false);
      return true;
    }
    if (attempt < maxScrollAttempts - 1) {
      window.scrollBy(0, Math.max(250, window.innerHeight / 2.5));
      await wait(config.BASE_WAIT_TIME + 250 + Math.random() * 150);
    }
  }
  console.error(
    "[InitialSearch] CRITICAL: Failed to find/process any tweet after max slow scroll attempts. Halting."
  );
  await updatePreloadTextMessage(
    "ERROR: Could not find initial tweet. Halting. Try scrolling manually first.",
    false
  );
  return false;
}

async function unlikeAll() {
  updateButtonStates();
  let consecutiveNoTweetFound = 0,
    emptyScrollCount = 0;
  const MAX_CONSECUTIVE_NO_TWEET_BEFORE_SCROLL = 4;
  const MAX_EMPTY_SCROLLS = 3;
  while (!shouldStop && sessionCount < config.MAX_UNLIKES) {
    while (isPaused && !shouldStop) await wait(200);
    if (shouldStop) break;
    const processedSuccessfully = await unlikeNext();
    if (processedSuccessfully) {
      consecutiveNoTweetFound = 0;
      emptyScrollCount = 0;
      await wait(waitTime);
    } else {
      consecutiveNoTweetFound++;
      if (consecutiveNoTweetFound >= MAX_CONSECUTIVE_NO_TWEET_BEFORE_SCROLL) {
        await setStatusTextContainerVisible(false);
        await setPreloadTextContainerActive(true);
        await updatePreloadTextMessage("Scrolling for more tweets...", true);
        const scrollHeightBefore = document.body.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
        await wait(200 + Math.random() * 400);
        window.scrollBy(0, -200);
        await wait(200 + Math.random() * 400);
        window.scrollTo(0, document.body.scrollHeight);
        await wait(200 + Math.random() * 400);
        await updatePreloadTextMessage("", false);
        await setPreloadTextContainerActive(false);
        await setStatusTextContainerVisible(true);
        consecutiveNoTweetFound = 0;
        if (document.body.scrollHeight <= scrollHeightBefore + 150) {
          emptyScrollCount++;
          console.warn(
            `[unlikeAll] Scroll didn't load new content. Attempt: ${emptyScrollCount}`
          );
          if (emptyScrollCount >= MAX_EMPTY_SCROLLS) {
            console.error("[unlikeAll] Max empty scrolls. Stopping.");
            shouldStop = true;
            setupStatusDisplay("totalOnly");
            if (uiTotalCountEl)
              await updateCountValue(uiTotalCountEl, totalCount);
            const s = statusText.querySelectorAll(".status-suffix-message");
            s.forEach((x) => x.remove());
            const eS = document.createElement("span");
            eS.className = "status-suffix-message";
            eS.textContent = " Reached end or error. Stopping.";
            statusText.appendChild(eS);
            await setStatusTextContainerVisible(true);
          }
        } else emptyScrollCount = 0;
      } else await wait(350 + Math.random() * 300);
    }
  }
  isRunning = false;
  isPaused = false;
  updateButtonStates();
  setupStatusDisplay("totalOnly");
  if (uiTotalCountEl) await updateCountValue(uiTotalCountEl, totalCount);
  let finalMsg = "";
  if (
    shouldStop &&
    !statusText.textContent.includes("Reached end or error. Stopping.") &&
    !preloadText.textContent.includes("ERROR:")
  )
    finalMsg = " Process stopped.";
  else if (!shouldStop) finalMsg = " Max unlikes reached or finished.";
  if (finalMsg) {
    const s = statusText.querySelectorAll(".status-suffix-message");
    s.forEach((x) => x.remove());
    const S = document.createElement("span");
    S.className = "status-suffix-message";
    S.textContent = finalMsg;
    statusText.appendChild(S);
  }
  await setStatusTextContainerVisible(true);
  if (!preloadText.textContent.includes("ERROR:")) {
    await updatePreloadTextMessage("", false);
    await setPreloadTextContainerActive(false);
  }
}

async function animateStatusUpdate(
  label,
  duration,
  callback,
  clearPreloadAfter = false,
  finalPreloadMessage = ""
) {
  clearInterval(statusAnimIntervalId);
  let dots = 0;
  await setStatusTextContainerVisible(false);
  await setPreloadTextContainerActive(true);
  const u = async () => {
    dots = (dots % 3) + 1;
    await updatePreloadTextMessage(`${label} ${".".repeat(dots)}`, true);
  };
  await u();
  statusAnimIntervalId = setInterval(u, 700);
  await wait(duration);
  clearInterval(statusAnimIntervalId);
  if (finalPreloadMessage) {
    await updatePreloadTextMessage(finalPreloadMessage, false);
    if (clearPreloadAfter) {
      await wait(1000);
      await updatePreloadTextMessage("", false);
      await setPreloadTextContainerActive(false);
    }
  } else if (clearPreloadAfter) {
    await updatePreloadTextMessage("", false);
    await setPreloadTextContainerActive(false);
  }
  if (callback) await callback();
}

startBtn.addEventListener("click", async () => {
  console.clear();
  console.log(
`
     RapidUnlike
       v1.0.0
https://github.com/ajwdd           
`
  );
  if (isRunning) return;
  shouldStop = false;
  isPaused = false;
  isRunning = true;
  errorCount = 0;
  waitTime = config.BASE_WAIT_TIME;
  processed.clear();
  sessionCount = 0;
  [startBtn, pauseBtn, resumeBtn].forEach((b) => (b.style.display = "none"));
  await setStatusTextContainerVisible(false);
  await updateErrorText("");
  await setPreloadTextContainerActive(false);
  const sS = statusText.querySelectorAll(".status-suffix-message");
  sS.forEach((s) => s.remove());

  await preloadTweets(7000);
  window.scrollTo(0, 0);
  await wait(500);

  const firstTweetFound = await findAndProcessFirstTweetSlowly();

  if (firstTweetFound) {
    setupStatusDisplay("sessionAndTotal");
    if (uiSessionCountEl)
      await updateCountValue(uiSessionCountEl, sessionCount);
    if (uiTotalCountEl) await updateCountValue(uiTotalCountEl, totalCount);
    await setStatusTextContainerVisible(true);
    [startBtn, pauseBtn, resumeBtn].forEach(
      (b) => (b.style.display = "inline-flex")
    );
    updateButtonStates();
    setupObserver();
    unlikeAll();
  } else {
    console.error(
      "[StartBtn] Failed to find the first tweet using slow scroll. Unliking process halted."
    );
    isRunning = false;
    isPaused = false;
    shouldStop = true;
    updateButtonStates();
  }
});
pauseBtn.addEventListener("click", async () => {
  if (!isRunning || isPaused) return;
  isPaused = true;
  await updateErrorText("");
  await animateStatusUpdate(
    "Pausing",
    1500,
    async () => {
      updateButtonStates();
      [startBtn, pauseBtn, resumeBtn].forEach(
        (b) => (b.style.display = "inline-flex")
      );
    },
    false,
    `Paused. Session: ${sessionCount}`
  );
});
resumeBtn.addEventListener("click", async () => {
  if (!isRunning || !isPaused) return;
  isPaused = false;
  await updateErrorText("");
  await animateStatusUpdate(
    "Resuming",
    1500,
    async () => {
      updateButtonStates();
      [startBtn, pauseBtn, resumeBtn].forEach(
        (b) => (b.style.display = "inline-flex")
      );
      setupStatusDisplay("sessionAndTotal");
      if (uiSessionCountEl)
        await updateCountValue(uiSessionCountEl, sessionCount);
      if (uiTotalCountEl) await updateCountValue(uiTotalCountEl, totalCount);
      await setStatusTextContainerVisible(true);
    },
    true
  );
});

setupStatusDisplay("totalOnly");
updateButtonStates();
(async () => {
  if (!mainContainer) {
    await setStatusTextContainerVisible(false);
    await setPreloadTextContainerActive(true);
    await updatePreloadTextMessage(
      "Timeline not found. Scroll or go to Likes page.",
      false
    );
    setTimeout(async () => {
      if (preloadText.textContent.includes("Timeline not found")) {
        await updatePreloadTextMessage("", false);
        await setPreloadTextContainerActive(false);
        if (statusText.textContent.trim())
          await setStatusTextContainerVisible(true);
      }
    }, 7000);
  }
  if (
    statusText.textContent.trim() &&
    statusTextContainer &&
    statusTextContainer.style.display !== "none"
  )
    await setStatusTextContainerVisible(true);
  else if (!statusText.textContent.trim())
    await setStatusTextContainerVisible(false);
})();
