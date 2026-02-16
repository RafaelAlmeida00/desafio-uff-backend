module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/jest.global-setup.ts',
  globalTeardown: '<rootDir>/jest.global-teardown.ts',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__dist_project/'],
  testTimeout: 60000,
}
