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
// Charger les variables d'environnement depuis un fichier .env
dotenv.config();

// Vérification des variables d'environnement requises
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("Variables d'environnement requises manquantes");
  process.exit(1); // Arrêter l'application si elles ne sont pas définies
}

// Connexion à la base de données MongoDB
connectDB();

const app = express();

// Route de test pour vérifier si le serveur fonctionne
app.get("/", (req, res) => {
  res.send("Le serveur fonctionne !");
});

// Middleware pour traiter les données JSON
app.use(express.json());

// Middleware pour améliorer la sécurité avec des en-têtes HTTP
app.use(helmet());

// Activer CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: "*", // Permet les requêtes provenant de toutes les origines
  })
);

// Middleware de journalisation pour enregistrer les requêtes
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Limiteur de débit pour protéger contre les abus de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  max: 100, // Limite à 100 requêtes par IP
  message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  headers: true,
});
app.use(limiter);

// Routes pour l'authentification
app.use("/api/auth", authRoutes);

// Routes pour la gestion de l'espace de stockage
app.use("/api/storageSpace", storageSpaceRouter);

// Middleware pour gérer les erreurs globales
app.use(errorHandler);

// Middleware pour gérer les routes non trouvées
app.use((req, res, next) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

module.exports = app;
