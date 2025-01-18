// models/storageSpaceModel.js
const mongoose = require("mongoose");

const storageSpaceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  surface: { type: Number, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  managerLastName: { type: String, required: true },
  managerFirstName: { type: String, required: true },
  phone: { type: String, required: true },
  photo: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const StorageSpace = mongoose.model("StorageSpace", storageSpaceSchema);

module.exports = StorageSpace;
