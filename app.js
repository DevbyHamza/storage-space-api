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
const logger = require("./utils/logger");

dotenv.config();

// ✅ Ensure required environment variables exist
if (
  !process.env.JWT_SECRET ||
  !process.env.MONGO_URI ||
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_WEBHOOK_SECRET
) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

// ✅ Connect to MongoDB
connectDB().catch((err) => {
  console.error("❌ Failed to connect to DB", err);
  process.exit(1);
});

const app = express();

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// ✅ Middleware Order (Important)
app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json());

// ✅ Security & Logging Middleware
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

// ✅ Rate Limiting (Exclude Webhooks)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhook")) {
    return next(); // Skip rate limit for webhook
  }
  limiter(req, res, next);
});

// ✅ Rate Limiting to Prevent Abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
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

// ✅ Custom Error Handling Middleware
app.use(errorHandler);

// ✅ 404 Handler for Unmatched Routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", apiVersion: "v1" });
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("💀 Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
