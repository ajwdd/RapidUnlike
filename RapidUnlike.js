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
