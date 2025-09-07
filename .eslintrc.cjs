module.exports = {
  env: { node: true, es2022: true, mocha: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off'
  }
};