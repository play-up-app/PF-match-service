# Étape de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code
COPY . .

# Étape de production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src/config ./config
COPY --from=builder /app/src/middleware ./middleware
COPY --from=builder /app/src/routes ./routes
COPY --from=builder /app/src/repositories ./repositories
COPY --from=builder /app/src/controllers ./controllers
COPY --from=builder /app/src/index.js ./

# Créer le dossier pour les logs
RUN mkdir -p /app/logs

# Exposer le port
EXPOSE 3003

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3003

# Commande de démarrage
CMD ["node", "index.js"]