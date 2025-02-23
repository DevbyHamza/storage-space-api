const Stripe = require("stripe");
const { rentStorageSpace } = require("./renterController");
const storagespace = require("../models/storageSpace");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const moment = require("moment");

const createCheckoutSession = async (req, res) => {
  const { storageId, spaceToRent, startDate, endDate, totalPrice } = req.body;
  const renterId = req.user.id;

  try {
    const storageData = await storagespace.findById(storageId).populate("user");

    if (!storageData) {
      return res.status(404).json({ error: "Espace de stockage introuvable" });
    }

    const landlordStripeAccountId = storageData.user.stripeAccountId;

    const formattedStartDate = moment(startDate).format("YYYY-MM-DD");
    const formattedEndDate = moment(endDate).format("YYYY-MM-DD");

    const spaceName = storageData.name;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Location d'espace de stockage - Espace : ${spaceName}`,
              description: `Location du ${formattedStartDate} au ${formattedEndDate} pour ${spaceToRent} palette(s)`,
            },
            unit_amount: totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/Storagepaymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/search`,
      metadata: {
        storageId,
        spaceName,
        spaceToRent,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        totalPrice,
        renterId,
      },
      payment_intent_data: {
        application_fee_amount: Math.floor(totalPrice * 0.1 * 100),
        transfer_data: {
          destination: landlordStripeAccountId,
        },
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const handlePaymentSuccess = async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const {
      storageId,
      spaceName,
      spaceToRent,
      startDate,
      endDate,
      totalPrice,
      renterId,
    } = session.metadata;

    console.log("✅ Paiement réussi, aucune action requise ici.");

    res.json({
      success: true,
      message: "Paiement confirmé avec succès.",
      metadata: {
        spaceName,
        spaceToRent,
        startDate,
        endDate,
        totalPrice,
        renterId,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération session Stripe :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
module.exports = {
  createCheckoutSession,
  handlePaymentSuccess,
};
