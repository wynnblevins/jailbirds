
/**
 * Utility function that pauses thread execution for the provided 
 * number of milliseconds.  Use sparingly to get around timing issues.
 * 
 * @param ms 
 * @returns a promise that lasts for the given ms
 */
const delayMs = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { delayMs };