const express = require("express");
const {
  getAdminDashboardData,
  deleteAdminData,
  updateUser, // Import the updateUser function
} = require("../controllers/adminController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/dashboard", protect, getAdminDashboardData);
router.delete("/:type/:id", protect, deleteAdminData); // Delete API
router.put("/users/:id", protect, updateUser); // Update User API ✅

module.exports = router;
