import express from "express";
import corsOptions from "./middleware/cors.js";
import helmetConfig from "./middleware/helmet.js";
import globalLimiter from "./middleware/rateLimiter.js";
import winston from "winston";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import cors from "cors";
import MatchRoute from "./routes/match.route.js";
import MatchController from "./controllers/match.controller.js";
import MatchRepository from "./repositories/match.repository.js";

dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(globalLimiter);

// Middleware de base
app.use(
  express.json({
    limit: "10kb", // Limite la taille des requêtes JSON
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb", // Limite la taille des données de formulaire
  }),
);
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Initialisation des dépendances
const matchRepository = new MatchRepository();
const matchController = new MatchController(matchRepository);
const matchRoute = new MatchRoute(matchController);

// Routes
app.use("/api", matchRoute.router);

// Middleware de gestion d'erreur global
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Une erreur est survenue",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  logger.info(`Service de match démarré sur le port ${PORT}`);
});
