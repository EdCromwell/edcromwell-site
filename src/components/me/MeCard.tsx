/**
 * Grid card. Renders either a `track` post (faux album-art block with an LP
 * graphic + scrawled title) or a `gallery` post (photo gradient with a
 * frame-count badge + "+ soundtrack" corner).
 *
 * Click → either plays the track via MusicContext or opens the gallery
 * modal (which auto-plays the paired soundtrack).
 */

import { useMusic, TrackMeta } from './MusicContext'
import { GalleryPost } from './MeGalleryModal'

export interface TrackPost {
  id: string
  type: 'track'
  youtube_id: string
  title: string
  artist: string
  cover_url?: string
  caption: string
  posted_at: string
}

export type Post = TrackPost | GalleryPost

// Cycle through gradient covers for tracks without a cover_url
const COVER_GRADIENTS = [
  'linear-gradient(135deg,#1A2620,#5A7A4F 100%)',
  'linear-gradient(160deg,#2A1E14,#A88646)',
  'linear-gradient(135deg,#0E1410,#3D5942)',
  'linear-gradient(125deg,#3E2D1F,#8B6F4D)',
]
// Cycle through photo gradients for galleries without real photos
const PHOTO_GRADIENTS = [
  'linear-gradient(160deg,#2A1E14,#5C4530 70%,#8B6F4D)',
  'linear-gradient(140deg,#1F2E22,#3D5942 50%,#A88646)',
  'linear-gradient(150deg,#11170F,#1F2E22 60%,#3D5942)',
  'linear-gradient(125deg,#1A2620,#2A1E14 60%,#3E2D1F)',
]

