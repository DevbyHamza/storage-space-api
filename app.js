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
  console.error("Missing required environment variables");
  process.exit(1);
}

connectDB();

const app = express();

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use(express.json());
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true,
});
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/storageSpace", storageSpaceRouter);

app.use(errorHandler);
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
