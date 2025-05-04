import { writeFileSync } from 'fs';
const { logMessage } = require('../services/loggerService');

const base64ToImage = (base64String: string, filePath: string): void => {
  // Remove the data:image/[type];base64 prefix if it exists
  const base64Data = base64String?.replace(/^data:image\/[a-zA-Z]*;base64,/, '');

  if (base64Data) {
    // Create a buffer from the base64 string
    const buffer = Buffer.from(base64Data, 'base64');

    // Write the buffer to a file
    writeFileSync(filePath, buffer);
  } else {
    logMessage('Skipping writing file due to empty base64 string argument')
  }
}

export {
  base64ToImage
};