const { v2: cloudinary } = require('cloudinary');
const env = require('../config/env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

function assertCloudinaryConfigured() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    const error = new Error('Cloudinary is not configured');
    error.status = 500;
    error.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw error;
  }
}

function uploadImageBuffer(buffer, folder) {
  assertCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    upload.end(buffer);
  });
}

module.exports = { uploadImageBuffer };
