const Stripe = require("stripe");
const Product = require("../models/Product");
const User = require("../models/user");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createProductCheckoutSession = async (req, res) => {
  try {
    const { storageId, item, supplierId } = req.body;
    if (!storageId || !item || !supplierId) {
      return res.status(400).json({ error: "Données manquantes." });
    }

    const { productId, quantity, price } = item;
    const buyerId = req.user.id;

    // 🔹 Vérifier l'existence du produit
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Produit introuvable." });
    }

    // 🔹 Vérifier la quantité en stock
    if (product.stockQuantity < quantity) {
      return res.status(409).json({ error: "Stock insuffisant." });
    }

    // 🔹 Trouver le compte Stripe du vendeur
    const seller = await User.findById(supplierId);
    if (!seller || !seller.stripeAccountId) {
      return res
        .status(400)
        .json({ error: "Le vendeur n'a pas de compte Stripe lié." });
    }

    // 🔹 Calcul du prix total et des frais de plateforme
    const totalPrice = parseFloat(price).toFixed(2) * quantity;
    const platformFee = Math.round(totalPrice * 0.1 * 100); // 10% de frais en centimes

    // 🔹 Création de la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: product.productName,
              description: product.description,
            },
            unit_amount: Math.round(parseFloat(price).toFixed(2) * 100), // Conversion en centimes
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: seller.stripeAccountId,
        },
      },
      success_url: `${process.env.FRONTEND_URL}ProductPaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}product-listing`,
      metadata: {
        storageId,
        productId,
        quantity,
        price,
        totalPrice,
        buyerId,
        sellerId: supplierId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement :",
      error
    );

    let errorMessage = "Erreur interne du serveur.";
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = "Erreur Stripe : Requête invalide.";
    } else if (error.type === "StripeAPIError") {
      errorMessage = "Erreur de communication avec Stripe.";
    }

    res.status(500).json({ error: errorMessage });
  }
};
const handleProductPaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log(`✅ Paiement confirmé pour session_id: ${session_id}`);

    res.json({
      success: true,
      message: "Paiement confirmé avec succès.",
      metadata: session.metadata,
    });
  } catch (error) {
    console.error("❌ Erreur lors du traitement du paiement :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
module.exports = {
  createProductCheckoutSession,
  handleProductPaymentSuccess,
};
