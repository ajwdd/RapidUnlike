// RapidUnlike.js
function fetchLikes() {
    return document.querySelectorAll('[data-testid="unlike"]');
  }
  
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  async function unlikeAll() {
    const startTime = performance.now();
    let count = 0;
    let likeButtons = fetchLikes();
  
    while (likeButtons.length > 0 && count < 2500) {
      for (const button of likeButtons) {
        button.focus();
        button.click();
        console.log(`Unliked ${++count} tweets`);
      }
  
      await wait(3000);
  
      likeButtons = fetchLikes();
    }
  
    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000; // Convert milliseconds to seconds
  
    if (count >= 2500) {
      console.log("Finished early to prevent rate-limiting");
    } else {
      console.log(`Total unliked = ${count}`);
    }
  
    console.log(`Total time taken: ${totalTime.toFixed(2)} seconds`);
  }
  
  unlikeAll();