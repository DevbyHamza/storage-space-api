const express = require("express");
const {
  createStorageSpace,
  getAllStorageSpaces,
  getStorageSpaceById,
  updateStorageSpace,
  deleteStorageSpace,
} = require("../controllers/storageSpaceController");
const {
  upload,
  uploadToCloudinary,
} = require("../middlewares/uploadMiddleware");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/create",
  protect,
  upload.fields([{ name: "photo", maxCount: 1 }]),
  uploadToCloudinary,
  createStorageSpace
);
router.get("/getall", protect, getAllStorageSpaces);

router.get("/getbyId/:id", protect, getStorageSpaceById);
router.put(
  "/update/:id",
  protect,
  upload.fields([{ name: "photo", maxCount: 1 }]),
  async (req, res) => {
    try {
      // Si un fichier est téléchargé sous le champ 'photo', on l'upload vers Cloudinary
      if (req.files && req.files.photo && req.files.photo.length > 0) {
        await uploadToCloudinary(req, res, () => {}); // On passe une fonction vide pour 'next()'
      }

      // On met à jour l'espace de stockage
      const result = await updateStorageSpace(req);

      // On envoie la réponse après la mise à jour réussie
      res.status(200).json(result); // On envoie le message de succès après la mise à jour
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Une erreur est survenue lors de la mise à jour.",
        error: error.message,
      });
    }
  }
);

router.delete("/delete/:id", protect, deleteStorageSpace);

module.exports = router;
