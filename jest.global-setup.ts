// jest.global-setup.ts
import { execSync } from 'child_process'

export default async () => {
  console.log('\nStarting test database container...');
  
  // Start the postgres container in detached mode
  execSync('docker-compose up -d postgres', { stdio: 'inherit' });

  // Wait for the database to be ready.
  // A simple sleep is often enough for local dev, but a more robust check is better.
  // The docker-compose healthcheck helps, but we'll add a polling mechanism here.
  let retries = 15;
  while (retries > 0) {
    try {
      execSync('docker-compose exec -T postgres pg_isready -U desafio_user -d desafio_db', { stdio: 'ignore' });
      console.log('Database is ready!');
      break;
    } catch (e) {
      retries--;
      console.log(`Database not ready, retrying... (${retries} attempts left)`);
      await new Promise(res => setTimeout(res, 2000)); // wait 2 seconds
    }
  }

  if (retries === 0) {
    console.error('Database did not start in time. Aborting tests.');
    // Forcefully kill the container before exiting
    execSync('docker-compose down', { stdio: 'inherit' });
    process.exit(1);
  }

  console.log('Running database migrations for test environment...');
  // Apply migrations to the test database
  execSync('pnpm db:migrate', { stdio: 'inherit' });
  console.log('Migrations applied.');
};
