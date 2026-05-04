/**
 * Music player context — wraps the YouTube IFrame Player API.
 *
 * Why YouTube: full songs play for any visitor, no auth, no Premium gate. The
 * YouTube player is rendered hidden (0×0 when collapsed, ~360×200 when
 * expanded) — the custom UI in MePlayer is what the visitor sees.
 *
 * Docs: https://developers.google.com/youtube/iframe_api_reference
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react'

export interface TrackMeta {
  /** YouTube video id, e.g. `GR3Liudev18` from `youtube.com/watch?v=GR3Liudev18` */
  youtube_id: string
  title: string
  artist: string
  cover_url?: string
}

interface MusicContextValue {
  current: TrackMeta | null
  isPlaying: boolean
  /** Position in seconds */
  position: number
  /** Duration in seconds */
  duration: number
  /** True once the YouTube player has fired its onReady event. */
  ready: boolean
  /** Play a single track, replacing the queue with just that track. */
  playTrack: (track: TrackMeta) => void
  /**
   * Play a list of tracks as a playlist. `startIdx` is the track to play first
   * (defaults to 0). When that track ends, the next one auto-plays.
   */
  playPlaylist: (tracks: TrackMeta[], startIdx?: number) => void
  /** The active queue. Empty array = no queue / single-track mode. */
  playlist: TrackMeta[]
  /** Index in `playlist` of the currently-playing track. */
  playlistIdx: number
  /** Skip to next track in the playlist (no-op if at the end). */
  next: () => void
  /** Go to the previous track in the playlist (no-op if at the start). */
  prev: () => void
  togglePlay: () => void
  pause: () => void
  expanded: boolean
  setExpanded: (v: boolean) => void
  iframeContainerRef: React.RefObject<HTMLDivElement>
}

const MusicContext = createContext<MusicContextValue | null>(null)

const YT_API_SRC = 'https://www.youtube.com/iframe_api'

// Minimal type surface for what we use.
interface YTPlayer {
  loadVideoById: (id: string) => void
  playVideo: () => void
  pauseVideo: () => void
  getPlayerState: () => number
  getCurrentTime: () => number
  getDuration: () => number
  destroy: () => void
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
    YT?: {
      Player: new (
        target: HTMLElement | string,
        options: Record<string, unknown>,
      ) => YTPlayer
      PlayerState: {
        UNSTARTED: -1
        ENDED: 0
        PLAYING: 1
        PAUSED: 2
        BUFFERING: 3
        CUED: 5
      }
    }
  }
}

