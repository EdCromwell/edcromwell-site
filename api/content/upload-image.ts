import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken, createClerkClient } from '@clerk/backend'
import { Octokit } from '@octokit/rest'

/**
 * POST /api/content/upload-image
 *
 * Uploads a binary image (sent as base64) to a known location in the repo via
 * the GitHub Contents API. Used by the Me admin panel to persist album covers
 * and gallery photos.
 *
 * Request body:
 *   {
 *     folder: 'covers' | 'galleries/<gallery-id>',
 *     filename: 'pink-pony-club.jpg',  // sanitized server-side
 *     dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...'
 *   }
 *
 * Response:
 *   { ok: true, url: '/me/covers/pink-pony-club.jpg', commitUrl: '...' }
 *
 * Same auth model as /api/content/update — Clerk JWT + admin email allowlist.
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').toLowerCase()
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? 'EdCromwell'
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'edcromwell-site'
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? 'main'

// Where uploads are allowed. Each entry maps a `folder` value the client may
// pass to a real repo path under public/. Anything not matching is rejected.
const FOLDER_RULES: Array<{ test: RegExp; toRepoPath: (folder: string) => string }> = [
  // covers
  { test: /^covers$/, toRepoPath: () => 'public/me/covers' },
  // galleries/<slug>  — slug must be lowercase letters, digits, dashes
  {
    test: /^galleries\/[a-z0-9][a-z0-9-]{0,40}$/,
    toRepoPath: f => `public/me/${f}`,
  },
]

const ALLOWED_MIME = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  // Video — gallery clips, rendered muted
  'video/mp4',
  'video/quicktime', // .mov from iPhone
  'video/webm',
])
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB — Vercel function body limit (~4.5MB request total)

function sanitizeFilename(name: string): string {
  // Strip any path traversal / weird chars. Keep letters, digits, dot, dash, underscore.
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'untitled'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!CLERK_SECRET_KEY || !ADMIN_EMAIL || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server is missing required configuration' })
  }

  // --- Auth ---
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }
  const token = authHeader.slice('Bearer '.length)
  let userId: string
  try {
    const claims = await verifyToken(token, { secretKey: CLERK_SECRET_KEY })
    userId = claims.sub
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  let userEmail: string | undefined
  try {
    const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY })
    const user = await clerk.users.getUser(userId)
    userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()
    const verified = user.primaryEmailAddress?.verification?.status === 'verified'
    if (!userEmail || !verified || userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Not authorized' })
    }
  } catch {
    return res.status(500).json({ error: 'Authorization check failed' })
  }

  // --- Body validation ---
  const { folder, filename, dataUrl } = req.body ?? {}
  if (typeof folder !== 'string' || typeof filename !== 'string' || typeof dataUrl !== 'string') {
    return res.status(400).json({ error: 'Missing folder, filename, or dataUrl' })
  }

  const rule = FOLDER_RULES.find(r => r.test.test(folder))
  if (!rule) {
    return res.status(400).json({ error: `Folder not allowed: ${folder}` })
  }

  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!m) {
    return res.status(400).json({ error: 'dataUrl is not a base64 data URL' })
  }
  const mime = m[1]
  const b64 = m[2]
  if (!ALLOWED_MIME.has(mime)) {
    return res.status(400).json({ error: `Unsupported MIME type: ${mime}` })
  }
  // Estimate decoded size (base64 inflates by ~4/3).
  const approxBytes = Math.floor((b64.length * 3) / 4)
  if (approxBytes > MAX_BYTES) {
    return res.status(413).json({ error: `Image too large (${approxBytes} bytes, max ${MAX_BYTES})` })
  }

  // Append a short timestamp suffix to guarantee uniqueness — without this,
  // two uploads with the same filename (e.g., "IMG_0001.jpg" twice) collide
  // at the same repo path: the second silently overwrites the first, making
  // it look like a photo got dropped from the gallery.
  const safeName = sanitizeFilename(filename)
  const stamp = Date.now().toString(36)
  const dotIdx = safeName.lastIndexOf('.')
  const uniqueName =
    dotIdx > 0
      ? `${safeName.slice(0, dotIdx)}-${stamp}${safeName.slice(dotIdx)}`
      : `${safeName}-${stamp}`
  const repoPath = `${rule.toRepoPath(folder)}/${uniqueName}`
  // Public URL: strip the leading "public/" — Vite serves public/ at the root.
  const publicUrl = '/' + repoPath.replace(/^public\//, '')

  // --- Commit ---
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  // Check if file already exists; if so, we need its sha to overwrite.
  let currentSha: string | undefined
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: repoPath,
      ref: GITHUB_BRANCH,
    })
    if (!Array.isArray(data) && data.type === 'file') currentSha = data.sha
  } catch (err: any) {
    if (err?.status !== 404) {
      console.error('upload-image: getContent failed', err)
      return res.status(502).json({ error: 'Could not check existing file on GitHub' })
    }
  }

  try {
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: repoPath,
      branch: GITHUB_BRANCH,
      message: `me: upload ${repoPath} via admin (${userEmail})`,
      content: b64,
      sha: currentSha,
      committer: { name: 'edcromwell.com admin', email: userEmail! },
      author: { name: 'Ed Cromwell', email: userEmail! },
    })
    return res.status(200).json({
      ok: true,
      url: publicUrl,
      commitUrl: data.commit.html_url,
      commitSha: data.commit.sha,
    })
  } catch (err: any) {
    console.error('upload-image: commit failed', err)
    if (err?.status === 409) {
      return res.status(409).json({ error: 'File changed since you started. Reload and try again.' })
    }
    return res.status(502).json({ error: 'GitHub commit failed' })
  }
}
