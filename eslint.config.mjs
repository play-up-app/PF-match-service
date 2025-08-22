import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default defineConfig([
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        // Ajouter les globals de Node.js
        process: "readonly",
        console: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": ["warn", { allow: ["info", "error", "warn"] }], // Autoriser certaines méthodes console
      "no-unused-vars": "warn",
    },
    extends: [
      ...compat.extends("eslint:recommended"),
      ...compat.extends("plugin:prettier/recommended"),
    ],
  },
]);
