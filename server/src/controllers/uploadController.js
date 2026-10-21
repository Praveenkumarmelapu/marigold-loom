const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { hasImageSignature } = require('../middleware/upload');

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose an image to upload');
  if (!hasImageSignature(req.file.buffer)) throw new HttpError(400, 'That file is not a valid JPG, PNG or WebP image');
  if (!env.cloudinary.cloud_name) throw new HttpError(503, 'Image hosting is not configured');

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'marigold-loom', resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'] },
      (err, out) => (err ? reject(err) : resolve(out))
    );
    stream.end(req.file.buffer);
  }).catch(() => {
    throw new HttpError(502, 'Image upload failed. Please try again.');
  });

  res.status(201).json({
    image: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    },
  });
});

module.exports = { uploadImage };
