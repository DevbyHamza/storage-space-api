const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  stripeTransactionId: { type: String, required: true, unique: true },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: {
    type: String,
    enum: ["réussi", "échoué", "en attente"],
    required: true,
  },
  type: {
    type: String,
    enum: ["achat_produit", "location_espace"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
