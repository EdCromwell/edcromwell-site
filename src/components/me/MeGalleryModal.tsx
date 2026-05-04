/**
 * Photo gallery lightbox. The paired soundtrack does NOT auto-play — visitors
 * see a play button on the soundtrack panel and can choose to listen.
 */

import { useEffect, useState } from 'react'
import { useMusic, TrackMeta } from './MusicContext'

export interface GalleryPost {
  id: string
  type: 'gallery'
  title: string
  caption: string
  tags: string[]
  photos: string[]
  soundtrack: TrackMeta
  posted_at: string
}

export default function MeGalleryModal({
  post,
  onClose,
}: {
  post: GalleryPost | null
  onClose: () => void
}) {
  const { playTrack, togglePlay, isPlaying, current } = useMusic()
  const [idx, setIdx] = useState(0)

  // Reset photo index when a new gallery opens. Soundtrack does NOT auto-play
  // — the visitor presses the play button on the soundtrack panel.
  useEffect(() => {
    if (post) setIdx(0)
  }, [post])

  // Is the paired soundtrack the track currently loaded in the player?
  const isThisSoundtrack =
    !!current && !!post && current.youtube_id === post.soundtrack.youtube_id
  const isThisPlaying = isThisSoundtrack && isPlaying

  const onPlaySoundtrack = () => {
    if (!post) return
    if (isThisSoundtrack) {
      // Same track is loaded → toggle play/pause.
      togglePlay()
    } else {
      // Load and play this gallery's track.
      playTrack(post.soundtrack)
    }
  }

  // Esc to close, arrow keys to nav.
  useEffect(() => {
    if (!post) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight') setIdx(i => Math.min(post.photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [post, onClose])

  if (!post) return null

  const photo = post.photos[idx]

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-me-bg-2 border border-white/15 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_340px] shadow-2xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Photo or video frame — `object-contain` so the FULL image is visible
            (letterboxed against the black background for varying aspect ratios). */}
        <div className="relative aspect-square bg-black">
          {photo && /\.(mp4|mov|webm)$/i.test(photo) ? (
            // Video frame — autoplay muted loop. Forced muted + playsInline.
            <video
              key={photo}
              src={photo}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : photo ? (
            <img
              src={photo}
              alt={`${post.title} — frame ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}
          {idx > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur"
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              aria-label="Previous photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {idx < post.photos.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur"
              onClick={() => setIdx(i => Math.min(post.photos.length - 1, i + 1))}
              aria-label="Next photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
          <div className="absolute bottom-3.5 left-0 right-0 flex justify-center gap-1.5">
            {post.photos.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition ${i === idx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="p-5 sm:p-6 flex flex-col bg-me-bg text-me-text font-me-body">
          <div className="text-[0.68rem] tracking-[0.2em] uppercase text-me-dim mb-2.5">
            {new Date(post.posted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mb-1.5">{post.title}</h2>
          <p className="text-sm text-me-dim leading-relaxed mb-4">{post.caption}</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {post.tags.map(t => (
              <span key={t} className="text-[0.66rem] text-me-dim bg-me-moss border border-white/10 rounded-full px-2.5 py-0.5 lowercase">
                {t}
              </span>
            ))}
          </div>

          {/* Soundtrack panel — visitor presses play to hear the paired song */}
          <div className="mt-auto rounded-xl border border-me-gold/25 bg-me-gold/5 p-3 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-md flex-shrink-0 overflow-hidden relative"
              style={{
                background: post.soundtrack.cover_url
                  ? `url(${post.soundtrack.cover_url}) center/cover`
                  : 'linear-gradient(135deg,#3D5942,#A88646)',
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[0.62rem] tracking-[0.22em] uppercase text-me-gold font-semibold flex items-center gap-1.5">
                {isThisPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-me-gold shadow-[0_0_4px_#A88646] animate-pulse" />
                )}
                {isThisPlaying ? 'Soundtrack · Now playing' : 'Paired soundtrack'}
              </div>
              <div className="text-sm font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {post.soundtrack.title}
              </div>
              <div className="text-[0.72rem] text-me-dim whitespace-nowrap overflow-hidden text-ellipsis">
                {post.soundtrack.artist}
              </div>
            </div>
            <button
              onClick={onPlaySoundtrack}
              aria-label={isThisPlaying ? 'Pause soundtrack' : 'Play soundtrack'}
              className="w-10 h-10 rounded-full bg-me-gold text-me-bg flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform shadow-[0_4px_12px_rgba(168,134,70,0.35)]"
            >
              {isThisPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}
