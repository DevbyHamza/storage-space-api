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
const productRouts = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const webhookRoutes = require("./routes/webhookRoutes");
const logger = require("./utils/logger");

dotenv.config();
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("Variables d'environnement requises manquantes");
  process.exit(1);
}

connectDB();

const app = express();

app.get("/", (req, res) => {
  res.send("Le serveur fonctionne !");
});

// 🔥 Apply express.json() globally *EXCEPT* for Stripe Webhooks
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhook/stripe") {
    next(); // Skip JSON middleware for Stripe Webhook
  } else {
    express.json()(req, res, next);
  }
});

app.use(helmet());

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.set("trust proxy", 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  headers: true,
});
app.use(limiter);

// ✅ Use express.raw() only for Stripe Webhook
app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));
app.use("/api/webhook", webhookRoutes); // Load webhook routes after raw body

app.use("/api/auth", authRoutes);
app.use("/api/storageSpace", storageSpaceRouter);
app.use("/api/renter", renterRoute);
app.use("/api/product", productRouts);
app.use("/api/orders", orderRoutes);
app.use(errorHandler);

app.use((req, res, next) => {
  res.status(404).json({ message: "Route non trouvée" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

module.exports = app;
