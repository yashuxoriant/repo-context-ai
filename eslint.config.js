import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "test/fixtures/**", "openspec/**", ".github/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  }
];
