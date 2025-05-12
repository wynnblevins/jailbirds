/**
 * Takes the provided function and executes it.  If an error is encountered,
 * the provided function is reattempted until the number of retries is exceeded.
 * 
 * @param fn the function to execute with retries.
 * @param errCb an optional callback function to be executed on encountering an error
 * @param maxRetries the number of times to reattempt the provided function.  Default is 3.
 * @param retries the current number of attempts that have been made.  Default is 0.
 * @returns 
 */
const executeWithRetries = async (
  fn, 
  errCb: () => void = () => {}, 
  maxRetries: number = 3, 
  retries: number = 0
) => {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`Attempt ${retries + 1} failed:`, error);
    errCb();
    if (retries < maxRetries - 1) {
      return await executeWithRetries(fn, errCb, maxRetries, retries + 1);
    } else {
      throw error;
    }
  }
}

export default executeWithRetries;