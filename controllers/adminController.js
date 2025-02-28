const Product = require("../models/Product");
const StorageSpace = require("../models/storageSpace");
const Transaction = require("../models/Transaction");
const User = require("../models/user");
const Rental = require("../models/Rental");

exports.getAdminDashboardData = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const { type } = req.query;
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
    console.error("Erreur de récupération:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.deleteAdminData = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const { type, id } = req.params;
    let deletedItem;

    switch (type) {
      case "transactions":
        deletedItem = await Transaction.findByIdAndDelete(id);
        break;

      case "users":
        const user = await User.findById(id);
        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "Utilisateur introuvable" });
        }

        if (user.role === "Admin") {
          return res.status(400).json({
            success: false,
            message: "Impossible de supprimer un administrateur",
          });
        }

        const userSpaces = await StorageSpace.find({ user: id });
        const hasActiveRentals = await Rental.exists({
          $or: [
            { storageId: { $in: userSpaces.map((s) => s._id) }, active: true },
            { renterId: id, active: true },
          ],
        });

        if (hasActiveRentals) {
          return res.status(400).json({
            success: false,
            message:
              "Impossible de supprimer l'utilisateur, locations actives.",
          });
        }

        deletedItem = await User.findByIdAndDelete(id);
        break;

      case "spaces":
        if (await Rental.exists({ storageId: id, active: true })) {
          return res.status(400).json({
            success: false,
            message: "Impossible de supprimer l'espace, locations actives.",
          });
        }
        deletedItem = await StorageSpace.findByIdAndDelete(id);
        break;

      case "products":
        deletedItem = await Product.findByIdAndDelete(id);
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Type invalide" });
    }

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Élément non trouvé" });
    }

    res.status(200).json({ success: true, message: "Supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const { id } = req.params;
    const { name, firstName, email, mobilePhone, role } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable" });
    }

    // Prevent role modification of Admins
    if (user.role === "Admin" && role && role !== "Admin") {
      return res.status(400).json({
        success: false,
        message: "Impossible de modifier le rôle d'un administrateur",
      });
    }

    // Prevent duplicate email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Cet email est déjà utilisé" });
      }
    }

    // Update user fields
    user.name = name || user.name;
    user.firstName = firstName || user.firstName;
    user.email = email || user.email;
    user.mobilePhone = mobilePhone || user.mobilePhone;
    user.role = role || user.role;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: user,
    });
  } catch (error) {
    console.error("Erreur de mise à jour :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
