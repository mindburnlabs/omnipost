
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Remove problematic rules that require type information
      // "@typescript-eslint/no-floating-promises": "error",
      // "@typescript-eslint/strict-boolean-expressions": "warn",
      // HARDENING: Prevent new stub/mock/demo introductions outside allowed directories
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/\\b(mock|stub|fake)\\b/i]",
          "message": "Mock/stub/fake references not allowed in production code. Use real implementations or move to /demo, /tests, or /docs directories."
        },
        {
          "selector": "Identifier[name=/\\b(mock|stub|fake)\\w*/i]",
          "message": "Mock/stub/fake variable names not allowed in production code. Use descriptive names for real implementations."
        }
      ]
    },
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}"
    ],
    ignores: [
      "src/**/*demo*.{ts,tsx}",
      "src/**/*test*.{ts,tsx}",
      "src/**/*mock*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      // Allow demo-related patterns in demo workspace files
      "src/app/next_api/workspaces/demo/**/*.{ts,tsx}",
      "src/components/demo/**/*.{ts,tsx}",
      // Allow template-related patterns in template features
      "src/app/**/templates/**/*.{ts,tsx}",
      "src/components/templates/**/*.{ts,tsx}",
      "src/app/next_api/content-templates/**/*.{ts,tsx}",
      // Allow placeholder in UI components for user input hints
      "src/components/ui/**/*.{ts,tsx}"
    ]
  },
];

export default eslintConfig;
