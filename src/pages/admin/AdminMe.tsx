/**
 * Me content editor.
 *
 * Loads the bundled `content/me.json` as starting state, lets the admin
 * add/edit/delete tracks and galleries (including uploading album covers and
 * gallery photos), and commits the new JSON via /api/content/update.
 *
 * Uploads go through /api/content/upload-image, which writes the binary to
 * public/me/covers/ or public/me/galleries/<slug>/ in the repo. After commit,
 * the public URL is stitched back into the JSON.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Music,
  Image as ImageIcon,
  BookOpen as BookIcon,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Pencil,
} from 'lucide-react'
import meContent from '../../../content/me.json'

// ─── Types ─────────────────────────────────────────────────────────────────
interface SoundtrackMeta {
  youtube_id: string
  title: string
  artist: string
  cover_url?: string
}
interface FeaturedTrack extends SoundtrackMeta {
  type?: 'track'
  caption?: string
}
interface FeaturedGallery {
  type: 'gallery'
  gallery_id: string
  caption?: string
}
type Featured = FeaturedTrack | FeaturedGallery
function isFeaturedGallery(f: Featured): f is FeaturedGallery {
  return (f as FeaturedGallery).type === 'gallery'
}
interface TrackPost {
  id: string
  type: 'track'
  youtube_id: string
  title: string
  artist: string
  cover_url?: string
  caption: string
  posted_at: string
}
interface GalleryPost {
  id: string
  type: 'gallery'
  title: string
  caption: string
  tags: string[]
  photos: string[]
  soundtrack: SoundtrackMeta
  posted_at: string
}
type Post = TrackPost | GalleryPost

interface AlbumPick {
  title: string
  artist: string
  cover_url?: string
  why?: string
  listen_url?: string
}
interface SongPick {
  youtube_id: string
  title: string
  artist: string
  cover_url?: string
  why?: string
}
interface YearPicks {
  year: number
  album?: AlbumPick
  song?: SongPick
}
interface Playlist {
  id: string
  title: string
  description?: string
  cover_url?: string
  tracks: SoundtrackMeta[]
}

interface Book {
  id: string
  title: string
  author: string
  cover_url?: string
  recommendation?: string
  link?: string
  category?: string
  posted_at?: string
}

interface MeContent {
  _meta?: { note?: string; updated?: string }
  featured: Featured
  about?: string
  year_picks?: YearPicks
  playlists?: Playlist[]
  books?: Book[]
  posts: Post[]
}

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; commitUrl: string }
  | { kind: 'error'; message: string }

// ─── Helpers ───────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10)

function nextPostId(posts: Post[]): string {
  let n = 1
  const used = new Set(posts.map(p => p.id))
  while (used.has(`p${String(n).padStart(3, '0')}`)) n++
  return `p${String(n).padStart(3, '0')}`
}

/** Extract a YouTube video ID from a full URL or accept a raw ID as-is. */
function extractYouTubeId(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const urlMatch =
    /[?&]v=([a-zA-Z0-9_-]{11})/.exec(trimmed) ||
    /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(trimmed) ||
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/.exec(trimmed)
  if (urlMatch) return urlMatch[1]
  // Already a raw ID?
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  return trimmed // pass through, let the player figure it out
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

/**
 * Compress an image file before upload. Resizes to max 2048px on the longest
 * side and re-encodes as JPEG at 0.85 quality. Most phone photos go from
 * 5–10MB down to 0.5–1.5MB without visible loss.
 *
 * Returns the original file unchanged if:
 *   - It's not an image (videos pass through)
 *   - It's already small (<1.5MB)
 *   - The browser can't decode it (HEIC on Chrome, etc.)
 */
async function maybeCompressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size < 1.5 * 1024 * 1024) return file
  // GIFs are animated — re-encoding would lose the animation.
  if (file.type === 'image/gif') return file

  try {
    const dataUrl = await fileToDataUrl(file)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('Could not decode image'))
      im.src = dataUrl
    })

    const MAX_DIM = 2048
    let { width, height } = img
    if (width > MAX_DIM || height > MAX_DIM) {
      const scale = MAX_DIM / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, width, height)

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.85,
      )
    })

    // Replace extension with .jpg since we're now JPEG-encoded.
    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    // Compression failed — fall back to the original. Server will reject if
    // it's too big, with a clear error message.
    return file
  }
}

