const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  placeOrder,
  updateOrderStatus,
  getOrders,
} = require("../controllers/OrderController");

const router = express.Router();

// Update Order Status Route
router.put(
  "/updateStatus/:orderId", // Update order status by order ID
  protect, // Ensure the user is authenticated
  updateOrderStatus // Handle updating order status
);

// Get Orders Route
router.get(
  "/getOrders", // Get orders of the authenticated user
  protect, // Ensure the user is authenticated
  getOrders // Fetch orders for the logged-in user
);

module.exports = router;
