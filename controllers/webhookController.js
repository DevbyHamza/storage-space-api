const User = require("../models/User");
const WebhookLog = require("../models/WebhookLog");
const Payout = require("../models/Payout");
const { rentStorageSpace } = require("./renterController");
const { placeOrder } = require("./orderController");
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

    console.log(`✅ Webhook reçu : ${event.type}`);
  } catch (err) {
    console.error("⚠️ Erreur Webhook Stripe :", err.message);
    return res.status(400).json({ error: `Erreur Webhook : ${err.message}` });
  }

  try {
    // ✅ Log the webhook event in DB
    await WebhookLog.create({
      eventId: event.id,
      eventType: event.type,
      payload: event,
    });

    console.log(`📌 Webhook sauvegardé en DB: ${event.id}`);

    // ✅ Handle "account.updated" event (Stripe Express onboarding)
    if (event.type === "account.updated") {
      const account = event.data.object;

      if (
        account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled
      ) {
        let user = await User.findOne({ stripeAccountId: account.id });

        if (user) {
          user.stripeOnboardingCompleted = true;
          await user.save();
          console.log(
            `✅ Utilisateur ${user._id} a terminé l'onboarding Stripe.`
          );
        } else {
          console.warn(
            `⚠️ Aucun utilisateur trouvé pour Stripe ID: ${account.id}`
          );
        }
      } else {
        console.log(
          `⚠️ Compte Stripe ${account.id} n'est pas encore complètement activé.`
        );
      }
    }

    // ✅ Handle "checkout.session.completed" event (successful payments)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.metadata && session.metadata.storageId) {
        // Handle storage space rental
        const { storageId, spaceToRent, startDate, endDate, renterId } =
          session.metadata;

        await rentStorageSpace({
          storageId,
          spaceToRent,
          startDate,
          endDate,
          renterId,
        });

        console.log(
          `✅ Paiement confirmé et espace de stockage loué pour Renter: ${renterId}`
        );
      } else if (session.metadata && session.metadata.productId) {
        // Handle product purchase
        const { storageId, productId, quantity, price, buyerId } =
          session.metadata;

        await placeOrder({
          storageId,
          item: { productId, quantity, price },
          buyerId,
        });

        console.log(
          `✅ Paiement confirmé et commande créée pour l'acheteur: ${buyerId}`
        );
      }
    }

    // ✅ Handle "payout.created" event (when Stripe sends money to users)
    if (event.type === "payout.created") {
      const payout = event.data.object;
      console.log(
        `✅ Payout of $${
          payout.amount / 100
        } ${payout.currency.toUpperCase()} created for ${payout.destination}`
      );

      await Payout.create({
        stripeAccountId: payout.destination,
        amount: payout.amount / 100,
        currency: payout.currency,
        status: payout.status,
        createdAt: new Date(payout.created * 1000),
      });
    }

    // ✅ Handle "payout.failed" event (if payout fails)
    if (event.type === "payout.failed") {
      const payout = event.data.object;
      console.error(
        `❌ Payout failed for ${payout.destination}, amount: $${
          payout.amount / 100
        } ${payout.currency.toUpperCase()}`
      );

      await Payout.create({
        stripeAccountId: payout.destination,
        amount: payout.amount / 100,
        currency: payout.currency,
        status: "failed",
        createdAt: new Date(payout.created * 1000),
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("⚠️ Erreur traitement webhook :", error);
    res.status(500).json({ error: "Échec du traitement du webhook" });
  }
};

module.exports = stripeWebhook;
