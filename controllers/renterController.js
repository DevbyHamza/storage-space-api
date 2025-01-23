const StorageSpace = require("../models/StorageSpace");
const Rental = require("../models/Rental");
const Product = require("../models/Product");

// Helper function for error handling
const handleError = (res, errorMessage, statusCode = 500) => {
  console.error(errorMessage);
  res.status(statusCode).json({
    message: errorMessage,
  });
};

// Normalize date to ensure time zone consistency
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Set time to midnight
  return d;
};

// Get available storage spaces for rent
const getAvailableStorageSpacesForRenter = async (req, res) => {
  try {
    const storageSpaces = await StorageSpace.find()
      .populate(
        "user",
        "retrievalDays retrievalTimes deliveryDays deliveryTimes"
      )
      .where("availableSurface")
      .gt(0);

    if (!storageSpaces.length) {
      return res
        .status(404)
        .json({ message: "Aucune espace de stockage disponible." });
    }

    res.status(200).json(storageSpaces);
  } catch (error) {
    handleError(
      res,
      "Erreur lors de la récupération des espaces de stockage disponibles."
    );
  }
};

// Validate rental transaction
const validateRentalTransaction = async (req, res) => {
  const { storageId, spaceToRent, startDate, endDate } = req.body;
  const renterId = req.user.id;

  try {
    const storageSpace = await StorageSpace.findById(storageId);

    if (!storageSpace) {
      return res.status(404).json({
        message: "Espace de stockage non trouvé.",
        valid: false,
      });
    }

    // Check if the user has already rented this storage space
    const existingRental = await Rental.findOne({
      renterId,
      storageId,
    });

    if (existingRental) {
      return res.status(400).json({
        message: "Vous avez déjà loué cet espace de stockage.",
        valid: false,
      });
    }

    // Check available surface for the rental
    if (storageSpace.availableSurface < spaceToRent) {
      return res.status(400).json({
        message: "Surface disponible insuffisante pour cette location.",
        valid: false,
      });
    }

    res.status(200).json({
      valid: true,
      message: "La transaction de location est valide.",
    });
  } catch (error) {
    handleError(
      res,
      "Erreur lors de la validation de la transaction de location."
    );
  }
};

// Rent a storage space
const rentStorageSpace = async (req, res) => {
  const { storageId, spaceToRent, startDate, endDate } = req.body;
  const renterId = req.user.id;

  try {
    // Fetch the storage space
    const storageSpace = await StorageSpace.findById(storageId);

    if (!storageSpace) {
      return res
        .status(404)
        .json({ message: "Espace de stockage non trouvé." });
    }

    // Check if the user has already rented this storage space
    const existingRental = await Rental.findOne({
      renterId,
      storageId,
    });

    if (existingRental) {
      return res.status(400).json({
        message: "Vous avez déjà loué cet espace de stockage.",
      });
    }

    // Check available surface for the rental
    if (storageSpace.availableSurface < spaceToRent) {
      return res.status(400).json({
        message: "Surface disponible insuffisante pour cette location.",
      });
    }

    // Normalize dates
    const parsedStartDate = normalizeDate(startDate);
    const parsedEndDate = normalizeDate(endDate);
    const currentDate = new Date();

    let active = false;
    let reserved = true;

    if (parsedStartDate.toDateString() === currentDate.toDateString()) {
      active = true;
      reserved = false;
    }

    // Update available and rented surface
    storageSpace.availableSurface -= spaceToRent;
    storageSpace.rentedSurface += spaceToRent;
    await storageSpace.save();

    // Create rental record
    const newRental = new Rental({
      renterId,
      storageId,
      spaceToRent,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      active,
      reserved,
    });

    await newRental.save();

    res.status(200).json({
      message: active
        ? "Espace de stockage loué avec succès et est maintenant actif."
        : "Espace de stockage réservé avec succès.",
    });
  } catch (error) {
    console.error("Error during storage rental:", error);
    handleError(res, "Erreur lors de la réservation de l'espace de stockage.");
  }
};
const getAllRentedStorageSpacesForUser = async (req, res) => {
  const renterId = req.user.id;

  try {
    // Fetch rentals associated with the user, populate both storageId and products
    const rentals = await Rental.find({ renterId })
      .populate({
        path: "storageId", // Populate the storage space details
        model: "StorageSpace", // Ensure the model name for storage space is correct
      })
      .populate({
        path: "products", // Populate the products array in rental
        model: "Product", // Ensure the model name for products is correct
      })
      .exec();

    if (!rentals.length) {
      return res.status(404).json({
        message: "Aucun espace de stockage loué trouvé pour cet utilisateur.",
      });
    }

    // Structure the response to include both storage and product details
    const rentedSpacesWithDetails = rentals.map((rental) => {
      const { storageId, products, ...rentalData } = rental.toObject();
      return {
        ...rentalData,
        storageSpace: storageId, // Include storage space details
        products: products, // Include populated products
      };
    });

    res.status(200).json(rentedSpacesWithDetails);
  } catch (error) {
    console.error("Error fetching rented storage spaces:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des espaces de stockage loués.",
    });
  }
};

module.exports = {
  getAvailableStorageSpacesForRenter,
  rentStorageSpace,
  getAllRentedStorageSpacesForUser,
  validateRentalTransaction,
};
