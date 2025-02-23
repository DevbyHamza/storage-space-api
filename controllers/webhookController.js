const User = require("../models/user");
const WebhookLog = require("../models/WebhookLog");
const Payout = require("../models/Payout");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction"); // ✅ Added transaction model
const { placeOrder } = require("./OrderController");
const { rentStorageSpace } = require("./renterController");
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

    // ✅ Handle "account.updated" event
    if (event.type === "account.updated") {
      const account = event.data.object;
      if (
        account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled
      ) {
        const user = await User.findOne({ stripeAccountId: account.id });

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
        console.log(`⚠️ Compte Stripe ${account.id} n'est pas encore activé.`);
      }
    }

    // ✅ Handle "checkout.session.completed" event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(`🔍 Traitement de la session de paiement: ${session.id}`);

      // 🔹 Validate metadata
      if (!session.metadata) {
        console.error(`❌ Session Stripe sans metadata: ${session.id}`);
        return res
          .status(400)
          .json({ error: "Metadata manquant dans la session Stripe" });
      }

      const {
        storageId,
        productId,
        quantity,
        price,
        buyerId,
        sellerId,
        spaceToRent,
        startDate,
        endDate,
        renterId,
      } = session.metadata;

      // 🔹 Vérifier si la transaction a déjà été enregistrée
      const existingTransaction = await Transaction.findOne({
        stripeTransactionId: session.id,
      });

      if (existingTransaction) {
        console.log(`⚠️ Transaction déjà enregistrée: ${session.id}`);
      } else {
        try {
          if (storageId && spaceToRent && startDate && endDate && renterId) {
            // ✅ Handle storage space rental
            await rentStorageSpace({
              storageId,
              spaceToRent,
              startDate,
              endDate,
              renterId,
            });

            await Transaction.create({
              stripeTransactionId: session.id,
              buyerId: renterId,
              sellerId: sellerId,
              amount: session.amount_total / 100,
              currency: session.currency,
              status: "réussi",
              type: "location_espace",
            });

            console.log(`✅ Espace loué pour Renter: ${renterId}`);
          } else if (
            storageId &&
            productId &&
            quantity &&
            price &&
            buyerId &&
            sellerId
          ) {
            // ✅ Handle product purchase
            await placeOrder({
              storageId,
              item: { productId, quantity, price },
              buyerId,
              sellerId,
              stripeSessionId: session.id,
            });

            await Transaction.create({
              stripeTransactionId: session.id,
              buyerId: buyerId,
              sellerId: sellerId,
              amount: session.amount_total / 100,
              currency: session.currency,
              status: "réussi",
              type: "achat_produit",
            });

            console.log(`✅ Produit acheté par: ${buyerId}`);
          } else {
            console.error(
              `❌ Métadonnées invalides pour la session ${session.id}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Erreur lors du traitement de la commande: ${error.message}`
          );
        }
      }
    }

    // ✅ Handle "payout.created" event
    if (event.type === "payout.created") {
      const payout = event.data.object;
      console.log(
        `✅ Payout de $${
          payout.amount / 100
        } ${payout.currency.toUpperCase()} créé pour ${payout.destination}`
      );

      // 🔹 Vérifier si le payout existe déjà
      const existingPayout = await Payout.findOne({
        stripePayoutId: payout.id,
      });

      if (!existingPayout) {
        await Payout.create({
          stripePayoutId: payout.id,
          stripeAccountId: payout.destination,
          amount: payout.amount / 100,
          currency: payout.currency,
          status: payout.status,
          createdAt: new Date(payout.created * 1000),
        });

        await Transaction.create({
          stripeTransactionId: payout.id,
          buyerId: null, // No buyer for payouts
          sellerId: payout.destination,
          amount: payout.amount / 100,
          currency: payout.currency,
          status: payout.status === "paid" ? "réussi" : "en attente",
          type: "payout",
        });

        console.log(`✅ Payout enregistré pour ${payout.destination}`);
      }
    }

    // ✅ Handle "payout.failed" event
    if (event.type === "payout.failed") {
      const payout = event.data.object;
      console.error(
        `❌ Payout échoué pour ${payout.destination}, montant: $${
          payout.amount / 100
        } ${payout.currency.toUpperCase()}`
      );

      await Payout.findOneAndUpdate(
        { stripePayoutId: payout.id },
        { status: "failed" },
        { upsert: true }
      );

      await Transaction.findOneAndUpdate(
        { stripeTransactionId: payout.id },
        { status: "échoué" },
        { upsert: true }
      );

      console.log(`❌ Payout marqué comme échoué: ${payout.id}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("⚠️ Erreur traitement webhook :", error);
    res.status(500).json({ error: "Échec du traitement du webhook" });
  }
};

module.exports = stripeWebhook;
