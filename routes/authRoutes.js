const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const multer = require("multer");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);

module.exports = router;
