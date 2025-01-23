// routes/renterRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAvailableStorageSpacesForRenter,
  rentStorageSpace,
  getAllRentedStorageSpacesForUser,
  validateRentalTransaction,
} = require("../controllers/renterController");
const protect = require("../middlewares/authMiddleware");

router.get(
  "/availableStorageSpace",
  protect,
  getAvailableStorageSpacesForRenter
);
router.post("/complete-rental", protect, rentStorageSpace);

router.get("/rented-storage", protect, getAllRentedStorageSpacesForUser);
router.post("/validate-rental-request", protect, validateRentalTransaction);

module.exports = router;
