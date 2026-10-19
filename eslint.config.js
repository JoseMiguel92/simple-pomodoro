// @ts-check
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

// Flat config: quality rules only, no formatting rules (Prettier owns formatting).
module.exports = tseslint.config(
  {
    // Generated or tooling files (CL-2)
    ignores: ['dist/', 'coverage/', '.angular/', '.husky/', 'package-lock.json'],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    // Lint templates declared inline in components too
    processor: angular.processInlineTemplates,
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },
);
