import { logMessage } from "../loggerService";
const cloudinary = require('../../utils/cloudinary');

const upload = (filePath: string, jailName: string) => {
  cloudinary.uploader.upload(filePath, (err: any, result: any) => {
    if (err) {
      const errorMsg = `Error encountered while uploading ${filePath} to cloudinary: ${err}`;
      logMessage(jailName, errorMsg);
      throw new Error(errorMsg)
    }
    logMessage(jailName, `Successfully uploaded ${filePath} to cloudinary`);
  });
};

export {
  upload
};