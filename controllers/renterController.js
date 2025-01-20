const StorageSpace = require("../models/storageSpace");

const getAvailableStorageSpacesForRenter = async (req, res) => {
  try {
    const storageSpaces = await StorageSpace.find()
      .populate(
        "user",
        "retrievalDays retrievalTimes deliveryDays deliveryTimes"
      )
      .where("availableSurface")
      .gt(0);

    const result = storageSpaces.map((space) => {
      const { renters, ...storageSpaceWithoutRenters } = space.toObject();
      return storageSpaceWithoutRenters;
    });

    if (!result.length) {
      return res
        .status(404)
        .json({ message: "Aucune espace de stockage disponible." });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "Erreur lors de la récupération des espaces de stockage disponibles.",
    });
  }
};

const rentStorageSpace = async (req, res) => {
  const { storageId, spaceToRent, startDate, endDate } = req.body;
  const renterId = req.user.id;

  try {
    const storageSpace = await StorageSpace.findById(storageId);

    if (!storageSpace) {
      return res
        .status(404)
        .json({ message: "Espace de stockage non trouvé." });
    }

    if (storageSpace.availableSurface < spaceToRent) {
      return res.status(400).json({
        message: "Surface disponible insuffisante pour cette location.",
      });
    }

    const existingRental = storageSpace.renters.find(
      (renter) =>
        renter.renterId.toString() === renterId.toString() && renter.reserved
    );

    if (existingRental) {
      return res.status(400).json({
        message: "Vous avez déjà loué cet espace de stockage.",
      });
    }

    const overlappingRental = storageSpace.renters.some((renter) => {
      const renterStartDate = new Date(renter.startDate);
      const renterEndDate = new Date(renter.endDate);

      return (
        (new Date(startDate) >= renterStartDate &&
          new Date(startDate) <= renterEndDate) ||
        (new Date(endDate) >= renterStartDate &&
          new Date(endDate) <= renterEndDate) ||
        (new Date(startDate) <= renterStartDate &&
          new Date(endDate) >= renterEndDate)
      );
    });

    if (overlappingRental) {
      return res.status(400).json({
        message:
          "Il y a un chevauchement avec une autre location pendant cette période.",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    const currentDate = new Date();

    let active = false;
    let reserved = true;

    if (parsedStartDate.toDateString() === currentDate.toDateString()) {
      active = true;
      reserved = false;
    }

    storageSpace.availableSurface -= spaceToRent;

    storageSpace.renters.push({
      renterId,
      spaceToRent,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      active,
      reserved,
    });

    await storageSpace.save();

    res.status(200).json({
      message: active
        ? "Espace de stockage loué avec succès et est maintenant actif."
        : "Espace de stockage réservé avec succès.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la réservation de l'espace de stockage.",
    });
  }
};

const getAllRentedStorageSpacesForUser = async (req, res) => {
  const renterId = req.user.id;

  try {
    const rentedSpaces = await StorageSpace.find({
      "renters.renterId": renterId,
    }).populate(
      "user",
      "retrievalDays retrievalTimes deliveryDays deliveryTimes"
    );

    if (!rentedSpaces.length) {
      return res.status(404).json({
        message: "Aucun espace de stockage loué trouvé pour cet utilisateur.",
      });
    }

    const filteredSpaces = rentedSpaces.map((space) => {
      const filteredRenters = space.renters.filter(
        (renter) => renter.renterId.toString() === renterId.toString()
      );

      return {
        ...space.toObject(),
        renters: filteredRenters,
      };
    });

    res.status(200).json(filteredSpaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des espaces de stockage loués.",
    });
  }
};

module.exports = {
  getAvailableStorageSpacesForRenter,
  rentStorageSpace,
  getAllRentedStorageSpacesForUser,
};
