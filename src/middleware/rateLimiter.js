import rateLimit from "express-rate-limit";

// Limiteur global pour toutes les routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: {
    status: "error",
    message:
      "Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes",
  },
  standardHeaders: true, // Retourne les en-têtes rate limit info dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les en-têtes `X-RateLimit-*`
});

export default globalLimiter;
