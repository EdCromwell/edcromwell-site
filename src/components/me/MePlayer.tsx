/**
 * Floating mini-player. The YouTube iframe is permanently hidden (1×1px,
 * offscreen) — visitors only ever see the custom puck UI. Audio still plays
 * through the iframe; the visual is suppressed by design.
 */

import { useMusic, fmtTime } from './MusicContext'

export default function MePlayer() {
  const {
    current,
    isPlaying,
    position,
    duration,
    togglePlay,
    iframeContainerRef,
    playlist,
    playlistIdx,
    next,
    prev,
  } = useMusic()

  const progress = duration ? Math.min(100, (position / duration) * 100) : 0
  const showQueueControls = playlist.length > 1
  const hasNext = showQueueControls && playlistIdx + 1 < playlist.length
  const hasPrev = showQueueControls && playlistIdx > 0

  return (
    <div className="fixed z-50 bottom-3 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 sm:w-[300px]">
      <div className="relative bg-me-bg-2/95 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
        {/* Gold accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-me-gold" />

        {/* The YouTube iframe target — always 1×1 hidden so audio plays but
            the video never appears to the visitor. */}
        <div
          ref={iframeContainerRef}
          className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none"
          aria-hidden
        />

        {/* Custom puck UI */}
        <div className="relative p-2.5 flex items-center gap-2.5">
          <div
            className="w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden relative"
            style={{
              background: current?.cover_url
                ? `url(${current.cover_url}) center/cover`
                : 'linear-gradient(135deg,#3D5942,#A88646)',
            }}
          >
            {!current?.cover_url && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.6rem] tracking-[0.2em] uppercase text-me-gold font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-me-gold shadow-[0_0_4px_#A88646] animate-pulse" />
              {isPlaying ? 'Now playing' : 'Paused'}
            </div>
            <div className="text-[0.82rem] font-semibold text-me-text whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
              {current?.title || 'Press play to start'}
            </div>
            <div className="text-[0.7rem] text-me-dim whitespace-nowrap overflow-hidden text-ellipsis">
              {current?.artist || 'no track loaded'}
            </div>
          </div>
          {showQueueControls && (
            <button
              onClick={prev}
              disabled={!hasPrev}
              aria-label="Previous track"
              className="w-7 h-7 rounded-full text-me-text flex items-center justify-center flex-shrink-0 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="20 4 9 12 20 20" />
                <rect x="6" y="4" width="2" height="16" />
              </svg>
            </button>
          )}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full bg-me-text text-me-bg flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20" />
              </svg>
            )}
          </button>
          {showQueueControls && (
            <button
              onClick={next}
              disabled={!hasNext}
              aria-label="Next track"
              className="w-7 h-7 rounded-full text-me-text flex items-center justify-center flex-shrink-0 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="4 4 15 12 4 20" />
                <rect x="16" y="4" width="2" height="16" />
              </svg>
            </button>
          )}

          {/* Progress bar at bottom */}
          <div className="absolute left-3.5 right-3.5 bottom-1.5 h-0.5 bg-white/10 rounded overflow-hidden">
            <div className="h-full bg-me-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Tiny meta — current time */}
        {duration > 0 && (
          <div className="absolute -top-5 right-0 text-[0.66rem] text-me-dim tracking-wider font-mono">
            {fmtTime(position)} / {fmtTime(duration)}
          </div>
        )}
      </div>
    </div>
  )
}
