import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import winston from "winston";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
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

// Middleware de base
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
});
app.use(limiter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  logger.info(`Service de match démarré sur le port ${PORT}`);
});
