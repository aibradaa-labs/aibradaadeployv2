module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.eslint.json"],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked"
  ],
  rules: {
    "no-empty": ["error", { "allowEmptyCatch": true }]
  },
  overrides: [
    // Node/CJS tools & reports – allow require(), script modules
    {
      files: [
        "scripts/**/*.js",
        "reports/**/*.js",
        "ai_pod/tests/**/*.js",
        "ai_pod/scripts/**/*.js",
        "data/**/scripts/**/*.js"
      ],
      env: { node: true },
      parserOptions: { sourceType: "script" },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "no-undef": "off",
        "no-empty": "off"
      }
    },
    // Mobile placeholder shims – allow empty blocks
    {
      files: [
        "ai_pod/mobile/**/*.js",
        "app/js/aipod/**/*.js"
      ],
      rules: { "no-empty": "off" }
    },
    // Generated d.ts tolerances
    {
      files: ["**/*.d.ts"],
      rules: { "@typescript-eslint/no-explicit-any": "warn" }
    }
  ]
};
