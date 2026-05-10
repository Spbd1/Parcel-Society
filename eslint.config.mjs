import js from "@eslint/js";
import tseslint from "typescript-eslint";

const readonlyGlobals = (...names) =>
  Object.fromEntries(names.map((name) => [name, "readonly"]));

const nodeGlobals = readonlyGlobals(
  "Buffer",
  "__dirname",
  "__filename",
  "console",
  "global",
  "process",
  "setImmediate",
  "clearImmediate",
);

const webGlobals = readonlyGlobals(
  "AbortController",
  "Blob",
  "BodyInit",
  "Crypto",
  "Document",
  "Element",
  "Event",
  "File",
  "FormData",
  "Headers",
  "HeadersInit",
  "HTMLInputElement",
  "MouseEvent",
  "Request",
  "Response",
  "ResponseInit",
  "TextDecoder",
  "TextEncoder",
  "URL",
  "URLSearchParams",
  "Window",
  "atob",
  "btoa",
  "clearInterval",
  "clearTimeout",
  "crypto",
  "document",
  "fetch",
  "localStorage",
  "navigator",
  "setInterval",
  "setTimeout",
  "window",
);

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "packages/db/generated/**",
      "apps/web/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        ...webGlobals,
        React: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
);
