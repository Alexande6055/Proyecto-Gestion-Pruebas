const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env if present
const envPath = path.resolve(__dirname, '..', '.env')
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath })

const host = process.env.DB_HOST
const port = process.env.DB_PORT || 5432
const user = process.env.DB_USERNAME
const password = process.env.DB_PASSWORD
const database = process.env.DB_NAME
const useSsl = (process.env.DB_SSL || 'false') === 'true'

console.log('Testing DB connection with:', { host, port, user, database, useSsl })

const client = new Client({
  host,
  port: Number(port),
  user,
  password,
  database,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

async function run() {
  try {
    await client.connect()
    const res = await client.query('SELECT NOW()')
    console.log('Connected — server time:', res.rows[0])
    await client.end()
    process.exit(0)
  } catch (err) {
    console.error('Connection failed:', err)
    process.exit(1)
  }
}

run()
