// routes/renterRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAvailableStorageSpacesForRenter,
  rentStorageSpace,
  getAllRentedStorageSpacesForUser,
} = require("../controllers/renterController");
const protect = require("../middlewares/authMiddleware");

router.get(
  "/availableStorageSpace",
  protect,
  getAvailableStorageSpacesForRenter
);
router.post("/rent-storage", protect, rentStorageSpace);

router.get("/rented-storage", protect, getAllRentedStorageSpacesForUser);

module.exports = router;
