const { config } = require('dotenv')
const { resolve } = require('path')

config({ path: resolve(process.cwd(), '.env.test') })
