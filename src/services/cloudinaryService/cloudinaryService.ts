import { v2 as cloudinary } from "cloudinary";
const config = require("../../utils/environment");
const { logMessage } = require("../loggerService");

/**
 * Configure Cloudinary
 */
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

/**
 * Upload a base64 image to Cloudinary and return the public URL
 */
const upload = async (base64Image: string): Promise<string> => {
  try {

    // Ensure the image is a proper data URL
    const dataUrl = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "jailbirds",
      resource_type: "image"
    });

    logMessage(`Cloudinary upload successful: ${result.secure_url}`);

    return result.secure_url;

  } catch (err: any) {

    logMessage(`Cloudinary upload failed: ${err.message}`);

    throw err;
  }
};

module.exports = {
  upload
}