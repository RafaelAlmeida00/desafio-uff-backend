// jest.setup.js

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.test file
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