function gradientFor(id: string, palette: string[]): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function shortMonthDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MeCard({
  post,
  onOpenGallery,
  onPlay,
}: {
  post: Post
  onOpenGallery: (g: GalleryPost) => void
  /**
   * Optional override for what happens when a track card is clicked.
   * When provided, called with this track's metadata — used by the parent
   * to start a playlist context instead of playing a single track.
   */
  onPlay?: (meta: TrackMeta) => void
}) {
  const { playTrack, current, isPlaying } = useMusic()

  const isPlayingThis =
    isPlaying &&
    !!current &&
    (post.type === 'track'
      ? current.youtube_id === post.youtube_id
      : current.youtube_id === post.soundtrack.youtube_id)

  const handleClick = () => {
    if (post.type === 'track') {
      const meta: TrackMeta = {
        youtube_id: post.youtube_id,
        title: post.title,
        artist: post.artist,
        cover_url: post.cover_url,
      }
      // If the parent wants playlist behavior, defer to it. Otherwise play
      // this track as a single-track queue.
      if (onPlay) onPlay(meta)
      else playTrack(meta)
    } else {
      onOpenGallery(post)
    }
  }

  // ─── Track card — faux album art with LP + scrawl ───
  if (post.type === 'track') {
    const cover = post.cover_url
      ? `url(${post.cover_url}) center/cover`
      : gradientFor(post.id, COVER_GRADIENTS)

    const scrawl = post.title
      .replace(/\(.*?\)/g, '')
      .trim()
      .toLowerCase()

    // Has a real album cover uploaded? Then keep the art unobscured. Without
    // one, fall back to the scrawled-name graphic so the card isn't a blank
    // gradient.
    const hasCover = !!post.cover_url

    return (
      <button
        onClick={handleClick}
        className="group bg-me-bg-2 border border-[rgba(180,160,120,0.10)] rounded-xl overflow-hidden flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[rgba(180,160,120,0.20)] hover:bg-me-moss text-left"
      >
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0" style={{ background: cover }} />
          {/* Scrawled title — only shown when there's no real album art to clash with. */}
          {!hasCover && (
            <div className="absolute inset-0 flex items-end p-3.5 z-[2]">
              <div
                className="font-me-scrawl text-[1.5rem] leading-none -rotate-[3deg] text-[#E8DDC9]/95"
                style={{ textShadow: '0 1px 0 rgba(0,0,0,.4)' }}
              >
                {scrawl.length > 14 ? scrawl.slice(0, 14) : scrawl}
              </div>
            </div>
          )}
          {/* Now-playing indicator */}
          {isPlayingThis && (
            <div className="absolute top-2.5 right-2.5 z-[3] flex items-center gap-1 bg-me-gold/95 px-2 py-0.5 rounded-full text-[0.55rem] font-bold uppercase tracking-[0.18em] text-me-bg">
              <span className="w-[5px] h-[5px] rounded-full bg-me-bg animate-pulse" />
              Live
            </div>
          )}
          {/* Hover play overlay */}
          <div className="absolute inset-0 z-[3] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-12 h-12 rounded-full bg-me-text shadow-2xl flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
                <polygon points="6 4 20 12 6 20" />
              </svg>
            </div>
          </div>
        </div>
        <div className="px-3.5 pt-3.5 pb-4">
          <div className="text-[0.6rem] tracking-[0.22em] uppercase text-me-gold mb-1.5 font-semibold">Track</div>
          <h4 className="font-me-body font-bold text-[0.92rem] tracking-tight text-me-text m-0 leading-[1.25] truncate">
            {post.title}
          </h4>
          <div className="text-[0.72rem] text-me-dim flex items-center gap-1.5 mt-1">
            {post.artist} · {shortMonthDay(post.posted_at)}
          </div>
        </div>
      </button>
    )
  }

  // ─── Gallery card ───
  const cover = post.photos[0]
  const fallback = gradientFor(post.id, PHOTO_GRADIENTS)

  return (
    <button
      onClick={handleClick}
      className="group bg-me-bg-2 border border-[rgba(180,160,120,0.10)] rounded-xl overflow-hidden flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[rgba(180,160,120,0.20)] hover:bg-me-moss text-left"
    >
      <div className="relative aspect-square overflow-hidden">
        <div
          className="absolute inset-0"
          style={
            cover && !/\.(mp4|mov|webm)$/i.test(cover)
              ? { background: `url(${cover}) center/cover` }
              : { background: fallback }
          }
        />
        {cover && /\.(mp4|mov|webm)$/i.test(cover) && (
          <video
            src={cover}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}
        {/* Frame count badge */}
        <div className="absolute top-2.5 right-2.5 z-[2] flex items-center gap-1.5 bg-black/55 backdrop-blur px-2 py-1 rounded-[14px] text-[0.7rem] text-me-text font-semibold border border-me-gold/20">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="14" height="14" rx="2" />
            <rect x="7" y="7" width="14" height="14" rx="2" />
          </svg>
          {post.photos.length}
        </div>
        {/* + soundtrack pill */}
        <div className="absolute left-2.5 bottom-2.5 z-[2] flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-full text-[0.62rem] tracking-[0.18em] uppercase text-me-gold border border-me-gold/25">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          + soundtrack
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 z-[3] flex items-end justify-center pb-16 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
          <div className="rounded-full bg-black/80 backdrop-blur px-3 py-1.5 text-[0.66rem] font-semibold text-white tracking-wide">
            ▶ {post.soundtrack.title}
          </div>
        </div>
      </div>
      <div className="px-3.5 pt-3.5 pb-4">
        <div className="text-[0.6rem] tracking-[0.22em] uppercase text-me-gold mb-1.5 font-semibold">Gallery</div>
        <h4 className="font-me-body font-bold text-[0.92rem] tracking-tight text-me-text m-0 leading-[1.25] truncate">
          {post.title}
        </h4>
        <div className="text-[0.72rem] text-me-dim flex items-center gap-1.5 mt-1">
          {post.photos.length} frames
          <span className="w-2.5 h-px bg-me-gold/50" />
          <span className="text-me-text/85 font-medium truncate">+ {post.soundtrack.artist}</span>
        </div>
      </div>
    </button>
  )
}
