module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // or 'jsdom' for browser-based tests
  // Optionally, specify test file patterns
  testMatch: ['**/*.spec.(ts|tsx)'],
};