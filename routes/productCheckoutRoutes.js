const express = require("express");
const {
  createProductCheckoutSession,
  handleProductPaymentSuccess,
} = require("../controllers/productCheckoutController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/checkout", protect, createProductCheckoutSession);
router.get("/success", protect, handleProductPaymentSuccess);

module.exports = router;
