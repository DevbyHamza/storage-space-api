const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "storagespace",
      required: true,
    },
    spaceToRent: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    reserved: {
      type: Boolean,
      default: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
