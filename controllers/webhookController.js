const User = require("../models/user");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const stripeWebhook = async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Erreur Webhook Stripe :", err.message);
    return res.status(400).send(`Erreur Webhook : ${err.message}`);
  }

  try {
    if (event.type === "account.updated") {
      const account = event.data.object;

      if (account.charges_enabled && account.payouts_enabled) {
        let user = await User.findOne({ stripeAccountId: account.id });

        if (!user) {
          user = await User.findOne({ email: account.email });

          if (user) {
            user.stripeAccountId = account.id; // Sauvegarder Stripe ID
            await user.save();
            console.log(
              `✅ Utilisateur ${user.email} a complété l'onboarding Stripe.`
            );
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("⚠️  Erreur traitement webhook :", error);
    res.status(500).json({ error: "Échec du traitement du webhook" });
  }
};

module.exports = stripeWebhook;
