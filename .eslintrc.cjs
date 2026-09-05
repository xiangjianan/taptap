module.exports = {
  root: true,
  env: {
    es6: true,
    node: false,
    browser: false
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-undef': 'off'
  },
  globals: {
    wx: 'readonly',
    console: 'readonly',
    Canvas: 'readonly',
    Image: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly'
  }
};
