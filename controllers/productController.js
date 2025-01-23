const Product = require("../models/Product");
const Rental = require("../models/Rental");

// Create a new product
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

    // Get product photo URL from uploaded images
    const productPhoto = req.uploadedImages?.find(
      (image) => image.field === "productPhoto"
    )?.url;

    if (!productPhoto) {
      return res.status(400).json({ message: "Product photo is required." });
    }

    // Check if the rented space exists
    const rentedSpace = await Rental.findById(rentedSpaceId);
    if (!rentedSpace) {
      return res.status(400).json({ message: "Rented space not found." });
    }

    // Create a new product
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
    });

    // Save the new product
    const product = await newProduct.save();

    // Update the rental document by adding the product ID to the products array
    rentedSpace.products.push(product._id);
    await rentedSpace.save(); // Save the updated rental document

    // Return the created product and success message
    res.status(201).json({
      success: true,
      message: "Produit créé avec succès !",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la création du produit.",
      error: error.message,
    });
  }
};

// Update an existing product
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

    // Find the product by ID
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Update the product fields
    product.productName = productName || product.productName;
    product.pickupLocation = pickupLocation || product.pickupLocation;
    product.brand = brand || product.brand;
    product.quantity = quantity || product.quantity;
    product.price = price || product.price;
    product.area = area || product.area;
    product.description = description || product.description;
    product.rentedSpaceId = rentedSpaceId || product.rentedSpaceId;

    // Handle photo update
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      const updatedPhoto = req.uploadedImages.find(
        (image) => image.field === "productPhoto"
      )?.url;
      if (updatedPhoto) {
        product.productPhoto = updatedPhoto;
      }
    }

    // Save the updated product
    product = await product.save();

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès !",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
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

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Remove the product from any Rental document that contains it
    await Rental.updateMany({ products: id }, { $pull: { products: id } });

    // Delete the product
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès !",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la suppression du produit.",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
};
