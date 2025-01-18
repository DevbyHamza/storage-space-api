const express = require("express");
const {
  createStorageSpace,
  getAllStorageSpaces,
  getStorageSpaceById,
  updateStorageSpace,
  deleteStorageSpace,
} = require("../controllers/storageSpaceController");
const upload = require("../middlewares/uploadMiddleware");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", protect, upload.single("photo"), createStorageSpace);

router.get("/getall", protect, getAllStorageSpaces);

router.get("/getbyId/:id", protect, getStorageSpaceById);

router.put("/update/:id", protect, upload.single("photo"), updateStorageSpace);

router.delete("/delete/:id", protect, deleteStorageSpace);

module.exports = router;
