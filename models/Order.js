const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    storageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "storagespace",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["À récupérer", "Récupéré"],
      default: "À récupérer",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    stripeSessionId: {
      type: String,
      unique: true, // ✅ Ensures only one order per Stripe session
      required: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
