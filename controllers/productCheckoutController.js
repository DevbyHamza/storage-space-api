const Stripe = require("stripe");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { placeOrder } = require("./orderController");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createProductCheckoutSession = async (req, res) => {
  try {
    const { storageId, item, userId } = req.body; // ✅ userId is the seller (supplier)
    const { productId, quantity, price } = item;
    const buyerId = req.user.id; // ✅ The user making the purchase

    // Retrieve product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Produit introuvable." });
    }

    // Check stock availability
    if (product.stockQuantity < quantity) {
      return res.status(400).json({ error: "Stock insuffisant." });
    }

    // Calculate total price
    const totalPrice = price * quantity;

    // 🔹 Find the seller's Stripe account ID
    const seller = await User.findById(userId); // ✅ Seller is the userId in req.body
    if (!seller || !seller.stripeAccountId) {
      return res
        .status(400)
        .json({ error: "Le vendeur n'a pas de compte Stripe lié." });
    }

    // Define platform fee (e.g., 10% of the total price)
    const platformFee = Math.round(totalPrice * 0.1 * 100); // 10% fee in cents

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee, // ✅ Platform takes 10% fee
        transfer_data: {
          destination: seller.stripeAccountId, // ✅ Payment goes to seller's Stripe account
        },
      },
      success_url: `${process.env.FRONTEND_URL}/product-listing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/product-listing`,
      metadata: {
        storageId,
        productId,
        quantity,
        price,
        totalPrice,
        buyerId, // ✅ Store buyer's user ID
        sellerId: userId, // ✅ Store seller's Stripe account ID
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement :",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

const handleProductPaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { storageId, productId, quantity, price, buyerId } = session.metadata;

    console.log("Paiement réussi, création de la commande...");

    // Call placeOrder function
    const savedOrder = await placeOrder({
      storageId,
      item: { productId, quantity, price },
      buyerId,
    });

    res.json({
      success: true,
      message: "Paiement réussi, commande créée avec succès.",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Erreur lors du traitement du paiement :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createProductCheckoutSession,
  handleProductPaymentSuccess,
};
