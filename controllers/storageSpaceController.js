const storagespace = require("../models/storageSpace");
const createStorageSpace = async (req, res) => {
  try {
    const {
      name,
      surface,
      address,
      price,
      managerLastName,
      managerFirstName,
      phone,
    } = req.body;
    const photo = req.uploadedImages
      ? req.uploadedImages.find((image) => image.field === "photo")?.url
      : null;

    const userId = req.user.id;

    const existingStorageSpace = await storagespace.findOne({ name });
    if (existingStorageSpace) {
      return res
        .status(400)
        .json({ message: "Ce nom d'espace de stockage est déjà utilisé." });
    }

    if (!photo) {
      return res.status(400).json({ message: "La photo est requise." });
    }

    const newStorageSpace = new storagespace({
      name,
      surface,
      availableSurface: surface,
      address,
      price,
      managerLastName,
      managerFirstName,
      phone,
      photo,
      user: userId,
    });

    await newStorageSpace.save();

    res.status(201).json({ message: "Espace de stockage créé avec succès." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la création de l'espace de stockage." });
  }
};

const getAllStorageSpaces = async (req, res) => {
  try {
    const storageSpaces = await storagespace.find({ user: req.user.id });
    res.status(200).json(storageSpaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des espaces de stockage.",
    });
  }
};

const getStorageSpaceById = async (req, res) => {
  try {
    const storageSpace = await storagespace.findById(req.params.id);

    if (!storageSpace) {
      return res
        .status(404)
        .json({ message: "Espace de stockage non trouvé." });
    }

    if (storageSpace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    res.status(200).json(storageSpace);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'espace de stockage.",
    });
  }
};

const updateStorageSpace = async (req, res) => {
  try {
    const {
      name,
      surface,
      address,
      price,
      managerLastName,
      managerFirstName,
      phone,
    } = req.body;
    const photo = req.uploadedImages
      ? req.uploadedImages.find((image) => image.field === "photo")?.url
      : null;

    let storageSpace = await storagespace.findById(req.params.id);

    if (!storageSpace) {
      return res
        .status(404)
        .json({ message: "Espace de stockage non trouvé." });
    }

    if (storageSpace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // Validate rentedSurface against availableSurface if surface changes
    if (surface && surface !== storageSpace.surface) {
      // Ensure that availableSurface doesn't exceed the new surface
      if (storageSpace.rentedSurface > surface) {
        return res.status(400).json({
          message:
            "La surface louée est supérieure à la nouvelle surface disponible.",
        });
      }

      // Recalculate available surface based on the new surface
      storageSpace.availableSurface = surface - storageSpace.rentedSurface;

      // If the availableSurface is negative, set it to 0 (in case surface decreases too much)
      if (storageSpace.availableSurface < 0) {
        storageSpace.availableSurface = 0;
      }
    }

    // Update the fields
    storageSpace.name = name || storageSpace.name;
    storageSpace.surface = surface || storageSpace.surface;
    storageSpace.address = address || storageSpace.address;
    storageSpace.price = price || storageSpace.price;
    storageSpace.managerLastName =
      managerLastName || storageSpace.managerLastName;
    storageSpace.managerFirstName =
      managerFirstName || storageSpace.managerFirstName;
    storageSpace.phone = phone || storageSpace.phone;
    if (photo) storageSpace.photo = photo;

    await storageSpace.save();

    res
      .status(200)
      .json({ message: "Espace de stockage mis à jour avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        error.message ||
        "Erreur lors de la mise à jour de l'espace de stockage.",
    });
  }
};

const deleteStorageSpace = async (req, res) => {
  try {
    const storageSpace = await storagespace.findById(req.params.id);

    if (!storageSpace) {
      return res
        .status(404)
        .json({ message: "Espace de stockage non trouvé." });
    }

    if (storageSpace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    await storagespace.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ message: "Espace de stockage supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la suppression de l'espace de stockage.",
    });
  }
};

module.exports = {
  createStorageSpace,
  getAllStorageSpaces,
  getStorageSpaceById,
  updateStorageSpace,
  deleteStorageSpace,
};