export function MusicProvider({
  initialTrack,
  children,
}: {
  /** The track the player is loaded with on mount. Also seeds `current` so
   *  the now-playing UI shows the right info before the user clicks anything. */
  initialTrack: TrackMeta
  children: ReactNode
}) {
  const iframeContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const pendingTrackRef = useRef<TrackMeta | null>(null)
  const pollRef = useRef<number | null>(null)
  const currentRef = useRef<TrackMeta>(initialTrack)
  const initialTrackRef = useRef<TrackMeta>(initialTrack)
  // Mirrors of playlist state for use inside the YouTube state-change listener
  // (which closes over the values at controller creation time, so it can't
  // see fresh React state directly).
  const playlistRef = useRef<TrackMeta[]>([])
  const playlistIdxRef = useRef<number>(-1)

  // Seed `current` with the initial track so the UI shows artist/title from
  // the very first render, even before any user interaction.
  const [current, setCurrentState] = useState<TrackMeta | null>(initialTrack)
  const setCurrent = (t: TrackMeta | null) => {
    if (t) currentRef.current = t
    setCurrentState(t)
  }
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [playlist, setPlaylistState] = useState<TrackMeta[]>([])
  const [playlistIdx, setPlaylistIdxState] = useState<number>(-1)
  const setPlaylist = (next: TrackMeta[]) => {
    playlistRef.current = next
    setPlaylistState(next)
  }
  const setPlaylistIdx = (next: number) => {
    playlistIdxRef.current = next
    setPlaylistIdxState(next)
  }

  // Load the IFrame Player API + create the player.
  useEffect(() => {
    let mounted = true

    const init = () => {
      console.log('[Music] init', { hasContainer: !!iframeContainerRef.current, hasYT: !!window.YT?.Player })
      if (!mounted || !iframeContainerRef.current || !window.YT?.Player) return

      // YouTube replaces the target element with an iframe, so give it a fresh
      // child div to consume.
      const target = document.createElement('div')
      iframeContainerRef.current.innerHTML = ''
      iframeContainerRef.current.appendChild(target)

      playerRef.current = new window.YT.Player(target, {
        height: '100%',
        width: '100%',
        videoId: initialTrackRef.current.youtube_id,
        playerVars: {
          playsinline: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          // Don't autoplay on mount — wait for user gesture.
          autoplay: 0,
        },
        events: {
          onReady: () => {
            console.log('[Music] player READY')
            if (!mounted) return
            setReady(true)
            try {
              const d = playerRef.current?.getDuration() || 0
              if (d) setDuration(Math.round(d))
            } catch {}
            if (pendingTrackRef.current) {
              const t = pendingTrackRef.current
              pendingTrackRef.current = null
              console.log('[Music] flushing pending track', t.title)
              playerRef.current?.loadVideoById(t.youtube_id)
              setCurrent(t)
            }
          },
          onStateChange: (e: { data: number }) => {
            const PS = window.YT?.PlayerState
            if (!PS) return
            setIsPlaying(e.data === PS.PLAYING)
            if (e.data === PS.PLAYING || e.data === PS.BUFFERING) {
              try {
                const d = playerRef.current?.getDuration() || 0
                if (d) setDuration(Math.round(d))
              } catch {}
            }
            // Auto-advance: when a track ends and there's a next track in
            // the active playlist, load and play it.
            if (e.data === PS.ENDED) {
              const list = playlistRef.current
              const idx = playlistIdxRef.current
              if (list.length > 0 && idx >= 0 && idx + 1 < list.length) {
                const nextTrack = list[idx + 1]
                playlistIdxRef.current = idx + 1
                setPlaylistIdxState(idx + 1)
                currentRef.current = nextTrack
                setCurrentState(nextTrack)
                playerRef.current?.loadVideoById(nextTrack.youtube_id)
              }
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      init()
    } else {
      // YouTube's API calls window.onYouTubeIframeAPIReady() when ready (no
      // argument — the API populates window.YT).
      window.onYouTubeIframeAPIReady = () => init()
      if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
        const s = document.createElement('script')
        s.src = YT_API_SRC
        s.async = true
        document.head.appendChild(s)
      }
    }

    // Position polling — YouTube doesn't fire continuous updates.
    pollRef.current = window.setInterval(() => {
      const p = playerRef.current
      if (!p) return
      try {
        const t = p.getCurrentTime()
        if (typeof t === 'number' && Number.isFinite(t)) setPosition(Math.round(t))
      } catch {}
    }, 500)

    return () => {
      mounted = false
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {}
        playerRef.current = null
      }
    }
    // initialId intentionally only used on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playTrack = useCallback(
    (track: TrackMeta) => {
      // Single-track play clears any active playlist.
      setPlaylist([])
      setPlaylistIdx(-1)
      setCurrent(track)
      if (playerRef.current && ready) {
        playerRef.current.loadVideoById(track.youtube_id)
      } else {
        pendingTrackRef.current = track
      }
    },
    [ready],
  )

  const playPlaylist = useCallback(
    (tracks: TrackMeta[], startIdx = 0) => {
      if (tracks.length === 0) return
      const idx = Math.max(0, Math.min(startIdx, tracks.length - 1))
      setPlaylist(tracks)
      setPlaylistIdx(idx)
      const track = tracks[idx]
      setCurrent(track)
      if (playerRef.current && ready) {
        playerRef.current.loadVideoById(track.youtube_id)
      } else {
        pendingTrackRef.current = track
      }
    },
    [ready],
  )

  const next = useCallback(() => {
    const list = playlistRef.current
    const idx = playlistIdxRef.current
    if (list.length === 0 || idx + 1 >= list.length) return
    playPlaylist(list, idx + 1)
  }, [playPlaylist])

  const prev = useCallback(() => {
    const list = playlistRef.current
    const idx = playlistIdxRef.current
    if (list.length === 0 || idx <= 0) return
    playPlaylist(list, idx - 1)
  }, [playPlaylist])

  const togglePlay = useCallback(() => {
    const p = playerRef.current
    const PS = window.YT?.PlayerState
    if (!p || !PS) return
    try {
      const state = p.getPlayerState()
      if (state === PS.PLAYING) p.pauseVideo()
      else p.playVideo()
    } catch {}
  }, [])

  const pause = useCallback(() => {
    if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo()
  }, [])

  return (
    <MusicContext.Provider
      value={{
        current,
        isPlaying,
        position,
        duration,
        ready,
        playTrack,
        playPlaylist,
        playlist,
        playlistIdx,
        next,
        prev,
        togglePlay,
        pause,
        expanded,
        setExpanded,
        iframeContainerRef,
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used inside <MusicProvider>')
  return ctx
}

// Helper to format seconds as M:SS
export function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${r.toString().padStart(2, '0')}`
}
