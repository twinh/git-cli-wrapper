module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  "env": {
    "jest": true
  },
  rules: {
    'object-curly-spacing': ['error', 'never'],
    '@typescript-eslint/explicit-function-return-type': ['off'], // Conflict with no-useless-return
    '@typescript-eslint/no-explicit-any': ["error", {ignoreRestArgs: true}]
  },
};
