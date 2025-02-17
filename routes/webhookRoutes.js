const express = require("express");
const stripeWebhook = require("../controllers/webhookController");

const router = express.Router();

router.post("/stripe", stripeWebhook); // ✅ Do not apply `express.raw()` here

module.exports = router;
