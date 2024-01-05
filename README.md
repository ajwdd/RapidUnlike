# 🚀 RapidUnlike 💔

![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=flat&logo=javascript) ![ ](https://img.shields.io/github/stars/bugsommelier/RapidUnlike.svg?style=flat) ![Size](https://img.shields.io/github/repo-size/bugsommelier/RapidUnlike) ![License](https://img.shields.io/badge/license-MIT-blue) ![IsMaintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)

New year new you? 

Want to start fresh? 

Or just want to clean up your liked tweets? 

RapidUnlike is a script that unlikes all your liked tweets at an impressive speed. It's simple, efficient, and user-friendly.

##  🎥 Demo

![demo](https://gist.github.com/assets/4010514/bb253a4a-2182-4d02-bb25-02aeb4d26bbe)

## 🔧 Features

- <u>Efficiency</u>: Unlike ***thousands*** of tweets in minutes.
- <u>Smart Wait Times</u>: Prevent rate-limiting with smart wait times between unlikes.
- <u>User-Friendly</u>: Simple execution while providing a preview of the recently unliked tweet, count total, and time taken.

## 📜 Instructions

1. Navigate to your profile's "posts liked" page: https://www.x.com/yourusername/likes.

2. Open the browser's console:

   - Linux, Windows, ChromeOS: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>
   - macOS: <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>J</kbd>

3. Copy the entirety of `RapidUnlike.js` and paste into the console then press <kbd>Enter</kbd>.

   ```js
   function fetchLikes() {
     return document.querySelectorAll('[data-testid="unlike"]');
   }
   
   function fetchTweetText(button) {
     let tweetElement = button
       .closest("article")
       .querySelector('[data-testid="tweetText"]');
     return tweetElement ? tweetElement.textContent : "No text found";
   }
   
   function wait(ms) {
     return new Promise((resolve) => setTimeout(resolve, ms));
   }
   
   async function unlikeAll() {
     const startTime = performance.now();
     let count = 0;
     let errorCount = 0;
   
     // Adaptive Timing Variables
     // Initial wait time between unlikes
     let baseWaitTime = 100;
     // Increment on error
     let incrementWait = 50;
     // Decrement on success
     let decrementWait = 0;
   
     let likeButtons = fetchLikes();
     let startIndex = 0;
   
     while (likeButtons.length > 0 && count < 2500) {
       for (let i = startIndex; i < likeButtons.length; i++) {
         try {
           // Fetch and log tweet text
           // Slice fetched unliked tweet to 50 chars
           let tweetText = fetchTweetText(likeButtons[i]).slice(0, 50);
           console.log(`Unliking tweet: "${tweetText}"`);
   
           likeButtons[i].click();
           console.log(`%cUnliked ${++count} tweets`, "color: green;");
   
           await wait(baseWaitTime);
   
           // Adaptive Timing Adjustment
           if (baseWaitTime > 1000 && errorCount === 0) {
             // Decrease wait time after successful unlike
             baseWaitTime -= decrementWait;
           }
         } catch (error) {
           console.error(`%cError unliking tweet: ${error}`, "color: red;");
           errorCount++;
           baseWaitTime += incrementWait; // Increase wait time after error
           break;
         }
       }
   
       if (errorCount > 0 && likeButtons.length > 0) {
         // Reset error count after a successful batch
         errorCount = 0;
       }
       // Scroll to bottom to load new tweets
       window.scrollTo(0, document.body.scrollHeight);
       // Wait for new tweets to load
       await wait(3000);
       // Fetch new batch of unliked tweets
       likeButtons = fetchLikes();
       // Reset start index after refreshing tweets
       startIndex = 0;
     }
   
     const endTime = performance.now();
     // Convert milliseconds to seconds
     const totalTime = (endTime - startTime) / 1000;
     console.log(`%cTotal unliked = ${count}`, "color: blue;");
     console.log(
       `%cTotal time taken: ${totalTime.toFixed(2)} seconds`,
       "color: blue;"
     );
   }
   
   unlikeAll();
   ```

   **C'est fini!**

   ---

**Note:** Adjust the wait time (in milliseconds) according to your internet speed if needed.