const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const multer = require("multer");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "La taille du fichier dépasse la limite de 5 Mo" });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.error("Erreur du serveur :", err);
    return res
      .status(500)
      .json({ message: "Erreur du serveur : " + err.message });
  }
  next();
};

router.post(
  "/register",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]),
  multerErrorHandler,
  registerUser
);

router.post("/login", loginUser);

module.exports = router;
