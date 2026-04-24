import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  tags: string[]
  index: number
}

export default function ServiceCard({ icon: Icon, title, description, tags, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-card border border-border rounded-sm p-8 hover:border-gold/30 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-sm" />
      <div className="relative z-10">
        <div className="w-12 h-12 flex items-center justify-center border border-gold/20 rounded-sm mb-6 group-hover:border-gold/50 transition-colors">
          <Icon size={22} className="text-gold" />
        </div>
        <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-cream mb-3">
          {title}
        </h3>
        <p className="font-body text-cream/50 text-sm leading-relaxed mb-5">
          {description}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-body font-semibold tracking-wider uppercase text-gold/70 border border-gold/20 px-2 py-1 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
