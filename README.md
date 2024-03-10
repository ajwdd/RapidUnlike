# 🚀 RapidUnlike 💔

[![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=flat&logo=javascript)](https://en.wikipedia.org/wiki/Brendan_Eich) [![Stars](https://img.shields.io/github/stars/ajwdd/RapidUnlike.svg?style=flat)](https://github.com/ajwdd/RapidUnlike/stargazers) [![Size](https://img.shields.io/github/repo-size/ajwdd/RapidUnlike)](https://github.com/ajwdd/RapidUnlike) [![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](https://unlicense.org) [![IsMaintained](https://img.shields.io/badge/Maintained%3F-yes-blue.svg)](https://github.com/ajwdd/RapidUnlike/activity)

New year new you? 

Want to start fresh? 

Or just want to clean up your liked tweets? 

RapidUnlike is a script that unlikes all your liked tweets at an impressive speed. It's simple, efficient, and user-friendly.

## 🔧 Features

- <u>Efficiency</u>: Unlike ***thousands*** of tweets in minutes.
- <u>Smart Wait Times</u>: Prevent rate-limiting with smart wait times between unlikes.
- <u>User-Friendly</u>: Simple execution with UI start and stop, while providing a text preview of the unliked tweets, count total, and total time taken.

## 📜 Instructions

1. Navigate to your profile's "posts liked" page: https://www.x.com/yourusername/likes.

2. Open the browser's console:

   - Linux, Windows, ChromeOS: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>
   - macOS: <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>J</kbd>

3. Copy the entirety of `RapidUnlike` and paste into the console then press <kbd>Enter</kbd>

   ```js
   //┌─────────────────────────────────────────────────────┐
   //│  ____             _     _ _   _       _ _ _         │
   //│ |  _ \ __ _ _ __ (_) __| | | | |_ __ | (_) | _____  │
   //│ | |_) / _` | '_ \| |/ _` | | | | '_ \| | | |/ / _ \ │
   //│ |  _ < (_| | |_) | | (_| | |_| | | | | | |   <  __/ │
   //│ |_| \_\__,_| .__/|_|\__,_|\___/|_| |_|_|_|_|\_\___| │
   //│            |_|   https://github.com/ajwdd           │
   //└─────────────────────────────────────────────────────┘
   
   // Configuration
   const MAX_UNLIKES = 2500;
   const BASE_WAIT_TIME = 100;
   const INCREMENT_WAIT = 200;
   const DECREMENT_WAIT = 50;
   const RETRY_COUNT = 3;
   const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
   const RATE_LIMIT_MAX_UNLIKES = 50;
   const PROGRESS_REPORT_INTERVAL = 60 * 1000; // 1 minute
   
   // Helper functions
   function fetchLikes() {
     return document.querySelectorAll('[data-testid="unlike"]');
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
     localStorage.setItem("unlikeCount", count);
   }
   
   function loadProgress() {
     return localStorage.getItem("unlikeCount") || 0;
   }
   
   // UI elements
   const startButton = document.createElement("button");
   startButton.textContent = "Start Unliking";
   const stopButton = document.createElement("button");
   stopButton.textContent = "Stop Unliking";
   stopButton.disabled = true;
   const progressText = document.createElement("div");
   const errorText = document.createElement("div");
   
   // Create UI container
   const uiContainer = document.createElement("div");
   uiContainer.style.position = "fixed";
   uiContainer.style.top = "10px";
   uiContainer.style.right = "10px";
   uiContainer.style.backgroundColor = "#333";
   uiContainer.style.color = "#fff";
   uiContainer.style.padding = "10px";
   uiContainer.style.zIndex = "9999";
   uiContainer.appendChild(startButton);
   uiContainer.appendChild(stopButton);
   uiContainer.appendChild(progressText);
   uiContainer.appendChild(errorText);
   document.body.appendChild(uiContainer);
   
   let isRunning = false;
   let shouldStop = false;
   let unlikeCount = loadProgress();
   let errorCount = 0;
   let waitTime = BASE_WAIT_TIME;
   let lastUnlikeTime = Date.now();
   
   async function unlikeAll() {
     isRunning = true;
     startButton.disabled = true;
     stopButton.disabled = false;
   
     const startTime = performance.now();
     let likeButtons = fetchLikes();
     let retryCount = 0;
   
     while (likeButtons.length > 0 && unlikeCount < MAX_UNLIKES && !shouldStop) {
       for (const button of likeButtons) {
         try {
           const tweetText = fetchTweetText(button).slice(0, 150);
           console.log(`Unliking tweet: "${tweetText}"`);
           button.click();
           console.log(`%cUnliked ${++unlikeCount} tweets`, "color: aqua;");
           saveProgress(unlikeCount);
           updateProgress();
           await wait(waitTime);
   
           // Adaptive timing
           if (waitTime > 1000 && errorCount === 0) {
             waitTime -= DECREMENT_WAIT;
           }
   
           // Rate limiting
           const now = Date.now();
           const elapsedTime = now - lastUnlikeTime;
           if (elapsedTime < RATE_LIMIT_WINDOW) {
             const unlikes = unlikeCount - loadProgress();
             if (unlikes >= RATE_LIMIT_MAX_UNLIKES) {
               const remainingTime = RATE_LIMIT_WINDOW - elapsedTime;
               console.log(
                 `Rate limit reached, waiting ${remainingTime / 1000} seconds`
               );
               await wait(remainingTime);
             }
           }
           lastUnlikeTime = now;
           retryCount = 0;
         } catch (error) {
           console.error(`%cError unliking tweet: ${error}`, "color: red;");
           errorCount++;
           updateError(error);
           waitTime += INCREMENT_WAIT;
           retryCount++;
   
           if (retryCount >= RETRY_COUNT) {
             break;
           }
         }
       }
   
       if (errorCount === 0 && likeButtons.length > 0) {
         window.scrollTo(0, document.body.scrollHeight);
         await wait(3000);
         likeButtons = fetchLikes();
       } else {
         errorCount = 0;
       }
     }
   
     const endTime = performance.now();
     const totalTime = (endTime - startTime) / 1000;
     console.log(`%cTotal unliked = ${unlikeCount}`, "color: aquamarine;");
     console.log(
       `%cTotal time taken: ${totalTime.toFixed(2)} seconds`,
       "color: aquamarine;"
     );
   
     isRunning = false;
     startButton.disabled = false;
     stopButton.disabled = true;
     shouldStop = false;
   }
   
   function updateProgress() {
     progressText.textContent = `Unliked ${unlikeCount} tweets`;
   
     if (isRunning && !shouldStop) {
       setTimeout(updateProgress, PROGRESS_REPORT_INTERVAL);
     }
   }
   
   function updateError(error) {
     errorText.textContent = `Error: ${error}`;
   }
   
   startButton.addEventListener("click", unlikeAll);
   stopButton.addEventListener("click", () => {
     shouldStop = true;
   });
   ```
   
   **C'est fini!**
   
   ---

**Note:** Adjust the wait time (in milliseconds) according to your internet speed if needed.
