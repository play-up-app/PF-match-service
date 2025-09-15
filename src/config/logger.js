import winston from "winston";

/**
 * Configuration centralisée du logger Winston
 * Suit les principes du Clean Code pour la séparation des responsabilités
 */
const createLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: "HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let log = `${timestamp} [${level}]: ${message}`;

      // Ajouter les métadonnées si elles existent
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }

      return log;
    }),
  );

  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: logFormat,
    defaultMeta: {
      service: "match-service",
      version: process.env.npm_package_version || "1.0.0",
    },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
    // Gestion des exceptions non capturées
    exceptionHandlers: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
    // Gestion des rejets de promesses non gérés
    rejectionHandlers: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
  });
};

// Export d'une instance singleton du logger
const logger = createLogger();

export default logger;
