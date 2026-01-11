/**
 * function which logs a given message to the console and optionally 
 * appends the name of the jail the specific message is related to
 * 
 * @param message: the message to log
 * @param jailName 
 */
const logMessage = (message: string, jailName?: string) => {
  if (jailName) {
    console.log(`${jailName}: ${message}`);
  } else {
    console.log(message);
  }
};

export { logMessage }