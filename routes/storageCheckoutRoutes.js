// storageCheckoutRouter.js

const express = require("express"); // Import JWT authentication middleware
const {
  createCheckoutSession,
  handlePaymentSuccess,
} = require("../controllers/storageCheckoutController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);

// Route for handling successful payment
router.get("/payment-success", handlePaymentSuccess);

module.exports = router;
