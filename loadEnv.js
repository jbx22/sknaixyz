import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), 'env.json')

if (fs.existsSync(envPath)) {
  try {
    const envConfig = JSON.parse(fs.readFileSync(envPath, 'utf8'))
    Object.keys(envConfig).forEach((key) => {
      // Never overwrite real deployment env vars. This keeps Vercel DATABASE_URL,
      // POSTGRES_URL, JWT_SECRET, etc. authoritative.
      if (process.env[key] === undefined || process.env[key] === '') {
        process.env[key] = envConfig[key]
      }
    })
  } catch (error) {
    console.warn('[SKNAI] Could not load env.json:', error?.message || error)
  }
}
