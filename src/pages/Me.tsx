/**
 * me.edcromwell.com — curation hub.
 *
 * Standalone page (no shared nav/footer with the main site). Routed inside
 * via wouter:
 *   /             → All / home (hero + recent grid + forest band)
 *   /tracks       → Tracks-only grid
 *   /galleries    → Galleries-only grid
 *   /about        → Static about page
 *
 * Music playback is wired through <MusicProvider> using the YouTube IFrame
 * Player API (full songs, no auth).
 */

import { useEffect, useState } from 'react'
import { Link, Route, Switch, useLocation } from 'wouter'
import meContent from '../../content/me.json'
import { MusicProvider, useMusic, TrackMeta } from '@/components/me/MusicContext'
import MePlayer from '@/components/me/MePlayer'
import MeCard, { Post } from '@/components/me/MeCard'
import MeGalleryModal, { GalleryPost } from '@/components/me/MeGalleryModal'

// ──────────────────────────────────────────────────────────────────────────
// Brand mark — gothic cross used as the EC monogram's accent. Drawn as inline
// SVG so it inherits text color and scales cleanly at any nav size.
// ──────────────────────────────────────────────────────────────────────────
function GothicCross({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 40"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="
        M 14 0
        L 16 4
        L 16 12
        L 24 12
        L 28 14
        L 24 16
        L 16 16
        L 16 36
        L 14 40
        L 12 36
        L 12 16
        L 4 16
        L 0 14
        L 4 12
        L 12 12
        L 12 4
        Z
      " />
    </svg>
  )
}

const FOREST_BACKDROP =
  "url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=2000&q=80')"
const HERO_FOREST =
  "url('https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1400&q=80')"
const MOUNTAIN_BACKDROP =
  "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80')"

// Featured can be either a track (Spotify-style "currently sharing") or a
// gallery (a featured photo set). Discriminated by `type`. The legacy shape
// (no `type` field, just track metadata) still parses as a track.
interface FeaturedTrack extends TrackMeta {
  type?: 'track'
  caption?: string
}
interface FeaturedGallery {
  type: 'gallery'
  /** ID of an existing gallery post in `posts` */
  gallery_id: string
  /** Optional caption override; falls back to the gallery's own caption. */
  caption?: string
}
type Featured = FeaturedTrack | FeaturedGallery
function isFeaturedGallery(f: Featured): f is FeaturedGallery {
  return (f as FeaturedGallery).type === 'gallery'
}

interface AlbumPick {
  title: string
  artist: string
  cover_url?: string
  why?: string
  /** External link (Spotify/Apple Music/Bandcamp) where visitors can listen */
  listen_url?: string
}

interface SongPick extends TrackMeta {
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
  tracks: TrackMeta[]
}

interface Book {
  id: string
  title: string
  author: string
  cover_url?: string
  /** A short take — why I'm recommending this book. */
  recommendation?: string
  /** Optional outbound link (Bookshop, Amazon, Goodreads, library, etc.) */
  link?: string
  /** Optional category tag like "fiction", "essays", "tech". Lowercase. */
  category?: string
  posted_at?: string
}

interface MeContent {
  featured: Featured
  about?: string
  year_picks?: YearPicks
  playlists?: Playlist[]
  books?: Book[]
  posts: Post[]
}

const content = meContent as unknown as MeContent

