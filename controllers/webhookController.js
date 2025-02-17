const User = require("../models/user");
const WebhookLog = require("../models/WebhookLog"); // ✅ Import WebhookLog model
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const stripeWebhook = async (req, res) => {
  let event;

  try {
    // ✅ Extract and verify the Stripe signature
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body required
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`✅ Webhook reçu : ${event.type}`);
  } catch (err) {
    console.error("⚠️ Erreur Webhook Stripe :", err.message);
    return res.status(400).json({ error: `Erreur Webhook : ${err.message}` });
  }

  try {
    // ✅ Save webhook event to MongoDB
    await WebhookLog.create({
      eventId: event.id,
      eventType: event.type,
      payload: event,
    });

    console.log(`📌 Webhook sauvegardé en DB: ${event.id}`);

    // ✅ Handle "account.updated" event
    if (event.type === "account.updated") {
      const account = event.data.object;

      if (account.charges_enabled && account.payouts_enabled) {
        let user = await User.findOne({ stripeAccountId: account.id });

        if (!user) {
          user = await User.findOne({ email: account.email });

          if (user) {
            user.stripeAccountId = account.id;
            await user.save();
            console.log(
              `✅ Utilisateur ${user.email} a complété l'onboarding Stripe.`
            );
          } else {
            console.warn(
              `⚠️ Aucun utilisateur trouvé pour Stripe ID: ${account.id}`
            );
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("⚠️ Erreur traitement webhook :", error);
    res.status(500).json({ error: "Échec du traitement du webhook" });
  }
};

module.exports = stripeWebhook;
