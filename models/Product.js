const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      unique: true, // Ensure uniqueness
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    area: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    productPhoto: {
      type: String,
      required: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0, // Ensures stock quantity cannot be negative
    },
    rentedSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