/** True when this URL points to a video (we render <video> instead of <img>). */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm)$/i.test(url)
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function AdminMe() {
  const { getToken } = useAuth()

  const original = useMemo(
    () => structuredClone(meContent) as unknown as MeContent,
    [],
  )
  const [data, setData] = useState<MeContent>(
    () => structuredClone(meContent) as unknown as MeContent,
  )
  const [selectedId, setSelectedId] = useState<string | 'featured'>(
    data.posts[0]?.id ?? 'featured',
  )
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' })

  const dirty = useMemo(
    () => JSON.stringify(original) !== JSON.stringify(data),
    [original, data],
  )

  // Selected can be: 'featured' | 'year_picks' | 'playlist:<id>' | 'book:<id>' | <postId>
  const selectedKind: 'featured' | 'year_picks' | 'playlist' | 'book' | 'post' = (() => {
    if (selectedId === 'featured') return 'featured'
    if (selectedId === 'year_picks') return 'year_picks'
    if (typeof selectedId === 'string' && selectedId.startsWith('playlist:')) return 'playlist'
    if (typeof selectedId === 'string' && selectedId.startsWith('book:')) return 'book'
    return 'post'
  })()
  const selectedPlaylistId =
    selectedKind === 'playlist' ? (selectedId as string).slice('playlist:'.length) : null
  const selectedBookId =
    selectedKind === 'book' ? (selectedId as string).slice('book:'.length) : null
  const selected =
    selectedKind === 'post' ? data.posts.find(p => p.id === selectedId) ?? null : null
  const selectedPlaylist =
    selectedKind === 'playlist'
      ? (data.playlists ?? []).find(p => p.id === selectedPlaylistId) ?? null
      : null
  const selectedBook =
    selectedKind === 'book'
      ? (data.books ?? []).find(b => b.id === selectedBookId) ?? null
      : null

  // ─── CRUD ops ──────────────────────────────────────────────────────────
  // Replace the entire featured slot — used when switching between track and
  // gallery modes, since each has different fields.
  const replaceFeatured = (next: Featured) => {
    setData(d => ({ ...d, featured: next }))
    setStatus({ kind: 'idle' })
  }
  const updateFeatured = (next: Partial<FeaturedTrack> | Partial<FeaturedGallery>) => {
    setData(d => ({ ...d, featured: { ...d.featured, ...next } as Featured }))
    setStatus({ kind: 'idle' })
  }
  const updatePost = (id: string, next: Post) => {
    setData(d => ({ ...d, posts: d.posts.map(p => (p.id === id ? next : p)) }))
    setStatus({ kind: 'idle' })
  }
  /**
   * Functional update for a single post. Critical for async work that may
   * complete after the user has already done other edits — we always compute
   * the new post from the latest state, never from a stale snapshot.
   */
  const patchPost = (id: string, fn: (prev: Post) => Post) => {
    setData(d => ({
      ...d,
      posts: d.posts.map(p => (p.id === id ? fn(p) : p)),
    }))
    setStatus({ kind: 'idle' })
  }
  const updateAbout = (next: string) => {
    setData(d => ({ ...d, about: next }))
    setStatus({ kind: 'idle' })
  }

  // ─── Year picks ─────────────────────────────────────────────────────────
  const updateYearPicks = (fn: (prev: YearPicks) => YearPicks) => {
    setData(d => {
      const prev: YearPicks = d.year_picks ?? { year: new Date().getFullYear() }
      return { ...d, year_picks: fn(prev) }
    })
    setStatus({ kind: 'idle' })
  }

  // ─── Playlists ──────────────────────────────────────────────────────────
  const playlists = data.playlists ?? []
  const addPlaylist = () => {
    let n = 1
    const used = new Set(playlists.map(p => p.id))
    while (used.has(`pl${String(n).padStart(3, '0')}`)) n++
    const id = `pl${String(n).padStart(3, '0')}`
    const newPlaylist: Playlist = {
      id,
      title: 'New playlist',
      description: '',
      cover_url: '',
      tracks: [],
    }
    setData(d => ({ ...d, playlists: [newPlaylist, ...(d.playlists ?? [])] }))
    setSelectedId(`playlist:${id}`)
    setStatus({ kind: 'idle' })
  }
  const updatePlaylist = (id: string, fn: (prev: Playlist) => Playlist) => {
    setData(d => ({
      ...d,
      playlists: (d.playlists ?? []).map(p => (p.id === id ? fn(p) : p)),
    }))
    setStatus({ kind: 'idle' })
  }
  const deletePlaylist = (id: string) => {
    setData(d => ({ ...d, playlists: (d.playlists ?? []).filter(p => p.id !== id) }))
    setSelectedId(prev => (prev === `playlist:${id}` ? 'featured' : prev))
    setStatus({ kind: 'idle' })
  }

  // ─── Books ──────────────────────────────────────────────────────────────
  const books = data.books ?? []
  const addBook = () => {
    let n = 1
    const used = new Set(books.map(b => b.id))
    while (used.has(`b${String(n).padStart(3, '0')}`)) n++
    const id = `b${String(n).padStart(3, '0')}`
    const newBook: Book = {
      id,
      title: 'New book',
      author: '',
      cover_url: '',
      recommendation: '',
      link: '',
      category: '',
      posted_at: todayISO(),
    }
    setData(d => ({ ...d, books: [newBook, ...(d.books ?? [])] }))
    setSelectedId(`book:${id}`)
    setStatus({ kind: 'idle' })
  }
  const updateBook = (id: string, fn: (prev: Book) => Book) => {
    setData(d => ({
      ...d,
      books: (d.books ?? []).map(b => (b.id === id ? fn(b) : b)),
    }))
    setStatus({ kind: 'idle' })
  }
  const deleteBook = (id: string) => {
    setData(d => ({ ...d, books: (d.books ?? []).filter(b => b.id !== id) }))
    setSelectedId(prev => (prev === `book:${id}` ? 'featured' : prev))
    setStatus({ kind: 'idle' })
  }
  const moveBook = (id: string, dir: -1 | 1) => {
    setData(d => {
      const list = d.books ?? []
      const idx = list.findIndex(b => b.id === id)
      const swapIdx = idx + dir
      if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return d
      const next = [...list]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return { ...d, books: next }
    })
    setStatus({ kind: 'idle' })
  }
  const deletePost = (id: string) => {
    setData(d => ({ ...d, posts: d.posts.filter(p => p.id !== id) }))
    setSelectedId(prev => {
      if (prev === id) {
        const remaining = data.posts.filter(p => p.id !== id)
        return remaining[0]?.id ?? 'featured'
      }
      return prev
    })
    setStatus({ kind: 'idle' })
  }
  const addTrack = () => {
    const id = nextPostId(data.posts)
    const newPost: TrackPost = {
      id,
      type: 'track',
      youtube_id: '',
      title: 'New track',
      artist: '',
      cover_url: '',
      caption: '',
      posted_at: todayISO(),
    }
    setData(d => ({ ...d, posts: [newPost, ...d.posts] }))
    setSelectedId(id)
    setStatus({ kind: 'idle' })
  }
  const addGallery = () => {
    const id = nextPostId(data.posts)
    const newPost: GalleryPost = {
      id,
      type: 'gallery',
      title: 'New gallery',
      caption: '',
      tags: [],
      photos: [],
      soundtrack: { youtube_id: '', title: '', artist: '', cover_url: '' },
      posted_at: todayISO(),
    }
    setData(d => ({ ...d, posts: [newPost, ...d.posts] }))
    setSelectedId(id)
    setStatus({ kind: 'idle' })
  }

  // Reorder a post by swapping it with its neighbor.
  const movePost = (id: string, dir: -1 | 1) => {
    setData(d => {
      const idx = d.posts.findIndex(p => p.id === id)
      const swapIdx = idx + dir
      if (idx < 0 || swapIdx < 0 || swapIdx >= d.posts.length) return d
      const next = [...d.posts]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return { ...d, posts: next }
    })
    setStatus({ kind: 'idle' })
  }

  // Promote any post (track or gallery) to the featured slot.
  const promoteToFeatured = (post: Post) => {
    setData(d => {
      if (post.type === 'track') {
        const next: FeaturedTrack = {
          type: 'track',
          youtube_id: post.youtube_id,
          title: post.title,
          artist: post.artist,
          cover_url: post.cover_url,
          caption: post.caption || d.featured.caption || '',
        }
        return { ...d, featured: next }
      }
      // Gallery
      const next: FeaturedGallery = {
        type: 'gallery',
        gallery_id: post.id,
        caption: post.caption || d.featured.caption || '',
      }
      return { ...d, featured: next }
    })
    setStatus({ kind: 'idle' })
  }

  // ─── Media upload (images compressed client-side; videos passed through) ──
  const uploadImage = async (rawFile: File, folder: string): Promise<string> => {
    // Compress big phone photos before they hit the network. Videos and small
    // images pass through unchanged.
    const file = await maybeCompressImage(rawFile)

    // Hard cap so the user gets a clear error before we try to upload a
    // request the server will reject for being too big.
    const MAX_BYTES = 4 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1)
      throw new Error(
        `File is ${mb}MB after compression — limit is 4MB. ` +
          (file.type.startsWith('video/')
            ? 'Try a shorter clip or compress the video first.'
            : 'Try a different photo.'),
      )
    }

    const dataUrl = await fileToDataUrl(file)
    const token = await getToken()
    const res = await fetch('/api/content/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folder, filename: file.name, dataUrl }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Upload failed (${res.status})`)
    }
    const { url } = await res.json()
    return url as string
  }

  // ─── Save (commit JSON) ────────────────────────────────────────────────
  const save = async () => {
    setStatus({ kind: 'saving' })
    try {
      const token = await getToken()
      // Update the timestamp before committing.
      const payload = {
        ...data,
        _meta: { ...(data._meta ?? {}), updated: todayISO() },
      }
      const res = await fetch('/api/content/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path: 'content/me.json', content: payload }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Save failed (${res.status})`)
      }
      const { commitUrl } = await res.json()
      setStatus({ kind: 'saved', commitUrl })
    } catch (err: any) {
      setStatus({ kind: 'error', message: err.message || 'Save failed' })
    }
  }

  const reset = () => {
    setData(structuredClone(original))
    setStatus({ kind: 'idle' })
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="font-heading text-2xl tracking-widest uppercase text-cream">
            Me Editor
          </h1>
          <p className="font-body text-sm text-cream/50 mt-1">
            Add and edit tracks, galleries, and the featured share for me.edcromwell.com.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-3 py-2 rounded font-body text-sm text-cream/70 hover:text-cream hover:bg-warm/20"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || status.kind === 'saving'}
            className="flex items-center gap-2 px-4 py-2 rounded bg-gold text-bg font-heading text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
          >
            <Save size={14} />
            {status.kind === 'saving' ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Save status banner */}
      {status.kind === 'saved' && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded bg-green-50 border border-green-200 text-green-800">
          <CheckCircle2 size={16} />
          <span className="font-body text-sm">
            Saved & published. Vercel is rebuilding now —{' '}
            <a href={status.commitUrl} target="_blank" rel="noreferrer" className="underline">
              view commit
            </a>
            .
          </span>
        </div>
      )}
      {status.kind === 'error' && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded bg-red-50 border border-red-200 text-red-800">
          <AlertCircle size={16} />
          <span className="font-body text-sm">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: posts list */}
        <aside>
          <div className="flex gap-1 mb-3">
            <button
              onClick={addTrack}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-warm/30 hover:bg-warm/50 font-body text-xs text-cream"
            >
              <Plus size={12} /> Track
            </button>
            <button
              onClick={addGallery}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-warm/30 hover:bg-warm/50 font-body text-xs text-cream"
            >
              <Plus size={12} /> Gallery
            </button>
          </div>

          {/* Featured row — clickable to edit */}
          <button
            onClick={() => setSelectedId('featured')}
            className={`w-full text-left px-3 py-2.5 rounded mb-2 font-body text-sm border transition-colors group ${
              selectedId === 'featured'
                ? 'bg-gold text-bg border-gold'
                : 'bg-card border-border text-cream/80 hover:bg-warm/30 hover:border-gold/50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5 text-[0.62rem] tracking-widest uppercase opacity-70">
                <Star size={10} fill="currentColor" /> Featured · click to edit
              </div>
              <Pencil size={11} className="opacity-50 group-hover:opacity-100" />
            </div>
            {(() => {
              const f = data.featured
              if (isFeaturedGallery(f)) {
                const g = data.posts.find(
                  p => p.type === 'gallery' && p.id === f.gallery_id,
                ) as GalleryPost | undefined
                return (
                  <>
                    <div className="truncate font-medium">{g?.title ?? '(missing gallery)'}</div>
                    <div className="truncate text-xs opacity-60">Gallery · {g?.photos.length ?? 0} photos</div>
                  </>
                )
              }
              return (
                <>
                  <div className="truncate font-medium">{f.title || '(untitled)'}</div>
                  <div className="truncate text-xs opacity-60">{f.artist}</div>
                </>
              )
            })()}
          </button>

          {/* Year picks row */}
          <button
            onClick={() => setSelectedId('year_picks')}
            className={`w-full text-left px-3 py-2.5 rounded mb-2 font-body text-sm border transition-colors ${
              selectedId === 'year_picks'
                ? 'bg-gold text-bg border-gold'
                : 'bg-card border-border text-cream/80 hover:bg-warm/30 hover:border-gold/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[0.62rem] tracking-widest uppercase opacity-70 mb-0.5">
              <Star size={10} /> Year picks · click to edit
            </div>
            <div className="truncate font-medium">
              Album & Song of {data.year_picks?.year ?? new Date().getFullYear()}
            </div>
          </button>

          {/* Playlists section */}
          <div className="flex items-center justify-between mt-4 mb-1.5 px-1">
            <div className="text-[0.62rem] tracking-widest uppercase text-cream/40">Playlists</div>
            <button
              onClick={addPlaylist}
              className="text-[0.6rem] tracking-widest uppercase text-cream/60 hover:text-cream flex items-center gap-1"
            >
              <Plus size={10} /> New
            </button>
          </div>
          <div className="flex flex-col gap-1 mb-2">
            {playlists.length === 0 && (
              <div className="text-xs text-cream/40 px-1 py-1.5 italic">No playlists yet.</div>
            )}
            {playlists.map(pl => {
              const isSelected = selectedId === `playlist:${pl.id}`
              return (
                <button
                  key={pl.id}
                  onClick={() => setSelectedId(`playlist:${pl.id}`)}
                  className={`text-left px-3 py-2 rounded font-body text-sm flex items-center gap-2 ${
                    isSelected
                      ? 'bg-cream text-bg'
                      : 'text-cream/70 hover:text-cream hover:bg-warm/20'
                  }`}
                >
                  <Music size={12} className="shrink-0" />
                  <span className="truncate flex-1">{pl.title || '(untitled)'}</span>
                  <span className="text-[0.6rem] opacity-50 shrink-0">{pl.tracks.length}</span>
                </button>
              )
            })}
          </div>

          {/* Books section */}
          <div className="flex items-center justify-between mt-4 mb-1.5 px-1">
            <div className="text-[0.62rem] tracking-widest uppercase text-cream/40">Books</div>
            <button
              onClick={addBook}
              className="text-[0.6rem] tracking-widest uppercase text-cream/60 hover:text-cream flex items-center gap-1"
            >
              <Plus size={10} /> New
            </button>
          </div>
          <div className="flex flex-col gap-1 mb-2">
            {books.length === 0 && (
              <div className="text-xs text-cream/40 px-1 py-1.5 italic">No books yet.</div>
            )}
            {books.map((b, i) => {
              const isSelected = selectedId === `book:${b.id}`
              const isFirst = i === 0
              const isLast = i === books.length - 1
              return (
                <div
                  key={b.id}
                  className={`flex items-center rounded font-body text-sm group transition-colors ${
                    isSelected
                      ? 'bg-cream text-bg'
                      : 'text-cream/70 hover:text-cream hover:bg-warm/20'
                  }`}
                >
                  <button
                    onClick={() => setSelectedId(`book:${b.id}`)}
                    className="flex-1 min-w-0 text-left px-3 py-2 flex items-center gap-2"
                  >
                    <BookIcon size={12} className="shrink-0" />
                    <span className="truncate">{b.title || '(untitled)'}</span>
                  </button>
                  <div className="flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveBook(b.id, -1)}
                      disabled={isFirst}
                      aria-label="Move up"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-bg/30 disabled:opacity-25 disabled:hover:bg-transparent"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => moveBook(b.id, 1)}
                      disabled={isLast}
                      aria-label="Move down"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-bg/30 disabled:opacity-25 disabled:hover:bg-transparent"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-[0.62rem] tracking-widest uppercase text-cream/40 mt-4 mb-1.5 px-1">
            Posts · top of list shows first
          </div>
          <div className="flex flex-col gap-1">
            {data.posts.map((p, i) => {
              const isFirst = i === 0
              const isLast = i === data.posts.length - 1
              const isSelected = selectedId === p.id
              return (
                <div
                  key={p.id}
                  className={`flex items-center rounded font-body text-sm group transition-colors ${
                    isSelected
                      ? 'bg-cream text-bg'
                      : 'text-cream/70 hover:text-cream hover:bg-warm/20'
                  }`}
                >
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className="flex-1 min-w-0 text-left px-3 py-2 flex items-center gap-2"
                  >
                    {p.type === 'track' ? (
                      <Music size={12} className="shrink-0" />
                    ) : (
                      <ImageIcon size={12} className="shrink-0" />
                    )}
                    <span className="truncate">{p.title || '(untitled)'}</span>
                  </button>
                  <div className="flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => movePost(p.id, -1)}
                      disabled={isFirst}
                      aria-label="Move up"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-bg/30 disabled:opacity-25 disabled:hover:bg-transparent"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => movePost(p.id, 1)}
                      disabled={isLast}
                      aria-label="Move down"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-bg/30 disabled:opacity-25 disabled:hover:bg-transparent"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
            {data.posts.length === 0 && (
              <div className="text-xs text-cream/40 px-1 py-2">No posts yet. Click + Track or + Gallery above.</div>
            )}
          </div>
        </aside>

        {/* Main: editor */}
        <main>
          {selectedKind === 'featured' ? (
            <FeaturedEditor
              data={data.featured}
              galleries={data.posts.filter((p): p is GalleryPost => p.type === 'gallery')}
              onChange={updateFeatured}
              onReplace={replaceFeatured}
              uploadImage={uploadImage}
              about={data.about ?? ''}
              onAboutChange={updateAbout}
            />
          ) : selectedKind === 'year_picks' ? (
            <YearPicksEditor
              data={data.year_picks ?? { year: new Date().getFullYear() }}
              onChange={updateYearPicks}
              uploadImage={uploadImage}
            />
          ) : selectedKind === 'playlist' && selectedPlaylist ? (
            <PlaylistEditor
              key={selectedPlaylist.id}
              playlist={selectedPlaylist}
              onChange={fn => updatePlaylist(selectedPlaylist.id, fn)}
              onDelete={() => deletePlaylist(selectedPlaylist.id)}
              uploadImage={uploadImage}
            />
          ) : selectedKind === 'book' && selectedBook ? (
            <BookEditor
              key={selectedBook.id}
              book={selectedBook}
              onChange={fn => updateBook(selectedBook.id, fn)}
              onDelete={() => deleteBook(selectedBook.id)}
              uploadImage={uploadImage}
            />
          ) : selected ? (
            <PostEditor
              post={selected}
              onChange={(next) => updatePost(selected.id, next)}
              onPatch={(fn) => patchPost(selected.id, fn)}
              onDelete={() => deletePost(selected.id)}
              uploadImage={uploadImage}
              onPromoteToFeatured={() => promoteToFeatured(selected)}
            />
          ) : (
            <div className="text-cream/50 italic">Nothing selected.</div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Sub-editors ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-body text-[0.7rem] tracking-widest uppercase text-cream/60 mb-1.5">{label}</div>
      {children}
    </label>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded bg-card border border-border text-cream font-body text-sm focus:outline-none focus:border-gold"
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded bg-card border border-border text-cream font-body text-sm focus:outline-none focus:border-gold resize-y"
    />
  )
}

/**
 * Tags input — holds its own text state so the user can type commas, spaces,
 * or empty trailing tokens without the round-trip through the parsed array
 * stripping them. The parsed array is reported up via onChange after every
 * keystroke. Pass `key={post.id}` to remount when switching between posts.
 */
function TagsInput({ value, onChange, placeholder = 'tokyo, 35mm, golden hour' }: { value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(() => value.join(', '))
  const handleChange = (newText: string) => {
    setText(newText)
    onChange(newText.split(',').map(t => t.trim()).filter(Boolean))
  }
  return <TextInput value={text} onChange={handleChange} placeholder={placeholder} />
}

function YouTubeField({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value}
        onChange={e => onChange(extractYouTubeId(e.target.value))}
        placeholder="Paste YouTube URL or video ID"
        className="w-full px-3 py-2 rounded bg-card border border-border text-cream font-body text-sm focus:outline-none focus:border-gold"
      />
      {value && (
        <div className="text-[0.65rem] text-cream/50">
          Resolved ID: <code className="text-gold">{value}</code> ·{' '}
          <a
            href={`https://www.youtube.com/watch?v=${value}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-cream"
          >
            preview ↗
          </a>
        </div>
      )}
    </div>
  )
}

function ImageUploadField({
  url,
  onChange,
  folder,
  uploadImage,
}: {
  url: string | undefined
  onChange: (url: string) => void
  folder: string
  uploadImage: (file: File, folder: string) => Promise<string>
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      const newUrl = await uploadImage(file, folder)
      onChange(newUrl)
    } catch (ex: any) {
      setErr(ex.message || 'Upload failed')
    } finally {
      setBusy(false)
      // clear the input so the same file can be picked again
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded shrink-0 border border-border overflow-hidden"
          style={{
            background: url
              ? `url(${url}) center/cover`
              : 'linear-gradient(135deg,#3D5942,#A88646)',
          }}
        />
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-warm/40 hover:bg-warm/60 cursor-pointer font-body text-xs text-cream w-fit">
            <Upload size={12} />
            {busy ? 'Uploading…' : url ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/*" onChange={onPick} className="hidden" disabled={busy} />
          </label>
          {url && (
            <button
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-xs text-cream/50 hover:text-cream w-fit"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>
      {err && <div className="mt-2 text-xs text-red-700">{err}</div>}
    </div>
  )
}

// ─── Featured editor ───
function FeaturedEditor({
  data,
  galleries,
  onChange,
  onReplace,
  uploadImage,
  about,
  onAboutChange,
}: {
  data: Featured
  galleries: GalleryPost[]
  onChange: (next: Partial<FeaturedTrack> | Partial<FeaturedGallery>) => void
  onReplace: (next: Featured) => void
  uploadImage: (file: File, folder: string) => Promise<string>
  about: string
  onAboutChange: (next: string) => void
}) {
  const isGallery = isFeaturedGallery(data)

  // Switch the featured slot to a track. Preserves caption.
  const switchToTrack = () => {
    if (!isGallery) return
    const next: FeaturedTrack = {
      type: 'track',
      youtube_id: '',
      title: '',
      artist: '',
      cover_url: '',
      caption: data.caption ?? '',
    }
    onReplace(next)
  }
  const switchToGallery = () => {
    if (isGallery) return
    const firstGallery = galleries[0]
    const next: FeaturedGallery = {
      type: 'gallery',
      gallery_id: firstGallery?.id ?? '',
      caption: (data as FeaturedTrack).caption ?? '',
    }
    onReplace(next)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold">
        Featured · "Currently sharing"
      </div>

      {/* Type toggle */}
      <div className="inline-flex rounded-full border border-border overflow-hidden text-xs font-body">
        <button
          onClick={switchToTrack}
          className={`px-4 py-1.5 ${!isGallery ? 'bg-gold text-bg' : 'text-cream/70 hover:bg-warm/20'}`}
        >
          Track
        </button>
        <button
          onClick={switchToGallery}
          className={`px-4 py-1.5 ${isGallery ? 'bg-gold text-bg' : 'text-cream/70 hover:bg-warm/20'}`}
        >
          Gallery
        </button>
      </div>

      {isGallery ? (
        <>
          <Field label="Gallery">
            <select
              value={data.gallery_id}
              onChange={e => onChange({ gallery_id: e.target.value })}
              className="w-full px-3 py-2 rounded bg-card border border-border text-cream font-body text-sm focus:outline-none focus:border-gold"
            >
              {galleries.length === 0 ? (
                <option value="">(no galleries — create one first)</option>
              ) : (
                galleries.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.photos.length} {g.photos.length === 1 ? 'photo' : 'photos'})
                  </option>
                ))
              )}
            </select>
          </Field>
          <Field label="Caption (optional override — falls back to the gallery's own caption)">
            <TextArea
              value={data.caption ?? ''}
              onChange={v => onChange({ caption: v })}
              placeholder="why this one?"
              rows={2}
            />
          </Field>
          <div className="text-[0.7rem] text-cream/50 italic">
            The hero on the home page will use the gallery's first photo as its backdrop, and the
            paired soundtrack will load into the music player on page open.
          </div>
        </>
      ) : (
        <>
          <Field label="YouTube">
            <YouTubeField
              value={(data as FeaturedTrack).youtube_id}
              onChange={v => onChange({ youtube_id: v } as Partial<FeaturedTrack>)}
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={(data as FeaturedTrack).title}
              onChange={v => onChange({ title: v } as Partial<FeaturedTrack>)}
              placeholder="Pink Pony Club"
            />
          </Field>
          <Field label="Artist / subtitle">
            <TextInput
              value={(data as FeaturedTrack).artist}
              onChange={v => onChange({ artist: v } as Partial<FeaturedTrack>)}
              placeholder="Chappell Roan · single · 2020"
            />
          </Field>
          <Field label="Caption">
            <TextArea
              value={data.caption ?? ''}
              onChange={v => onChange({ caption: v })}
              placeholder="why this one?"
              rows={2}
            />
          </Field>
          <Field label="Album cover">
            <ImageUploadField
              url={(data as FeaturedTrack).cover_url}
              onChange={v => onChange({ cover_url: v } as Partial<FeaturedTrack>)}
              folder="covers"
              uploadImage={uploadImage}
            />
          </Field>
        </>
      )}

      {/* About page content — separate section, same form */}
      <div className="pt-6 mt-6 border-t border-border">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold mb-3">About page · me.edcromwell.com/about</div>
        <Field label="Body (use blank lines to separate paragraphs)">
          <TextArea
            value={about}
            onChange={onAboutChange}
            placeholder={"I'm Ed. Northern Virginia.\n\nI work in IT — sysadmin, automation..."}
            rows={10}
          />
        </Field>
      </div>
    </div>
  )
}

// ─── Post editor (track or gallery) ───
function PostEditor({
  post,
  onChange,
  onPatch,
  onDelete,
  uploadImage,
  onPromoteToFeatured,
}: {
  post: Post
  onChange: (next: Post) => void
  onPatch: (fn: (prev: Post) => Post) => void
  onDelete: () => void
  uploadImage: (file: File, folder: string) => Promise<string>
  onPromoteToFeatured?: () => void
}) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold flex items-center gap-2">
          {post.type === 'track' ? <Music size={12} /> : <ImageIcon size={12} />}
          {post.type === 'track' ? 'Track' : 'Gallery'} · {post.id}
        </div>
        <div className="flex items-center gap-2">
          {onPromoteToFeatured && (
            <button
              onClick={onPromoteToFeatured}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-cream/80 hover:bg-warm/30 hover:text-cream"
              title="Use this track as the Featured share"
            >
              <Star size={12} /> Set as featured
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-red-700 hover:bg-red-50"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Title">
          <TextInput value={post.title} onChange={v => onChange({ ...post, title: v })} />
        </Field>
        <Field label="Posted on">
          <TextInput value={post.posted_at} onChange={v => onChange({ ...post, posted_at: v })} placeholder="2026-04-27" />
        </Field>
      </div>

      {post.type === 'track' ? (
        <>
          <Field label="YouTube">
            <YouTubeField
              value={post.youtube_id}
              onChange={v => onChange({ ...post, youtube_id: v })}
            />
          </Field>
          <Field label="Artist">
            <TextInput value={post.artist} onChange={v => onChange({ ...post, artist: v })} />
          </Field>
          <Field label="Caption">
            <TextArea value={post.caption} onChange={v => onChange({ ...post, caption: v })} rows={2} />
          </Field>
          <Field label="Album cover">
            <ImageUploadField
              url={post.cover_url}
              onChange={v => onChange({ ...post, cover_url: v })}
              folder="covers"
              uploadImage={uploadImage}
            />
          </Field>
        </>
      ) : (
        <GalleryFields post={post} onChange={onChange} onPatch={onPatch} uploadImage={uploadImage} />
      )}
    </div>
  )
}

function GalleryFields({
  post,
  onChange,
  onPatch,
  uploadImage,
}: {
  post: GalleryPost
  onChange: (next: GalleryPost) => void
  onPatch: (fn: (prev: Post) => Post) => void
  uploadImage: (file: File, folder: string) => Promise<string>
}) {
  const galleryFolder = `galleries/${post.id}`

  // All photo-array mutations go through `onPatch` (functional update from the
  // freshest state), so there is no race between concurrent uploads and
  // reorder/remove clicks. The closure-captured `post` is only used to read
  // *display* values; never to compute the next photos array.
  const addPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''
    const uploads = await Promise.allSettled(files.map(f => uploadImage(f, galleryFolder)))
    const newUrls = uploads
      .filter((u): u is PromiseFulfilledResult<string> => u.status === 'fulfilled')
      .map(u => u.value)
    if (newUrls.length === 0) return
    onPatch(prev => {
      if (prev.type !== 'gallery') return prev
      return { ...prev, photos: [...prev.photos, ...newUrls] }
    })
  }

  const removePhoto = (i: number) => {
    onPatch(prev => {
      if (prev.type !== 'gallery') return prev
      return { ...prev, photos: prev.photos.filter((_, j) => j !== i) }
    })
  }

  const movePhoto = (i: number, dir: -1 | 1) => {
    onPatch(prev => {
      if (prev.type !== 'gallery') return prev
      const j = i + dir
      if (j < 0 || j >= prev.photos.length) return prev
      const next = [...prev.photos]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...prev, photos: next }
    })
  }

  return (
    <>
      <Field label="Caption">
        <TextArea value={post.caption} onChange={v => onChange({ ...post, caption: v })} rows={3} />
      </Field>
      <Field label="Tags (comma-separated)">
        <TagsInput
          key={post.id}
          value={post.tags}
          onChange={tags => onChange({ ...post, tags })}
        />
      </Field>

      <Field label="Photos & videos">
        <div className="space-y-2">
          {post.photos.length > 0 && (
            <>
              <div className="text-[0.6rem] tracking-widest uppercase text-cream/40 mb-1">
                Hover any photo to reorder or remove · drag is not supported, use the arrows
              </div>
              <div className="grid grid-cols-4 gap-2">
                {post.photos.map((url, i) => {
                  const isFirst = i === 0
                  const isLast = i === post.photos.length - 1
                  // Use the URL as the React key — uploads now have unique
                  // timestamped filenames server-side, so collisions are
                  // impossible. A stable key means React MOVES nodes on
                  // reorder instead of unmount/remount, no flicker.
                  return (
                    <div key={url} className="relative aspect-square rounded overflow-hidden border border-border group bg-black">
                      {isVideoUrl(url) ? (
                        <>
                          <video
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 z-[2] px-1.5 py-0.5 rounded bg-black/70 text-white text-[0.55rem] uppercase tracking-widest font-bold">
                            Video
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0" style={{ background: `url(${url}) center/cover` }} />
                      )}

                      {/* Position number — always visible so order is obvious */}
                      <div className="absolute top-1 left-1 z-[2] w-5 h-5 rounded-full bg-black/70 text-white text-[0.6rem] font-bold flex items-center justify-center">
                        {i + 1}
                      </div>

                      {/* Reorder + remove controls */}
                      <div className="absolute inset-0 z-[3] opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600"
                          aria-label="Remove media"
                        >
                          <X size={12} />
                        </button>
                        <button
                          onClick={() => movePhoto(i, -1)}
                          disabled={isFirst}
                          aria-label="Move left"
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black disabled:opacity-25 disabled:hover:bg-black/80"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() => movePhoto(i, 1)}
                          disabled={isLast}
                          aria-label="Move right"
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black disabled:opacity-25 disabled:hover:bg-black/80"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-warm/40 hover:bg-warm/60 cursor-pointer font-body text-xs text-cream w-fit">
            <Upload size={12} /> Upload photos / videos
            <input
              type="file"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              multiple
              onChange={addPhoto}
              className="hidden"
            />
          </label>
          <div className="text-[0.65rem] text-cream/50">
            Videos play muted on the live page. Keep clips under 4 MB — short loops work best.
          </div>
        </div>
      </Field>

      {/* Soundtrack subform */}
      <div className="pt-4 mt-4 border-t border-border">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold mb-3">Soundtrack — auto-plays when this gallery opens</div>
        <div className="space-y-4">
          <Field label="YouTube">
            <YouTubeField
              value={post.soundtrack.youtube_id}
              onChange={v => onChange({ ...post, soundtrack: { ...post.soundtrack, youtube_id: v } })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title">
              <TextInput
                value={post.soundtrack.title}
                onChange={v => onChange({ ...post, soundtrack: { ...post.soundtrack, title: v } })}
              />
            </Field>
            <Field label="Artist">
              <TextInput
                value={post.soundtrack.artist}
                onChange={v => onChange({ ...post, soundtrack: { ...post.soundtrack, artist: v } })}
              />
            </Field>
          </div>
          <Field label="Soundtrack cover (optional)">
            <ImageUploadField
              url={post.soundtrack.cover_url}
              onChange={v => onChange({ ...post, soundtrack: { ...post.soundtrack, cover_url: v } })}
              folder="covers"
              uploadImage={uploadImage}
            />
          </Field>
        </div>
      </div>
    </>
  )
}

// ─── Year picks editor (Album of the Year + Song of the Year) ──────────────
function YearPicksEditor({
  data,
  onChange,
  uploadImage,
}: {
  data: YearPicks
  onChange: (fn: (prev: YearPicks) => YearPicks) => void
  uploadImage: (file: File, folder: string) => Promise<string>
}) {
  const album: AlbumPick = data.album ?? { title: '', artist: '' }
  const song: SongPick = data.song ?? { youtube_id: '', title: '', artist: '' }

  const setAlbum = (next: Partial<AlbumPick>) =>
    onChange(prev => ({ ...prev, album: { ...(prev.album ?? { title: '', artist: '' }), ...next } }))
  const setSong = (next: Partial<SongPick>) =>
    onChange(prev => ({ ...prev, song: { ...(prev.song ?? { youtube_id: '', title: '', artist: '' }), ...next } }))

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold mb-2">Year picks</div>
        <Field label="Year">
          <TextInput
            value={String(data.year)}
            onChange={v => onChange(prev => ({ ...prev, year: parseInt(v, 10) || prev.year }))}
            placeholder="2026"
          />
        </Field>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold mb-3">Album of the year</div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Album title">
              <TextInput value={album.title} onChange={v => setAlbum({ title: v })} placeholder="Some Rap Songs" />
            </Field>
            <Field label="Artist">
              <TextInput value={album.artist} onChange={v => setAlbum({ artist: v })} placeholder="Earl Sweatshirt" />
            </Field>
          </div>
          <Field label="Why (one or two sentences)">
            <TextArea value={album.why ?? ''} onChange={v => setAlbum({ why: v })} rows={2} placeholder="why this album?" />
          </Field>
          <Field label="Listen link (optional — Spotify, Apple Music, Bandcamp, etc.)">
            <TextInput value={album.listen_url ?? ''} onChange={v => setAlbum({ listen_url: v })} placeholder="https://open.spotify.com/album/..." />
          </Field>
          <Field label="Album cover">
            <ImageUploadField url={album.cover_url} onChange={v => setAlbum({ cover_url: v })} folder="covers" uploadImage={uploadImage} />
          </Field>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold mb-3">Song of the year</div>
        <div className="space-y-4">
          <Field label="YouTube">
            <YouTubeField value={song.youtube_id} onChange={v => setSong({ youtube_id: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title">
              <TextInput value={song.title} onChange={v => setSong({ title: v })} />
            </Field>
            <Field label="Artist">
              <TextInput value={song.artist} onChange={v => setSong({ artist: v })} />
            </Field>
          </div>
          <Field label="Why (one or two sentences)">
            <TextArea value={song.why ?? ''} onChange={v => setSong({ why: v })} rows={2} placeholder="why this song?" />
          </Field>
          <Field label="Cover image (optional — uses YouTube thumbnail if blank)">
            <ImageUploadField url={song.cover_url} onChange={v => setSong({ cover_url: v })} folder="covers" uploadImage={uploadImage} />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Playlist editor ────────────────────────────────────────────────────────
function PlaylistEditor({
  playlist,
  onChange,
  onDelete,
  uploadImage,
}: {
  playlist: Playlist
  onChange: (fn: (prev: Playlist) => Playlist) => void
  onDelete: () => void
  uploadImage: (file: File, folder: string) => Promise<string>
}) {
  const set = (patch: Partial<Playlist>) => onChange(prev => ({ ...prev, ...patch }))

  const addTrack = () =>
    onChange(prev => ({
      ...prev,
      tracks: [...prev.tracks, { youtube_id: '', title: '', artist: '', cover_url: '' }],
    }))
  const updateTrack = (i: number, next: Partial<SoundtrackMeta>) =>
    onChange(prev => ({
      ...prev,
      tracks: prev.tracks.map((t, j) => (j === i ? { ...t, ...next } : t)),
    }))
  const removeTrack = (i: number) =>
    onChange(prev => ({ ...prev, tracks: prev.tracks.filter((_, j) => j !== i) }))
  const moveTrack = (i: number, dir: -1 | 1) =>
    onChange(prev => {
      const j = i + dir
      if (j < 0 || j >= prev.tracks.length) return prev
      const next = [...prev.tracks]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...prev, tracks: next }
    })

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold flex items-center gap-2">
          <Music size={12} /> Playlist · {playlist.id}
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-red-700 hover:bg-red-50"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      <Field label="Title">
        <TextInput value={playlist.title} onChange={v => set({ title: v })} placeholder="Late night drive" />
      </Field>
      <Field label="Description">
        <TextArea value={playlist.description ?? ''} onChange={v => set({ description: v })} rows={2} placeholder="for the long drives." />
      </Field>
      <Field label="Cover image (optional)">
        <ImageUploadField url={playlist.cover_url} onChange={v => set({ cover_url: v })} folder="covers" uploadImage={uploadImage} />
      </Field>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold">
            Tracks · {playlist.tracks.length}
          </div>
          <button
            onClick={addTrack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-warm/40 hover:bg-warm/60 font-body text-xs text-cream"
          >
            <Plus size={12} /> Add track
          </button>
        </div>
        {playlist.tracks.length === 0 ? (
          <div className="text-cream/40 italic text-sm py-3">No tracks yet — click "Add track" above.</div>
        ) : (
          <div className="space-y-3">
            {playlist.tracks.map((t, i) => {
              const isFirst = i === 0
              const isLast = i === playlist.tracks.length - 1
              return (
                <div key={i} className="rounded border border-border bg-card/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[0.6rem] tracking-widest uppercase text-cream/60 font-semibold">
                      Track {i + 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveTrack(i, -1)}
                        disabled={isFirst}
                        aria-label="Move up"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-warm/30 disabled:opacity-25"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveTrack(i, 1)}
                        disabled={isLast}
                        aria-label="Move down"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-warm/30 disabled:opacity-25"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={() => removeTrack(i)}
                        aria-label="Remove track"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <Field label="YouTube">
                    <YouTubeField value={t.youtube_id} onChange={v => updateTrack(i, { youtube_id: v })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Title">
                      <TextInput value={t.title} onChange={v => updateTrack(i, { title: v })} />
                    </Field>
                    <Field label="Artist">
                      <TextInput value={t.artist} onChange={v => updateTrack(i, { artist: v })} />
                    </Field>
                  </div>
                  <Field label="Cover image (optional)">
                    <ImageUploadField
                      url={t.cover_url}
                      onChange={v => updateTrack(i, { cover_url: v })}
                      folder="covers"
                      uploadImage={uploadImage}
                    />
                  </Field>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Book editor ────────────────────────────────────────────────────────────
function BookEditor({
  book,
  onChange,
  onDelete,
  uploadImage,
}: {
  book: Book
  onChange: (fn: (prev: Book) => Book) => void
  onDelete: () => void
  uploadImage: (file: File, folder: string) => Promise<string>
}) {
  const set = (patch: Partial<Book>) => onChange(prev => ({ ...prev, ...patch }))
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="text-[0.62rem] tracking-widest uppercase text-gold font-semibold flex items-center gap-2">
          <BookIcon size={12} /> Book · {book.id}
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-red-700 hover:bg-red-50"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      <Field label="Title">
        <TextInput value={book.title} onChange={v => set({ title: v })} placeholder="Some Rap Songs" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Author">
          <TextInput value={book.author} onChange={v => set({ author: v })} placeholder="Earl Sweatshirt" />
        </Field>
        <Field label="Posted on">
          <TextInput value={book.posted_at ?? ''} onChange={v => set({ posted_at: v })} placeholder="2026-04-28" />
        </Field>
      </div>
      <Field label="Category (optional — fiction, essays, tech, etc.)">
        <TextInput value={book.category ?? ''} onChange={v => set({ category: v })} placeholder="essays" />
      </Field>
      <Field label="Recommendation / why">
        <TextArea
          value={book.recommendation ?? ''}
          onChange={v => set({ recommendation: v })}
          rows={4}
          placeholder="A short take — what you got out of it, who it's for, why it stuck."
        />
      </Field>
      <Field label="Get-the-book link (Bookshop, Amazon, library, etc.)">
        <TextInput
          value={book.link ?? ''}
          onChange={v => set({ link: v })}
          placeholder="https://bookshop.org/..."
        />
      </Field>
      <Field label="Cover">
        <ImageUploadField
          url={book.cover_url}
          onChange={v => set({ cover_url: v })}
          folder="covers"
          uploadImage={uploadImage}
        />
      </Field>
    </div>
  )
}
