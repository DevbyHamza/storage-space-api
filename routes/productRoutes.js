const express = require("express");
const {
  createProduct,
  deleteProduct,
} = require("../controllers/productController");
const {
  upload,
  uploadToCloudinary,
} = require("../middlewares/uploadMiddleware");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Create Product Route
router.post(
  "/create",
  protect, // Ensure the user is authenticated
  upload.fields([{ name: "productPhoto", maxCount: 1 }]), // Handle file upload for the product photo
  uploadToCloudinary, // Upload to Cloudinary
  createProduct // Handle the rest of the product creation logic
);
router.delete(
  "/delete/:id",
  protect, // Ensure the user is authenticated
  deleteProduct // Handle the rest of the product creation logic
);
module.exports = router;
