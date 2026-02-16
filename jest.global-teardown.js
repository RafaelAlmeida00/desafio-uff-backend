"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// jest.global-teardown.ts
const child_process_1 = require("child_process");
exports.default = async () => {
    console.log('\nStopping test database container...');
    // The `-v` flag removes the volume, ensuring a clean slate for the next run.
    (0, child_process_1.execSync)('docker-compose down -v', { stdio: 'inherit' });
    console.log('Test database container stopped.');
};
