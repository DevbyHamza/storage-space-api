const Product = require("../models/Product");
const StorageSpace = require("../models/storageSpace");
const Transaction = require("../models/Transaction");
const User = require("../models/user");

exports.getAdminDashboardData = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const { type } = req.query; // ✅ Get requested data type
    let result;

    switch (type) {
      case "transactions":
        result = await Transaction.find();
        break;
      case "users":
        result = await User.find();
        break;
      case "spaces":
        result = await StorageSpace.find();
        break;
      case "products":
        result = await Product.find();
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Type invalide" });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};
