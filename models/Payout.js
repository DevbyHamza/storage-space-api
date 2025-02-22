const mongoose = require("mongoose");

const PayoutSchema = new mongoose.Schema({
  stripeAccountId: { type: String, required: true }, // Landlord's Stripe ID
  amount: { type: Number, required: true }, // Amount in EUR/USD
  currency: { type: String, required: true }, // Currency (eur, usd, etc.)
  status: { type: String, required: true, enum: ["pending", "paid", "failed"] }, // Payout status
  createdAt: { type: Date, default: Date.now }, // Date of payout
});

module.exports = mongoose.model("Payout", PayoutSchema);
