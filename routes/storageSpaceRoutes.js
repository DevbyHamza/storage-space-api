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
      if (req.files && req.files.photo && req.files.photo.length > 0) {
        await uploadToCloudinary(req, res, () => {});
      }
      const result = await updateStorageSpace(req, res);
      res.status(200).json(result);
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
