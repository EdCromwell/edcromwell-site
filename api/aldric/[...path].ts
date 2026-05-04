import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken, createClerkClient } from '@clerk/backend'

/**
 * Catch-all proxy: /api/aldric/* → Cloudflare Tunnel → FastAPI on Mac Mini.
 *
 * Every admin-panel call to the Mac Mini goes through here. The request
 * flow:
 *
 *   browser (Clerk session) ─┐
 *                            │ Authorization: Bearer <clerk jwt>
 *                            ▼
 *   /api/aldric/services  (Vercel fn, this file)
 *     1. verify Clerk JWT
 *     2. verify email matches ADMIN_EMAIL
 *     3. forward to `${TUNNEL_HOSTNAME}/services`
 *        with CF Access service token + Admin API bearer
 *                            │
 *                            ▼
 *   Cloudflare Access  (checks CF-Access-Client-Id/Secret)
 *                            │
 *                            ▼
 *   Cloudflared  →  http://localhost:8000/services
 *                            │
 *                            ▼
 *   FastAPI admin_api.py  (checks Authorization: Bearer <ADMIN_API_TOKEN>)
 *
 * Three independent auth layers: Clerk (user), Cloudflare Access (tunnel
 * gate), FastAPI bearer (app-level). Each must pass. Defence in depth.
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').toLowerCase()

// Cloudflare Tunnel hostname (no protocol). Example:
//   "a1b2c3d4-5e6f-7890-abcd-ef1234567890.cfargotunnel.com"
// or "aldric.edcromwell.com" if you put the domain on Cloudflare DNS.
const TUNNEL_HOSTNAME = process.env.TUNNEL_HOSTNAME

// Cloudflare Access service token — created in Zero Trust dashboard, added
// to the tunnel's Access policy as an allowed identity provider.
const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID
const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET

// App-level bearer token: the same random string set as ADMIN_API_TOKEN on
// the Mac Mini. This guards against the case where the CF Access service
// token leaks — an attacker would still need this to hit the API.
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- Env sanity ---
  if (
    !CLERK_SECRET_KEY ||
    !ADMIN_EMAIL ||
    !TUNNEL_HOSTNAME ||
    !CF_ACCESS_CLIENT_ID ||
    !CF_ACCESS_CLIENT_SECRET ||
    !ADMIN_API_TOKEN
  ) {
    console.error('aldric proxy: missing required env vars')
    return res
      .status(500)
      .json({ error: 'Proxy is missing configuration — contact admin' })
  }

  // --- 1. Verify Clerk JWT ---
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }
  const jwt = authHeader.slice('Bearer '.length)

  let userId: string
  try {
    const claims = await verifyToken(jwt, { secretKey: CLERK_SECRET_KEY })
    userId = claims.sub
  } catch (err) {
    console.warn('aldric proxy: jwt verification failed', err)
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  // --- 2. Verify admin email (fresh Clerk lookup) ---
  try {
    const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY })
    const user = await clerk.users.getUser(userId)
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase()
    const verified =
      user.primaryEmailAddress?.verification?.status === 'verified'
    if (!email || !verified || email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Not authorized' })
    }
  } catch (err) {
    console.error('aldric proxy: clerk user fetch failed', err)
    return res.status(500).json({ error: 'Authorization check failed' })
  }

  // --- 3. Build upstream URL ---
  // Parse req.url directly to extract the subpath after /api/aldric/. We
  // avoid req.query.path because Vercel's [...path] catch-all exposes the
  // segments under the literal key `...path` (three dots + path), not
  // `path`, so the obvious lookup misses and the segment leaks as a query
  // param to upstream. req.url is unambiguous and includes the original
  // query string verbatim.
  const rawUrl = req.url ?? '/'
  const [rawPath, rawQuery = ''] = rawUrl.split('?')

  // Strip the /api/aldric prefix. Anything left is what we forward.
  const subpath = rawPath.replace(/^\/api\/aldric\/?/, '')

  // Everything under /api/aldric/* maps directly to /* on the tunnel host.
  const upstreamUrl = new URL(`https://${TUNNEL_HOSTNAME}/${subpath}`)

  // Forward original query params verbatim, EXCEPT the `...path` one
  // that Vercel injects from the catch-all route.
  if (rawQuery) {
    const incoming = new URLSearchParams(rawQuery)
    for (const [key, value] of incoming.entries()) {
      if (key === '...path' || key === 'path') continue
      upstreamUrl.searchParams.append(key, value)
    }
  }

  // --- 4. Forward the request ---
  const upstreamHeaders: Record<string, string> = {
    // Cloudflare Access service-token headers
    'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
    // App-level bearer for FastAPI
    Authorization: `Bearer ${ADMIN_API_TOKEN}`,
  }
  if (req.headers['content-type']) {
    upstreamHeaders['Content-Type'] = String(req.headers['content-type'])
  }

  let upstreamBody: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    upstreamBody =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  }

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstreamUrl.toString(), {
      method: req.method ?? 'GET',
      headers: upstreamHeaders,
      body: upstreamBody,
    })
  } catch (err: any) {
    console.error('aldric proxy: upstream fetch failed', err)
    return res.status(502).json({
      error: 'Could not reach Aldric admin API',
      detail: err?.message,
    })
  }

  // --- 5. Relay the response ---
  const bodyText = await upstreamRes.text()
  res.status(upstreamRes.status)

  // Pass through content-type so JSON comes back as JSON.
  const ct = upstreamRes.headers.get('content-type')
  if (ct) res.setHeader('Content-Type', ct)

  return res.send(bodyText)
}
