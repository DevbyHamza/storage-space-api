const Product = require("../models/Product");
const Rental = require("../models/Rental");

const createProduct = async (req, res) => {
  try {
    const {
      productName,
      pickupLocation,
      brand,
      quantity,
      price,
      area,
      description,
      rentedSpaceId,
    } = req.body;

    // Check if product name already exists
    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Un produit avec ce nom existe déjà." });
    }

    const productPhoto = req.uploadedImages?.find(
      (image) => image.field === "productPhoto"
    )?.url;

    if (!productPhoto) {
      return res
        .status(400)
        .json({ message: "La photo du produit est obligatoire." });
    }

    const rentedSpace = await Rental.findById(rentedSpaceId);
    if (!rentedSpace) {
      return res.status(400).json({ message: "Espace loué non trouvé." });
    }

    const newProduct = new Product({
      productName,
      pickupLocation,
      brand,
      quantity,
      price,
      area,
      description,
      productPhoto,
      rentedSpaceId,
      stockQuantity: quantity,
    });

    // Save the product and update the rental simultaneously
    const [product] = await Promise.all([
      newProduct.save(),
      Rental.findByIdAndUpdate(
        rentedSpaceId,
        { $push: { products: newProduct._id } },
        { new: true }
      ),
    ]);

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès !",
      data: product,
    });
  } catch (error) {
    console.error("Erreur lors de la création du produit :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la création du produit.",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      pickupLocation,
      brand,
      quantity,
      price,
      area,
      description,
      rentedSpaceId,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé." });
    }

    // Check if product name already exists, excluding the current product
    const existingProduct = await Product.findOne({
      productName,
      _id: { $ne: id },
    });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Un produit avec ce nom existe déjà." });
    }

    if (rentedSpaceId) {
      const rentedSpace = await Rental.findById(rentedSpaceId);
      if (!rentedSpace) {
        return res.status(400).json({ message: "Espace loué non trouvé." });
      }
    }

    product.productName = productName || product.productName;
    product.pickupLocation = pickupLocation || product.pickupLocation;
    product.brand = brand || product.brand;
    product.quantity = quantity || product.quantity;
    product.price = price || product.price;
    product.area = area || product.area;
    product.description = description || product.description;
    product.rentedSpaceId = rentedSpaceId || product.rentedSpaceId;

    if (req.uploadedImages?.length > 0) {
      const updatedPhoto = req.uploadedImages.find(
        (image) => image.field === "productPhoto"
      )?.url;
      if (updatedPhoto) product.productPhoto = updatedPhoto;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès !",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la mise à jour du produit.",
      error: error.message,
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé." });
    }

    await Promise.all([
      Rental.updateMany({ products: id }, { $pull: { products: id } }),
      Product.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du produit :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la suppression du produit.",
      error: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({
        path: "rentedSpaceId",
        match: { active: true }, // Only include active rentals
        select: "storageId renterId",
        populate: {
          path: "storageId",
          select: "user", // Ensure we get the user reference
          populate: {
            path: "user",
            select: "retrievalTimes retrievalDays",
          },
        },
      })
      .lean(); // Converts Mongoose documents to plain JSON

    // Flatten the response by extracting retrievalDays and retrievalTimes
    const flattenedProducts = products.map((product) => {
      const rentedSpace = product.rentedSpaceId;
      const storageSpace = rentedSpace?.storageId;
      const supplierId = rentedSpace?.renterId;
      const user = storageSpace?.user;

      return {
        ...product,
        retrievalTimes: user?.retrievalTimes || null,
        retrievalDays: user?.retrievalDays || null,
        rentedSpaceId: rentedSpace?._id || null,
        storageId: storageSpace?._id || null,
        supplierId: supplierId?._id || null,
      };
    });

    res.status(200).json({
      success: true,
      message: "Produits récupérés avec succès.",
      data: flattenedProducts,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la récupération des produits.",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
};
