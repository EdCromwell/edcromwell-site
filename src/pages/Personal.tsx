import { motion } from 'framer-motion'
import PhotoGallery from '@/components/PhotoGallery'

export default function Personal() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Minimal header — no nav */}
      <div className="pt-10 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="font-heading text-lg font-bold tracking-[0.3em] uppercase text-cream/30">
              Ed Cromwell
            </span>
          </motion.div>
        </div>
      </div>

      {/* Gallery */}
      <div className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PhotoGallery />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
