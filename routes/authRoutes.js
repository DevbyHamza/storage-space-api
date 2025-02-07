const express = require("express");
const {
  upload,
  uploadToCloudinary,
} = require("../middlewares/uploadMiddleware");
const { registerUser, loginUser, updateProfile } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]),
  uploadToCloudinary,
  registerUser
);
router.put(
  "/profile",
  protect, 
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]),
  uploadToCloudinary,
  updateProfile
);
router.post("/login", loginUser);

module.exports = router;
