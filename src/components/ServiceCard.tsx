import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  tags: string[]
  // `index` kept in the prop signature for backwards compat with existing
  // call sites, but we no longer use it for staggered delays. Per-card
  // stagger compounded into ~600ms before the last card showed up, which
  // felt sluggish on mobile.
  index?: number
}

export default function ServiceCard({ icon: Icon, title, description, tags }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative bg-card border border-border rounded-sm p-5 md:p-8 hover:border-gold/30 transition-colors"
    >
      <div className="relative z-10">
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-gold/20 rounded-sm mb-4 md:mb-6 group-hover:border-gold/50 transition-colors">
          <Icon size={20} className="text-gold md:w-[22px] md:h-[22px]" />
        </div>
        <h3 className="font-heading text-lg md:text-xl font-bold uppercase tracking-wider text-cream mb-2 md:mb-3">
          {title}
        </h3>
        <p className="font-body text-cream/50 text-[0.86rem] md:text-sm leading-relaxed mb-4 md:mb-5">
          {description}
        </p>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] md:text-[10px] font-body font-semibold tracking-wider uppercase text-gold/70 border border-gold/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
