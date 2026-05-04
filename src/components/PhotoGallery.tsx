import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Photo {
  id: number
  src: string
  alt: string
  collection: string
}

const photos: Photo[] = [
  { id: 1, src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', alt: 'Mountain landscape', collection: 'Travel' },
  { id: 2, src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', alt: 'Portrait in golden light', collection: 'Portraits' },
  { id: 3, src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', alt: 'Starry mountain night', collection: 'Travel' },
  { id: 4, src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80', alt: 'City street at night', collection: 'Street' },
  { id: 5, src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', alt: 'Studio portrait', collection: 'Portraits' },
  { id: 6, src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', alt: 'Tropical coast', collection: 'Travel' },
  { id: 7, src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80', alt: 'Urban skyline', collection: 'Street' },
  { id: 8, src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80', alt: 'Natural light portrait', collection: 'Portraits' },
  { id: 9, src: 'https://images.unsplash.com/photo-1502920917399-1e5e1e194a90?w=800&q=80', alt: 'Neon street scene', collection: 'Street' },
  { id: 10, src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', alt: 'Valley sunrise', collection: 'Travel' },
  { id: 11, src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', alt: 'Fashion portrait', collection: 'Portraits' },
  { id: 12, src: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80', alt: 'Rainy street', collection: 'Street' },
]

const collections = ['All', 'Travel', 'Portraits', 'Street']

export default function PhotoGallery() {
  const [activeCollection, setActiveCollection] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = activeCollection === 'All'
    ? photos
    : photos.filter((p) => p.collection === activeCollection)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const navigate = (dir: 1 | -1) => {
    if (lightboxIndex === null) return
    const next = lightboxIndex + dir
    if (next >= 0 && next < filtered.length) {
      setLightboxIndex(next)
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-10 flex-wrap">
        {collections.map((col) => (
          <button
            key={col}
            onClick={() => { setActiveCollection(col); setLightboxIndex(null) }}
            className={`font-heading text-sm tracking-[0.2em] uppercase px-4 py-2 border rounded-sm transition-all duration-300 ${
              activeCollection === col
                ? 'border-gold text-gold bg-gold/5'
                : 'border-border text-cream/40 hover:text-cream/70 hover:border-cream/20'
            }`}
          >
            {col}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((photo, idx) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="relative aspect-square overflow-hidden cursor-pointer group rounded-sm"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-xs font-heading tracking-wider uppercase text-cream/80">
                  {photo.collection}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#2C2216]/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-cream/60 hover:text-cream transition-colors z-10"
              aria-label="Close lightbox"
            >
              <X size={28} />
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(-1) }}
                className="absolute left-4 md:left-8 text-cream/40 hover:text-cream transition-colors z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft size={36} />
              </button>
            )}

            {lightboxIndex < filtered.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(1) }}
                className="absolute right-4 md:right-8 text-cream/40 hover:text-cream transition-colors z-10"
                aria-label="Next photo"
              >
                <ChevronRight size={36} />
              </button>
            )}

            <motion.img
              key={filtered[lightboxIndex].id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
