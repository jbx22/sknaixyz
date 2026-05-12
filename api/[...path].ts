import '../loadEnv.js'
import type { IncomingMessage, ServerResponse } from 'http'
import { handle } from '@hono/node-server/vercel'
import { app } from '../server.ts'

const honoHandler = handle(app)

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Vercel rewrites /_api/* to /api/*; restore the app's expected /_api/* path.
  if (req.url?.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api\//, '/_api/')
  }
  return honoHandler(req, res)
}
