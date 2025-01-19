const express = require("express");
const {
  upload,
  uploadToCloudinary,
} = require("../middlewares/uploadMiddleware");
const { registerUser, loginUser } = require("../controllers/authController");

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

router.post("/login", loginUser);

module.exports = router;
