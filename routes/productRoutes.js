const express = require("express");
const {
  createProduct,
  deleteProduct,
  updateProduct,
  getProducts,
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
router.put(
  "/update/:id", // Update product by ID
  protect, // Ensure the user is authenticated
  upload.fields([{ name: "productPhoto", maxCount: 1 }]), // Handle file upload for the product photo (optional for updates)
  uploadToCloudinary, // Upload to Cloudinary (if photo is updated)
  updateProduct // Handle the product update logic
);
router.delete(
  "/delete/:id",
  protect, // Ensure the user is authenticated
  deleteProduct // Handle the rest of the product creation logic
);
router.get(
  "/getProducts",
  protect, // Ensure the user is authenticated
  getProducts // Fetch all products
);
module.exports = router;
