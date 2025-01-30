const Order = require("../models/Order");
const Product = require("../models/Product");
const storagespace = require("../models/storageSpace");

// Function to generate unique order number
const generateUniqueOrderNumber = async () => {
  let orderNumber;
  do {
    // Generate random 4-digit order number
    orderNumber = `Commande#${Math.floor(1000 + Math.random() * 9000)}`;
  } while (await Order.findOne({ orderNumber })); // Ensure uniqueness by checking database
  return orderNumber;
};

// Place an Order
const placeOrder = async (req, res) => {
  try {
    const { storageId, item } = req.body;
    const userId = req.user.id;

    // Validate if the storage exists
    const storage = await storagespace.findById(storageId);
    if (!storage) {
      return res
        .status(404)
        .json({ message: "Espace de stockage non trouvé." });
    }

    // Generate a unique order number
    const orderNumber = await generateUniqueOrderNumber();

    // Calculate total price
    const totalPrice = item.price * item.quantity;

    // Create the order with default status: "À récupérer"
    const newOrder = new Order({
      orderNumber,
      storageId,
      productId: item.productId, // Assuming item contains productId and quantity
      quantity: item.quantity,
      totalPrice,
      status: "À récupérer", // Default status is "À récupérer"
      user: userId, // Save the user who placed the order
    });

    // Save the new order
    const savedOrder = await newOrder.save();

    // Update the product's stock quantity after order placement
    const product = await Product.findById(item.productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Produit non trouvé pour la commande." });
    }

    // Check if the requested quantity is available
    if (product.stockQuantity < item.quantity) {
      return res.status(400).json({
        message: "Quantité en stock insuffisante pour cette commande.",
      });
    }

    // Deduct the stock quantity
    product.stockQuantity -= item.quantity;
    await product.save(); // Save the updated product stock quantity

    res.status(201).json({
      success: true,
      message: "Commande créée et stock mise à jour avec succès !",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la commande :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la création de la commande.",
      error: error.message,
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // Status can be either "À récupérer" or "Récupéré"

    // Validate status
    if (!["À récupérer", "Récupéré"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    // Find order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    // Update the order status
    order.status = status;

    // Save the updated order
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Statut de la commande mis à jour avec succès !",
      data: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de la commande :",
      error
    );
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la mise à jour du statut.",
      error: error.message,
    });
  }
};

// Get all Orders (for user or admin)
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate({
        path: "storageId",
        populate: {
          path: "user",
          select: "retrievalTimes retrievalDays",
        },
      })
      .populate("user")
      .populate("productId")
      .lean();

    const formattedOrders = orders.map((order) => ({
      ...order,
      createdAt: order.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Commandes récupérées avec succès.",
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la récupération des commandes.",
      error: error.message,
    });
  }
};

module.exports = {
  placeOrder,
  updateOrderStatus,
  getOrders,
};
