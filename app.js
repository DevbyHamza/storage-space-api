const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const storageSpaceRouter = require("./routes/storageSpaceRoutes");
const renterRoute = require("./routes/renterRoute");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const storageCheckoutRoutes = require("./routes/storageCheckoutRoutes");
const productCheckoutRoutes = require("./routes/productCheckoutRoutes");
const adminRoutes = require("./routes/adminRoutes");
const logger = require("./utils/logger");

dotenv.config();

// ✅ Vérification des variables d'environnement requises
if (
  !process.env.JWT_SECRET ||
  !process.env.MONGO_URI ||
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_WEBHOOK_SECRET
) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

// ✅ Connexion à MongoDB
connectDB().catch((err) => {
  console.error("❌ Échec de la connexion à la base de données", err);
  process.exit(1);
});

const app = express();

// ✅ Route principale
app.get("/", (req, res) => {
  res.send("Le serveur fonctionne !");
});

// ✅ Ordre des middlewares (important)
app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json());

// ✅ Sécurité et journalisation
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.stripe.com"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);
app.use(cors({ origin: "*" }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.set("trust proxy", 1);

// ✅ Limitation du taux de requêtes (exclure les webhooks)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhook")) {
    return next(); // Ignorer la limitation pour les webhooks
  }
  limiter(req, res, next);
});
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message:
    "Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.",
  headers: true,
});

app.use(limiter);

// ✅ Routes
app.use("/api/webhook", webhookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/storageSpace", storageSpaceRouter);
app.use("/api/renter", renterRoute);
app.use("/api/product", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/storagepayment", storageCheckoutRoutes);
app.use("/api/product-payment", productCheckoutRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée", apiVersion: "v1" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("💀 Arrêt en cours...");
  process.exit(0);
});

module.exports = app;
