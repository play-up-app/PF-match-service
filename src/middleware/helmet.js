/**
 * Configuration Helmet simplifiée pour la sécurité de l'API
 * Couvre les principales vulnérabilités OWASP Top 10
 */
const helmetConfig = {
  // Protection XSS - Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },

  // Protection contre le clickjacking
  frameguard: {
    action: "deny",
  },

  // Protection contre le MIME-type sniffing
  noSniff: true,

  // Activation HTTPS strict
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },

  // Cache DNS sécurisé
  dnsPrefetchControl: true,

  // Masquer le header X-Powered-By
  hidePoweredBy: true,

  // Protection XSS supplémentaire
  xssFilter: true,

  // Politique de référencement sécurisée
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
};

export default helmetConfig;
