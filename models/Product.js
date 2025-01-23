const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
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
      min: 1, // Ensuring quantity is positive
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Price must be positive
    },
    area: {
      type: Number,
      required: true,
      min: 1, // Ensure area is a positive number
    },
    description: {
      type: String,
      required: true,
    },
    productPhoto: {
      type: String, // Store URL of the image
      required: true,
    },
    rentedSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental", // Reference to Rental model instead of StorageSpace
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