// ──────────────────────────────────────────────────────────────────────────
// Top nav — wouter Link components for proper SPA navigation
// ──────────────────────────────────────────────────────────────────────────
function Nav() {
  const [location] = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = (p: string) => (p === '/' ? location === '/' : location.startsWith(p))

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  const linkClass = (p: string) =>
    `transition-colors cursor-pointer ${
      isActive(p) ? 'text-me-text' : 'text-me-dim hover:text-me-text'
    }`

  return (
    <>
      <div className="flex items-center justify-between py-5 border-b border-[rgba(180,160,120,0.10)]">
        <Link href="/">
          <span className="inline-flex items-center gap-3 sm:gap-4 cursor-pointer leading-none select-none">
            <span className="font-heading font-black tracking-tight text-3xl sm:text-4xl uppercase text-me-text">
              EC
            </span>
            <GothicCross className="w-5 h-7 sm:w-6 sm:h-9 text-me-gold" />
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex gap-6 text-[0.74rem] tracking-[0.18em] uppercase font-medium">
          <Link href="/" className={linkClass('/')}>All</Link>
          <Link href="/tracks" className={linkClass('/tracks')}>Tracks</Link>
          <Link href="/galleries" className={linkClass('/galleries')}>Galleries</Link>
          <Link href="/books" className={linkClass('/books')}>Books</Link>
          <Link href="/about" className={linkClass('/about')}>About</Link>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live indicator — hide the text on mobile, keep just the dot */}
          <div className="flex items-center gap-1.5 text-[0.7rem] tracking-[0.18em] uppercase text-me-gold border border-me-gold/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-me-gold shadow-[0_0_6px_#A88646] animate-pulse" />
            <span className="hidden xs:inline sm:inline">Live</span>
          </div>

          {/* Mobile-only hamburger button */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="sm:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/5 text-me-text"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer — fullscreen overlay with big touch targets */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[200] bg-me-bg/97 backdrop-blur-md sm:hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <span className="inline-flex items-center gap-3 leading-none">
              <span className="font-heading font-black tracking-tight text-3xl uppercase text-me-text">EC</span>
              <GothicCross className="w-5 h-7 text-me-gold" />
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/5 text-me-text"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 flex flex-col items-stretch justify-center px-8 gap-1 -mt-8">
            {(
              [
                { href: '/', label: 'All' },
                { href: '/tracks', label: 'Tracks' },
                { href: '/galleries', label: 'Galleries' },
                { href: '/books', label: 'Books' },
                { href: '/about', label: 'About' },
              ] as const
            ).map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-3 font-me-body font-black text-4xl uppercase tracking-tight transition-colors ${
                    active ? 'text-me-gold' : 'text-me-text hover:text-me-gold'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-8 pb-8 text-[0.65rem] tracking-[0.28em] uppercase text-me-dim flex justify-between">
            <span>Ed Cromwell</span>
            <a href="https://edcromwell.com" className="hover:text-me-gold">edcromwell.com →</a>
          </div>
        </div>
      )}
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Hero — featured share with photo backdrop + side thumbnails
// ──────────────────────────────────────────────────────────────────────────
function Hero({ onOpenGallery }: { onOpenGallery: (g: GalleryPost) => void }) {
  const { playTrack } = useMusic()
  const featured = content.featured
  const isGallery = isFeaturedGallery(featured)

  // Resolve the gallery if featured is a gallery type.
  const featuredGallery = isGallery
    ? (content.posts.find(
        p => p.type === 'gallery' && p.id === featured.gallery_id,
      ) as GalleryPost | undefined)
    : undefined

  // Decide what to display in the big card.
  const heroTitle = isGallery ? featuredGallery?.title ?? 'Featured gallery' : featured.title
  const heroSubtitle = isGallery
    ? `Gallery · ${featuredGallery?.photos.length ?? 0} frames`
    : (featured as FeaturedTrack).artist
  const heroCaption =
    featured.caption ?? (isGallery ? featuredGallery?.caption : undefined)
  // Hero backdrop: first photo of gallery if available, otherwise the default forest.
  const heroBackdropImage =
    isGallery && featuredGallery?.photos[0]
      ? `url(${featuredGallery.photos[0]})`
      : HERO_FOREST

  const sideGallery = content.posts.find(
    (p): p is GalleryPost => p.type === 'gallery' && (!isGallery || p.id !== featured.gallery_id),
  )
  const sideTrack = content.posts.find(p => p.type === 'track')

  const onHeroAction = () => {
    if (isGallery) {
      if (featuredGallery) onOpenGallery(featuredGallery)
    } else {
      playTrack(featured as FeaturedTrack)
    }
  }

  return (
    <div className="pt-8 pb-9 grid gap-4 md:grid-cols-[1fr_280px]">
      <div
        className="relative rounded-[14px] overflow-hidden p-7 flex flex-col justify-between aspect-[16/11]"
        style={{
          backgroundImage: `linear-gradient(135deg,rgba(11,15,12,.55),rgba(31,46,34,.6) 60%,rgba(90,122,79,.65)), ${heroBackdropImage}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 75% 25%,rgba(168,134,70,.18),transparent 55%)' }} />

        <div className="relative z-10 flex justify-between items-start text-[0.7rem] tracking-[0.2em] uppercase text-[#E8DDC9]/80">
          <span>Currently sharing</span>
          <span className="inline-flex items-center gap-1.5 bg-black/45 backdrop-blur px-2.5 py-1 rounded-full text-white border border-me-gold/25">
            <span className="w-1.5 h-1.5 rounded-full bg-me-gold shadow-[0_0_4px_#A88646] animate-pulse" />
            {isGallery ? 'Gallery' : 'Featured'}
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="font-me-body font-black text-[clamp(2.4rem,5.2vw,3rem)] leading-[0.95] tracking-tight uppercase text-white m-0 mb-1.5" style={{ textShadow: '0 2px 24px rgba(0,0,0,.5)' }}>
            {heroTitle}
          </h1>
          <p className="text-[0.92rem] tracking-wide text-[#E8DDC9]/85 m-0 font-medium">
            {heroSubtitle}
          </p>
        </div>

        <div className="relative z-10 flex justify-between items-end gap-3.5 flex-wrap">
          {heroCaption && (
            <span className="italic text-[0.82rem] text-[#E8DDC9]/85 font-light max-w-md">
              "{heroCaption}"
            </span>
          )}
          <button
            onClick={onHeroAction}
            className="bg-me-text text-me-bg px-4 py-2 rounded-full text-[0.72rem] tracking-[0.18em] uppercase font-semibold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            {isGallery ? (
              <>
                Open
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </>
            ) : (
              <>
                Play
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-rows-2 gap-4">
        {sideGallery && (
          <button
            onClick={() => onOpenGallery(sideGallery)}
            className="relative rounded-xl overflow-hidden border border-[rgba(180,160,120,0.10)] hover:border-[rgba(180,160,120,0.20)] transition-all group min-h-[140px]"
            style={{
              background: sideGallery.photos[0]
                ? `url(${sideGallery.photos[0]}) center/cover`
                : 'linear-gradient(135deg,#1A2620,#3D5942 70%,#6F8A5C)',
            }}
          >
            <span className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1.5 text-[0.62rem] tracking-[0.2em] uppercase text-me-text bg-me-bg/60 backdrop-blur px-2 py-1 rounded-full border border-[rgba(180,160,120,0.10)]">
              <span className="w-[5px] h-[5px] rounded-full bg-me-gold" />
              Gallery · {sideGallery.title}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        {sideTrack && sideTrack.type === 'track' && (
          <button
            onClick={() =>
              playTrack({
                youtube_id: sideTrack.youtube_id,
                title: sideTrack.title,
                artist: sideTrack.artist,
                cover_url: sideTrack.cover_url,
              })
            }
            className="relative rounded-xl overflow-hidden border border-[rgba(180,160,120,0.10)] hover:border-[rgba(180,160,120,0.20)] transition-all group min-h-[140px]"
            style={{
              background: sideTrack.cover_url
                ? `url(${sideTrack.cover_url}) center/cover`
                : 'linear-gradient(155deg,#2A1E14,#5C4530 70%,#8B6F4D)',
            }}
          >
            <span className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1.5 text-[0.62rem] tracking-[0.2em] uppercase text-me-text bg-me-bg/60 backdrop-blur px-2 py-1 rounded-full border border-[rgba(180,160,120,0.10)]">
              <span className="w-[5px] h-[5px] rounded-full bg-me-gold" />
              Track · {sideTrack.title}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Now-playing strip (used on home view only)
// ──────────────────────────────────────────────────────────────────────────
function NowPlayingStrip() {
  const { current, isPlaying, position, duration, togglePlay } = useMusic()
  const progress = duration ? Math.min(100, (position / duration) * 100) : 0

  return (
    <div className="flex items-center justify-between pt-4 px-1 border-t border-[rgba(180,160,120,0.10)] mt-4 flex-wrap gap-3">
      <div className="flex items-center gap-3.5">
        <button
          onClick={togglePlay}
          className="w-[42px] h-[42px] rounded-full bg-me-gold flex items-center justify-center text-me-bg hover:scale-105 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20" />
            </svg>
          )}
        </button>
        <div>
          <div className="text-[0.7rem] tracking-[0.2em] uppercase text-me-dim">Now playing</div>
          <div className="font-bold text-[0.95rem] tracking-tight text-me-text mt-0.5">
            {current?.title || 'Press play to start'}
            {current && <span className="text-me-dim font-normal"> · {current.artist}</span>}
          </div>
        </div>
      </div>
      <div className="flex-1 max-w-[380px] min-w-[120px] h-[3px] bg-[rgba(232,221,201,0.08)] rounded-sm overflow-hidden">
        <div className="h-full bg-me-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Year picks — Album & Song of the year
// ──────────────────────────────────────────────────────────────────────────
function YearPicksSection() {
  const { playTrack } = useMusic()
  const picks = content.year_picks
  if (!picks) return null

  const album = picks.album
  const song = picks.song
  const albumFilled = !!(album && (album.title || album.artist))
  const songFilled = !!(song && song.youtube_id && song.title)
  if (!albumFilled && !songFilled) return null

  return (
    <section className="pt-14 pb-2">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-[0.62rem] tracking-[0.32em] uppercase text-me-gold font-semibold">
          Ed's picks · {picks.year}
        </div>
        <div className="flex-1 h-px bg-me-gold/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Album of the year */}
        {albumFilled && album && (
          <div className="relative rounded-2xl overflow-hidden border border-me-gold/20 bg-me-bg-2/70 backdrop-blur p-5 sm:p-6 flex gap-5 group">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg flex-shrink-0 shadow-2xl"
              style={{
                background: album.cover_url
                  ? `url(${album.cover_url}) center/cover`
                  : 'linear-gradient(135deg,#3D5942,#A88646)',
              }}
            />
            <div className="flex flex-col min-w-0">
              <div className="text-[0.6rem] tracking-[0.25em] uppercase text-me-gold font-bold mb-1">
                Album of the year
              </div>
              <h3 className="font-me-body font-black text-2xl sm:text-3xl leading-tight tracking-tight text-me-text">
                {album.title || 'Untitled'}
              </h3>
              <div className="text-[0.85rem] text-me-dim mt-0.5">{album.artist}</div>
              {album.why && (
                <p className="text-[0.85rem] text-me-text/80 italic mt-3 leading-relaxed">
                  "{album.why}"
                </p>
              )}
              {album.listen_url && (
                <a
                  href={album.listen_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[0.7rem] tracking-[0.16em] uppercase text-me-gold hover:text-me-text font-semibold w-fit"
                >
                  Listen ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Song of the year */}
        {songFilled && song && (
          <button
            onClick={() => playTrack(song)}
            className="relative rounded-2xl overflow-hidden border border-me-gold/20 bg-me-bg-2/70 backdrop-blur p-5 sm:p-6 flex gap-5 text-left group hover:border-me-gold/40 transition-colors"
          >
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg flex-shrink-0 shadow-2xl relative"
              style={{
                background: song.cover_url
                  ? `url(${song.cover_url}) center/cover`
                  : 'linear-gradient(135deg,#2A1E14,#A88646)',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-me-gold flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                    <polygon points="6 4 20 12 6 20" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-[0.6rem] tracking-[0.25em] uppercase text-me-gold font-bold mb-1">
                Song of the year
              </div>
              <h3 className="font-me-body font-black text-2xl sm:text-3xl leading-tight tracking-tight text-me-text">
                {song.title}
              </h3>
              <div className="text-[0.85rem] text-me-dim mt-0.5">{song.artist}</div>
              {song.why && (
                <p className="text-[0.85rem] text-me-text/80 italic mt-3 leading-relaxed">
                  "{song.why}"
                </p>
              )}
              <div className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[0.7rem] tracking-[0.16em] uppercase text-me-gold font-semibold">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20" />
                </svg>
                Play
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Playlists — clickable cards that start the queue when clicked
// ──────────────────────────────────────────────────────────────────────────
function PlaylistsSection() {
  const { playPlaylist, playlist: activePlaylist, isPlaying } = useMusic()
  const playlists = content.playlists ?? []
  if (playlists.length === 0) return null

  return (
    <section className="pt-12 pb-2">
      <div className="flex items-baseline justify-between gap-3 mb-5 flex-wrap">
        <h2 className="font-me-body font-black text-[1.95rem] leading-none tracking-tight uppercase m-0">
          Playlists
        </h2>
        <span className="text-[0.65rem] tracking-[0.22em] uppercase text-me-dim">
          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map(pl => {
          const isThisPlaying =
            isPlaying &&
            activePlaylist.length === pl.tracks.length &&
            activePlaylist.every((t, i) => t.youtube_id === pl.tracks[i]?.youtube_id)
          return (
            <div
              key={pl.id}
              className="relative bg-me-bg-2 border border-[rgba(180,160,120,0.10)] rounded-xl overflow-hidden flex gap-4 p-3.5 hover:border-me-gold/40 hover:bg-me-moss transition-all group"
            >
              {/* Cover doubles as quick-play button — click here to start without
                  navigating to the detail view. */}
              <button
                onClick={e => {
                  e.preventDefault()
                  if (pl.tracks.length > 0) playPlaylist(pl.tracks, 0)
                }}
                aria-label={`Play ${pl.title}`}
                className="w-24 h-24 rounded-lg flex-shrink-0 shadow-xl relative cursor-pointer"
                style={{
                  background: pl.cover_url
                    ? `url(${pl.cover_url}) center/cover`
                    : 'linear-gradient(135deg,#1F2E22,#2A1E14 70%,#A88646)',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-me-gold flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">
                    {isThisPlaying ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="black">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="black">
                        <polygon points="6 4 20 12 6 20" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>

              {/* The text body navigates to the detail view */}
              <Link href={`/playlists/${pl.id}`} className="flex-1 min-w-0 flex flex-col cursor-pointer">
                <div className="text-[0.6rem] tracking-[0.22em] uppercase text-me-gold font-semibold mb-0.5">
                  Playlist
                </div>
                <h4 className="font-me-body font-bold text-[1.05rem] tracking-tight text-me-text leading-tight">
                  {pl.title}
                </h4>
                {pl.description && (
                  <p className="text-[0.78rem] text-me-dim leading-relaxed mt-1 line-clamp-2">
                    {pl.description}
                  </p>
                )}
                <div className="mt-auto pt-2 text-[0.7rem] text-me-dim">
                  {pl.tracks.length} track{pl.tracks.length === 1 ? '' : 's'}
                  {isThisPlaying && (
                    <span className="ml-2 text-me-gold">· playing now</span>
                  )}
                  <span className="ml-2 text-me-text/40 group-hover:text-me-gold">→</span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Books — recommendation cards. Cover at top (portrait 2:3), title +
// author + take below, optional outbound "Get the book" link.
// ──────────────────────────────────────────────────────────────────────────
function BookCard({ book }: { book: Book }) {
  const cover = book.cover_url
    ? `url(${book.cover_url}) center/cover`
    : 'linear-gradient(135deg,#2A1E14,#5C4530 70%,#8B6F4D)'
  return (
    <div className="group bg-me-bg-2 border border-[rgba(180,160,120,0.10)] rounded-xl overflow-hidden p-3.5 flex flex-col hover:border-me-gold/40 hover:bg-me-moss/40 transition-colors">
      <div
        className="aspect-[2/3] rounded-md mb-3 shadow-2xl"
        style={{ background: cover }}
      />
      {book.category && (
        <div className="text-[0.6rem] tracking-[0.22em] uppercase text-me-gold font-semibold mb-1">
          {book.category}
        </div>
      )}
      <h4 className="font-me-body font-bold text-[1rem] tracking-tight text-me-text leading-tight">
        {book.title}
      </h4>
      <div className="text-[0.78rem] text-me-dim mt-0.5">{book.author}</div>
      {book.recommendation && (
        <p className="text-[0.82rem] text-me-text/85 italic leading-relaxed mt-2.5 line-clamp-4">
          "{book.recommendation}"
        </p>
      )}
      {book.link && (
        <a
          href={book.link}
          target="_blank"
          rel="noreferrer"
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[0.7rem] tracking-[0.16em] uppercase text-me-gold hover:text-me-text font-semibold w-fit"
        >
          Get the book ↗
        </a>
      )}
    </div>
  )
}

// Section on the home page — preview of up to 4 books, link to full page
function BooksSection() {
  const books = content.books ?? []
  if (books.length === 0) return null
  const preview = books.slice(0, 4)
  return (
    <section className="pt-12 pb-2">
      <div className="flex items-baseline justify-between gap-3 mb-5 flex-wrap">
        <h2 className="font-me-body font-black text-[1.95rem] leading-none tracking-tight uppercase m-0">
          Books
        </h2>
        <Link
          href="/books"
          className="text-[0.65rem] tracking-[0.22em] uppercase text-me-dim hover:text-me-gold cursor-pointer"
        >
          See all {books.length} →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {preview.map(b => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  )
}

// Dedicated /books page — full grid
function BooksView() {
  const books = content.books ?? []
  return (
    <>
      <PageHeader
        kicker="Reading list"
        title="Books"
        subtitle="What I'm reading and what I'd put in your hands. Click through to get any of them."
      />
      {books.length === 0 ? (
        <div className="text-me-dim italic py-8">No books yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-12">
          {books.map(b => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Recent feed (home view) — no tab filter; the nav handles that now
// ──────────────────────────────────────────────────────────────────────────
function Recent({ onOpenGallery }: { onOpenGallery: (g: GalleryPost) => void }) {
  return (
    <>
      <div className="flex justify-between items-end pt-12 pb-5 gap-3.5 flex-wrap">
        <h2 className="font-me-body font-black text-[1.95rem] leading-none tracking-tight uppercase m-0">
          Recent
        </h2>
        <span className="text-[0.65rem] tracking-[0.22em] uppercase text-me-dim">
          {content.posts.length} posts
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {content.posts.map(p => (
          <MeCard key={p.id} post={p} onOpenGallery={onOpenGallery} />
        ))}
      </div>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Forest graffiti band
// ──────────────────────────────────────────────────────────────────────────
function ForestBand() {
  return (
    <div
      className="relative mt-16 -mx-4 sm:-mx-7 px-4 sm:px-7 pt-[120px] pb-14 overflow-hidden rounded-[14px]"
      style={{
        backgroundImage: `linear-gradient(180deg,rgba(11,15,12,.55) 0%,rgba(11,15,12,.4) 40%,rgba(11,15,12,.85) 100%), ${MOUNTAIN_BACKDROP}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#11170F',
      }}
    >
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] font-me-scrawl text-[clamp(4rem,11vw,7rem)] leading-none whitespace-nowrap text-[#E8DDC9]/95 pointer-events-none"
        style={{ textShadow: '0 2px 0 rgba(0,0,0,.3),0 6px 24px rgba(0,0,0,.5)' }}
      >
        edcromwell
      </div>
      <div className="relative z-10 mt-40 max-w-[520px]">
        <h3 className="font-me-body font-black text-[2rem] leading-[1.05] tracking-tight uppercase m-0 text-white" style={{ textShadow: '0 2px 18px rgba(0,0,0,.5)' }}>
          Music I'm into.<br />Photos I took.<br />Mostly at night.
        </h3>
        <p className="mt-3.5 text-[0.78rem] tracking-[0.16em] uppercase text-[#E8DDC9]/70 leading-[1.7]">
          Ed Cromwell · Northern Virginia · est. 2018
        </p>
      </div>
    </div>
  )
}

function Foot() {
  return (
    <div className="py-9 pb-16 flex justify-between items-center text-me-dim text-[0.7rem] tracking-[0.2em] uppercase flex-wrap gap-2.5">
      <span>© Ed Cromwell · 2026</span>
      <a href="https://edcromwell.com" className="hover:text-me-gold transition-colors">edcromwell.com →</a>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Page header used on /tracks, /galleries, /about
// ──────────────────────────────────────────────────────────────────────────
function PageHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return (
    <div className="pt-10 pb-8">
      <div className="text-[0.7rem] tracking-[0.32em] uppercase text-me-gold font-semibold mb-3">{kicker}</div>
      <h1 className="font-me-body font-black text-[clamp(2.6rem,6vw,4rem)] leading-[0.92] tracking-tight uppercase text-me-text m-0">
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-me-dim text-base max-w-xl leading-relaxed">{subtitle}</p>}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Views
// ──────────────────────────────────────────────────────────────────────────
function HomeView({ onOpenGallery }: { onOpenGallery: (g: GalleryPost) => void }) {
  return (
    <>
      <Hero onOpenGallery={onOpenGallery} />
      <NowPlayingStrip />
      <YearPicksSection />
      <PlaylistsSection />
      <BooksSection />
      <Recent onOpenGallery={onOpenGallery} />
      <ForestBand />
    </>
  )
}

function TracksView({ onOpenGallery }: { onOpenGallery: (g: GalleryPost) => void }) {
  const { playPlaylist, playlist, isPlaying, current } = useMusic()
  const tracks = content.posts.filter(p => p.type === 'track')

  // Build the playlist of TrackMeta in the same order as the cards.
  const playlistMetas: TrackMeta[] = tracks.map(t => ({
    youtube_id: (t as { youtube_id: string }).youtube_id,
    title: t.title,
    artist: (t as { artist: string }).artist,
    cover_url: (t as { cover_url?: string }).cover_url,
  }))

  // True if the playlist context is already loaded with this exact set.
  const playlistActive =
    playlist.length === playlistMetas.length &&
    playlist.every((p, i) => p.youtube_id === playlistMetas[i]?.youtube_id)
  const playAllPlaying = playlistActive && isPlaying

  const onPlayAll = () => playPlaylist(playlistMetas, 0)

  return (
    <>
      <PageHeader
        kicker="Curated"
        title="Tracks"
        subtitle="Click any track to start the playlist there — the next song auto-plays when this one ends."
      />

      <PlaylistsSection />

      {tracks.length > 0 && (
        <div className="flex items-center gap-3 pt-6 pb-6">
          <button
            onClick={onPlayAll}
            className="inline-flex items-center gap-2 bg-me-gold text-me-bg px-5 py-2.5 rounded-full text-[0.74rem] tracking-[0.18em] uppercase font-bold hover:scale-105 transition-transform shadow-[0_8px_24px_rgba(168,134,70,0.35)]"
          >
            {playAllPlaying ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Playing all
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20" />
                </svg>
                Play all
              </>
            )}
          </button>
          <span className="text-me-dim text-[0.78rem]">
            {tracks.length} tracks
            {playlistActive && current && (
              <span className="ml-2 text-me-gold/80">· now: {current.title}</span>
            )}
          </span>
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="text-me-dim italic py-8">No tracks yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {tracks.map((p, i) => (
            <MeCard
              key={p.id}
              post={p}
              onOpenGallery={onOpenGallery}
              onPlay={() => playPlaylist(playlistMetas, i)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function GalleriesView({ onOpenGallery }: { onOpenGallery: (g: GalleryPost) => void }) {
  const galleries = content.posts.filter(p => p.type === 'gallery')
  return (
    <>
      <PageHeader
        kicker="Photo sets"
        title="Galleries"
        subtitle="Each gallery has a song attached. Open it, hit play, see if the pairing works."
      />
      {galleries.length === 0 ? (
        <div className="text-me-dim italic py-8">No galleries yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {galleries.map(p => (
            <MeCard key={p.id} post={p} onOpenGallery={onOpenGallery} />
          ))}
        </div>
      )}
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Playlist detail — list each track individually so the visitor can pick
// where to start. Clicking any track plays the playlist starting at that
// track (the rest auto-advances).
// ──────────────────────────────────────────────────────────────────────────
function PlaylistDetailView({ id }: { id: string }) {
  const { playPlaylist, current, isPlaying, playlist: activePlaylist } = useMusic()
  const playlist = (content.playlists ?? []).find(pl => pl.id === id)

  if (!playlist) {
    return (
      <div className="pt-12 pb-20">
        <div className="text-[0.7rem] tracking-[0.32em] uppercase text-me-gold font-semibold mb-3">
          Playlist not found
        </div>
        <h1 className="font-me-body font-black text-[2.4rem] leading-[0.92] tracking-tight uppercase text-me-text m-0">
          That playlist doesn't exist
        </h1>
        <Link
          href="/tracks"
          className="inline-block mt-6 text-me-gold hover:text-me-text underline text-sm tracking-wide"
        >
          ← Back to tracks
        </Link>
      </div>
    )
  }

  // Is this exact playlist (by track-id sequence) the active queue?
  const playlistActive =
    activePlaylist.length === playlist.tracks.length &&
    activePlaylist.every((t, i) => t.youtube_id === playlist.tracks[i]?.youtube_id)

  const onPlayAll = () => {
    if (playlist.tracks.length > 0) playPlaylist(playlist.tracks, 0)
  }

  return (
    <>
      <div className="pt-8 pb-2">
        <Link href="/tracks" className="inline-flex items-center gap-1 text-me-dim hover:text-me-text text-[0.7rem] tracking-[0.18em] uppercase mb-5">
          ← Back to tracks
        </Link>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          <div
            className="w-44 sm:w-56 aspect-square rounded-xl shadow-2xl flex-shrink-0"
            style={{
              background: playlist.cover_url
                ? `url(${playlist.cover_url}) center/cover`
                : 'linear-gradient(135deg,#1F2E22,#2A1E14 70%,#A88646)',
            }}
          />
          <div className="flex flex-col">
            <div className="text-[0.62rem] tracking-[0.32em] uppercase text-me-gold font-semibold mb-2">
              Playlist
            </div>
            <h1 className="font-me-body font-black text-[clamp(2.2rem,5vw,3.4rem)] leading-[0.95] tracking-tight uppercase text-me-text m-0">
              {playlist.title}
            </h1>
            {playlist.description && (
              <p className="mt-3 text-me-dim text-base max-w-xl leading-relaxed">
                {playlist.description}
              </p>
            )}
            <div className="mt-3 text-[0.7rem] tracking-[0.18em] uppercase text-me-dim">
              {playlist.tracks.length} track{playlist.tracks.length === 1 ? '' : 's'}
            </div>
            {playlist.tracks.length > 0 && (
              <button
                onClick={onPlayAll}
                className="mt-5 inline-flex items-center gap-2 bg-me-gold text-me-bg px-5 py-2.5 rounded-full text-[0.74rem] tracking-[0.18em] uppercase font-bold hover:scale-105 transition-transform shadow-[0_8px_24px_rgba(168,134,70,0.35)] w-fit"
              >
                {playlistActive && isPlaying ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Playing
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 4 20 12 6 20" />
                    </svg>
                    Play all
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="mt-10 pb-12">
        {playlist.tracks.length === 0 ? (
          <div className="text-me-dim italic py-8">No tracks in this playlist yet.</div>
        ) : (
          <div className="rounded-xl border border-[rgba(180,160,120,0.10)] overflow-hidden bg-me-bg-2/50">
            {playlist.tracks.map((t, i) => {
              const isCurrent =
                playlistActive && current?.youtube_id === t.youtube_id
              const isCurrentPlaying = isCurrent && isPlaying
              return (
                <button
                  key={`${t.youtube_id}-${i}`}
                  onClick={() => playPlaylist(playlist.tracks, i)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left border-b border-[rgba(180,160,120,0.08)] last:border-b-0 transition-colors ${
                    isCurrent
                      ? 'bg-me-gold/10'
                      : 'hover:bg-me-moss/40'
                  }`}
                >
                  <div className="w-7 text-center text-me-dim font-mono text-[0.78rem] flex-shrink-0">
                    {isCurrent ? (
                      <span className="text-me-gold">{isCurrentPlaying ? '♪' : '⏸'}</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div
                    className="w-12 h-12 rounded flex-shrink-0"
                    style={{
                      background: t.cover_url
                        ? `url(${t.cover_url}) center/cover`
                        : 'linear-gradient(135deg,#3D5942,#A88646)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-[0.95rem] truncate ${isCurrent ? 'text-me-gold' : 'text-me-text'}`}>
                      {t.title || '(untitled)'}
                    </div>
                    <div className="text-[0.78rem] text-me-dim truncate">{t.artist}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function AboutView() {
  const paragraphs = (content.about ?? '').split(/\n\n+/).filter(Boolean)
  return (
    <>
      <PageHeader kicker="Behind the page" title="About" />
      <div className="max-w-2xl space-y-5 text-[1.02rem] leading-[1.7] text-me-text/90 pb-12">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="text-me-dim italic">No about content yet.</p>
        )}
      </div>
      <ForestBand />
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Inner page (uses Music context)
// ──────────────────────────────────────────────────────────────────────────
function MeInner() {
  const [galleryPost, setGalleryPost] = useState<GalleryPost | null>(null)

  return (
    <div
      className="min-h-screen text-me-text font-me-body relative overflow-x-hidden"
      style={{
        backgroundColor: '#0B0F0C',
        backgroundImage: `linear-gradient(180deg,rgba(11,15,12,.7) 0%,rgba(11,15,12,.88) 60%,rgba(11,15,12,.97) 100%), ${FOREST_BACKDROP}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7 relative z-[2]">
        <Nav />

        <Switch>
          <Route path="/tracks">
            <TracksView onOpenGallery={setGalleryPost} />
          </Route>
          <Route path="/galleries">
            <GalleriesView onOpenGallery={setGalleryPost} />
          </Route>
          <Route path="/playlists/:id">
            {(params: { id: string }) => <PlaylistDetailView id={params.id} />}
          </Route>
          <Route path="/books">
            <BooksView />
          </Route>
          <Route path="/about">
            <AboutView />
          </Route>
          <Route path="/">
            <HomeView onOpenGallery={setGalleryPost} />
          </Route>
          {/* Fallback for unknown sub-paths — show home */}
          <Route>
            <HomeView onOpenGallery={setGalleryPost} />
          </Route>
        </Switch>

        <Foot />
      </div>

      <MePlayer />
      <MeGalleryModal post={galleryPost} onClose={() => setGalleryPost(null)} />
    </div>
  )
}

export default function Me() {
  // Resolve the initial track for the music provider regardless of whether
  // the featured slot is a track or a gallery. Galleries surface their
  // paired soundtrack; tracks surface themselves. Falls back to a safe
  // empty-ish track if data is mid-edit and nothing useful resolves.
  const f = content.featured
  let featuredTrack: TrackMeta = { youtube_id: '', title: 'No track', artist: '', cover_url: '' }
  if (isFeaturedGallery(f)) {
    const g = content.posts.find(
      p => p.type === 'gallery' && p.id === f.gallery_id,
    ) as GalleryPost | undefined
    if (g) featuredTrack = g.soundtrack
  } else {
    featuredTrack = {
      youtube_id: f.youtube_id,
      title: f.title,
      artist: f.artist,
      cover_url: f.cover_url,
    }
  }
  return (
    <MusicProvider initialTrack={featuredTrack}>
      <MeInner />
    </MusicProvider>
  )
}
