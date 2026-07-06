import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

// Configure the Cloudinary v2 SDK once at startup from validated env config.
// `secure: true` forces https delivery URLs.
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

export { cloudinary };
