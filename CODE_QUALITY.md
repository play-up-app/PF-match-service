# Guide de Qualité de Code

Ce document décrit la stratégie et les outils mis en place pour maintenir une haute qualité de code dans le service de match.

## 🛠 Outils

### Prettier
- **Rôle** : Formateur de code automatique
- **Configuration** : `.prettierrc`
- **Extensions recommandées** : 
  - VS Code : "Prettier - Code formatter"
  - IntelliJ : "Prettier"

### ESLint
- **Rôle** : Analyse statique du code
- **Configuration** : `eslint.config.mjs`
- **Extensions recommandées** :
  - VS Code : "ESLint"
  - IntelliJ : "ESLint"

## 📜 Scripts Disponibles

### Scripts de Base

```bash
# Vérification du formatage
npm run format

# Application du formatage
npm run format:fix

# Vérification des règles ESLint
npm run lint

# Correction automatique des erreurs ESLint
npm run lint:fix
```

### Scripts Composés

```bash
# Validation complète du code (format + lint + tests)
npm run validate

# Préparation du code pour commit (format:fix + lint:fix)
npm run prepare-code
```

## 🔄 Workflow Recommandé

### 1. Pendant le Développement

```bash
# Lancer le service en mode développement
npm run dev

# Avant chaque commit, nettoyer le code
npm run prepare-code
```

### 2. Avant de Pusher

```bash
# Vérifier que tout est conforme
npm run validate
```

## 🎯 Bonnes Pratiques

### Configuration de l'Éditeur

1. **Activer "Format on Save"**
   - VS Code : 
     ```json
     {
       "editor.formatOnSave": true,
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     }
     ```
   - IntelliJ :
     - Settings > Languages & Frameworks > JavaScript > Prettier
     - Cocher "Run on save"

2. **Activer "ESLint Auto Fix"**
   - VS Code :
     ```json
     {
       "editor.codeActionsOnSave": {
         "source.fixAll.eslint": true
       }
     }
     ```

### Conventions de Code

1. **Imports**
   - Utiliser les ES modules (`import`/`export`)
   - Grouper les imports par type
   ```javascript
   // Modules Node.js natifs
   import path from 'path';
   
   // Dépendances externes
   import express from 'express';
   
   // Imports locaux
   import { config } from './config';
   ```

2. **Nommage**
   - Variables : camelCase
   - Classes : PascalCase
   - Constantes : UPPER_SNAKE_CASE
   - Fichiers : kebab-case.js

3. **Commentaires**
   - JSDoc pour les fonctions publiques
   - Commentaires en français
   - Éviter les commentaires évidents

## 🚀 Intégration Continue

### GitHub Actions

Le workflow CI exécute :
```bash
npm run validate
```

### Vérifications Automatiques

- ✅ Formatage du code
- ✅ Règles ESLint
- ✅ Tests unitaires
- ✅ Couverture de code

## 🔍 Règles ESLint Personnalisées

```javascript
{
  "rules": {
    "prettier/prettier": "error",
    "no-console": ["warn", { 
      "allow": ["info", "error", "warn"] 
    }],
    "no-unused-vars": "warn"
  }
}
```

## 📋 Liste de Contrôle Avant Commit

1. ✅ Le code est formaté (`npm run format:fix`)
2. ✅ ESLint ne signale pas d'erreurs (`npm run lint:fix`)
3. ✅ Les tests passent (`npm run test`)
4. ✅ La documentation est à jour
5. ✅ Le message de commit suit la convention

