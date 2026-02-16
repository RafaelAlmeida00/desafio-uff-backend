// jest.setup.js

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test file
config({ path: resolve(process.cwd(), '.env.test') });
