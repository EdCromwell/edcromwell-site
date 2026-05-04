import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken, createClerkClient } from '@clerk/backend'
import { Octokit } from '@octokit/rest'

/**
 * POST /api/content/update
 *
 * Server-side content commit endpoint. The frontend admin editor calls this
 * with a JSON body like { path: "content/projects.json", content: [...] }
 * and a Clerk session token in the Authorization header. This function:
 *
 *   1. Verifies the Clerk JWT is valid and unexpired (cryptographic check).
 *   2. Fetches the Clerk user and verifies their primary email matches the
 *      ADMIN_EMAIL allowlist — NOT the client-side check in RequireAdmin,
 *      a fresh server-side check against Clerk's backend.
 *   3. Validates the body against a narrow allowlist of editable paths.
 *   4. Fetches the current file SHA from GitHub (needed for optimistic
 *      concurrency — two tabs editing at once would collide here, which is
 *      the behavior we want).
 *   5. Commits the new content with a traceable commit message.
 *
 * Errors fail closed. A request missing any piece returns 401/403/400, never
 * a silent success.
 */

// --- Required env vars (set in Vercel dashboard) ---
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').toLowerCase()
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? 'EdCromwell'
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'edcromwell-site'
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? 'main'

// --- Allowlist: only these paths can be written. Never accept arbitrary paths
//     from the client — that would let an attacker rewrite package.json. ---
const EDITABLE_PATHS = new Set<string>([
  'content/projects.json',
  'content/me.json',
])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- Method guard ---
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // --- Env sanity ---
  if (!CLERK_SECRET_KEY || !ADMIN_EMAIL || !GITHUB_TOKEN) {
    console.error('content/update: missing required env vars', {
      hasClerk: !!CLERK_SECRET_KEY,
      hasAdmin: !!ADMIN_EMAIL,
      hasGithub: !!GITHUB_TOKEN,
    })
    return res
      .status(500)
      .json({ error: 'Server is missing required configuration' })
  }

  // --- 1. Verify Clerk JWT ---
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }
  const token = authHeader.slice('Bearer '.length)

  let userId: string
  try {
    const claims = await verifyToken(token, { secretKey: CLERK_SECRET_KEY })
    userId = claims.sub
  } catch (err) {
    console.warn('content/update: token verification failed', err)
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  // --- 2. Verify admin email (fetch from Clerk, not from client claims) ---
  let userEmail: string | undefined
  try {
    const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY })
    const user = await clerk.users.getUser(userId)
    userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()
    const verified =
      user.primaryEmailAddress?.verification?.status === 'verified'
    if (!userEmail || !verified || userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Not authorized' })
    }
  } catch (err) {
    console.error('content/update: clerk user fetch failed', err)
    return res.status(500).json({ error: 'Authorization check failed' })
  }

  // --- 3. Validate body ---
  const { path, content } = req.body ?? {}
  if (typeof path !== 'string' || !EDITABLE_PATHS.has(path)) {
    return res.status(400).json({ error: `Path not editable: ${path}` })
  }
  if (content === undefined || content === null) {
    return res.status(400).json({ error: 'Missing content' })
  }
  // We expect structured JSON content (array or object), not a raw string.
  // Serializing here ensures the committed file is pretty-printed identically
  // on every save and that malformed input fails early.
  let serialized: string
  try {
    serialized = JSON.stringify(content, null, 2) + '\n'
  } catch (err) {
    return res.status(400).json({ error: 'Content is not JSON-serializable' })
  }
  if (serialized.length > 500_000) {
    return res.status(413).json({ error: 'Content too large (>500KB)' })
  }

  // --- 4 & 5. Fetch SHA, commit to GitHub ---
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  let currentSha: string | undefined
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      ref: GITHUB_BRANCH,
    })
    // getContent returns either a file or array (for dirs). We want the file.
    if (Array.isArray(data) || data.type !== 'file') {
      return res
        .status(400)
        .json({ error: `Path is not a file: ${path}` })
    }
    currentSha = data.sha
  } catch (err: any) {
    // 404 is fine — means we're creating the file for the first time
    if (err?.status !== 404) {
      console.error('content/update: github getContent failed', err)
      return res
        .status(502)
        .json({ error: 'Could not read current file from GitHub' })
    }
  }

  try {
    const encoded = Buffer.from(serialized, 'utf8').toString('base64')
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      branch: GITHUB_BRANCH,
      message: `content: update ${path} via admin panel (${userEmail})`,
      content: encoded,
      sha: currentSha, // omitted when creating, included when updating
      committer: {
        name: 'edcromwell.com admin',
        email: userEmail!,
      },
      author: {
        name: 'Ed Cromwell',
        email: userEmail!,
      },
    })
    return res.status(200).json({
      ok: true,
      commitUrl: data.commit.html_url,
      commitSha: data.commit.sha,
    })
  } catch (err: any) {
    console.error('content/update: github commit failed', err)
    // 409 usually means SHA mismatch (someone else edited first)
    if (err?.status === 409) {
      return res.status(409).json({
        error: 'Content changed since you loaded it. Reload and try again.',
      })
    }
    return res.status(502).json({ error: 'GitHub commit failed' })
  }
}
