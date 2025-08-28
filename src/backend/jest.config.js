module.exports = {
  preset: 'ts-jest', // Use ts-jest preset
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'], // Adjust if your tests are .js
  // You might not need 'transform' if 'preset' is used, but it's harmless if present.
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'], // Ensure it can resolve TS files
};