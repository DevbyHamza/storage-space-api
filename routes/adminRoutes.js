const express = require("express");
const { getAdminDashboardData } = require("../controllers/adminController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/dashboard", protect, getAdminDashboardData);

module.exports = router;
