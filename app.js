const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const storageSpaceRouter = require("./routes/storageSpaceRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const logger = require("./utils/logger");
const path = require("path");

dotenv.config();

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("Variables d'environnement requises manquantes");
  process.exit(1);
}

connectDB();

const app = express();

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  headers: true,
});
app.use(limiter);
app.use("/api/auth", authRoutes);
app.use("/api/storageSpace", storageSpaceRouter);
app.use(errorHandler);

module.exports = app;
