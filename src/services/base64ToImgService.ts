const fs = require('fs');

const base64ToImage = (base64String: string, filePath: string) => {
  // Remove the data:image/[type];base64 prefix if it exists
  const base64Data = base64String?.replace(/^data:image\/[a-zA-Z]*;base64,/, '');

  if (base64Data) {
    // Create a buffer from the base64 string
    const buffer = Buffer.from(base64Data, 'base64');

    // Write the buffer to a file
    fs.writeFileSync(filePath, buffer);
  } else {
    console.warn('Skipping writing file due to empty base64 string argument');
  }
}

module.exports = {
  base64ToImage
};

export {};