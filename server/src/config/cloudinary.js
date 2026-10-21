const cloudinary = require('cloudinary').v2;
const env = require('./env');

cloudinary.config({ ...env.cloudinary, secure: true });

module.exports = cloudinary;
