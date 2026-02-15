// jest.global-teardown.ts
import { execSync } from 'child_process'

export default async () => {
  console.log('\nStopping test database container...');
  // The `-v` flag removes the volume, ensuring a clean slate for the next run.
  execSync('docker-compose down -v', { stdio: 'inherit' });
  console.log('Test database container stopped.');
};
