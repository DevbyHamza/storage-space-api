require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
const uploadToCloudinary = async (req, res, next) => {
  const uploadFiles = [];

  // If no files are uploaded, just continue without doing anything
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(); // No files, move to next middleware
  }

  const fields = Object.keys(req.files);

  try {
    // Upload all files to Cloudinary asynchronously using Promise.all
    await Promise.all(
      fields.map((field) => {
        return new Promise((resolve, reject) => {
          const file = req.files[field][0];
          const cloudinaryUpload = cloudinary.uploader.upload_stream(
            { resource_type: "auto" }, // Auto to detect file type (image, video, etc.)
            (error, result) => {
              if (error) {
                reject(new Error("Échec du téléchargement vers Cloudinary"));
              } else {
                uploadFiles.push({ field, url: result.secure_url });
                resolve();
              }
            }
          );
          // Pipe the file buffer to Cloudinary for upload
          streamifier.createReadStream(file.buffer).pipe(cloudinaryUpload);
        });
      })
    );

    // Attach uploaded images' URLs to the request object for further processing
    req.uploadedImages = uploadFiles;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    // Catch any errors and send the error response
    return res.status(500).json({
      success: false,
      message: "Erreur lors du téléchargement des images",
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
};
