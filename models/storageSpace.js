const mongoose = require("mongoose");

const storageSpaceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  surface: { type: Number, required: true },
  availableSurface: { type: Number, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  managerLastName: { type: String, required: true },
  managerFirstName: { type: String, required: true },
  phone: { type: String, required: true },
  photo: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  renters: [
    {
      renterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      spaceToRent: { type: Number, required: true },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      active: { type: Boolean, default: false },
      reserved: { type: Boolean, default: false },
    },
  ],
});

const StorageSpace = mongoose.model("StorageSpace", storageSpaceSchema);

module.exports = StorageSpace;
