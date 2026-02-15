module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/jest.global-setup.ts',
  globalTeardown: '<rootDir>/jest.global-teardown.ts',
  testTimeout: 60000, // 60 seconds
};