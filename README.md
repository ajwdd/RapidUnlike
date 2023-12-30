# RapidUnlike.js 💔🚀

Unleash the power of rapid unliking on Twitter with RapidUnlike.js! This script automates the process of unliking tweets on your Twitter profile, helping you effortlessly clean up your Liked Tweets section.

## Features

- **Efficiency:** Unlike tweets at an impressive speed to save you time.
- **Smart Wait Times:** Prevent rate-limiting with smart wait times between unlikes.
- **User-Friendly:** Simple setup and execution with clear instructions.


## Instructions

1. Open Twitter and log in to your account.

2. Go to the "Liked Tweets" section on your profile.

3. Open the browser console:

   - For Chrome: Right-click on the page, select "Inspect", go to the "Console" tab.
   - For Firefox: Right-click on the page, select "Inspect Element", go to the "Console" tab.

4. Copy the entire contents of `RapidUnlike.js`.

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
     let baseWaitTime = 200;
     // Increment on error
     let incrementWait = 150;
     // Decrement on success
     let decrementWait = 100;
   
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

5. Paste it into the console and press Enter.

6. The script will start unliking tweets **rapidly**.

**Note:** Adjust the wait time (in milliseconds) according to your needs. The script automatically stops if it reaches the Twitter/X's rate limit. If you finish early, it's to prevent rate-limiting.

Feel free to customize the instructions based on your preferences or add any additional information.