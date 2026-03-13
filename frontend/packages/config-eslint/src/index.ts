import js from "@eslint/js";
// @ts-ignore - Plugin may not have types
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
// @ts-ignore - Plugins may not have types
import reactPlugin from "eslint-plugin-react";
// @ts-ignore - Plugins may not have types
import hooksPlugin from "eslint-plugin-react-hooks";

export const config = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin as any,
      "react-hooks": hooksPlugin as any,
    },
    rules: {
      ...(reactPlugin.configs.recommended.rules as any),
      ...(hooksPlugin.configs.recommended.rules as any),
      "react/react-in-jsx-scope": "off",
      "react/forbid-component-props": [
        "warn",
        { forbid: [{ propName: "style", message: "Use Tailwind classes or design tokens instead of hardcoded styles." }] }
      ],
    } as any,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  eslintConfigPrettier
);

export default config;
