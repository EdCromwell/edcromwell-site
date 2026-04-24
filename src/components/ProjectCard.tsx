import { motion } from 'framer-motion'
import { ExternalLink, Github } from 'lucide-react'
import { Link } from 'wouter'

interface ProjectCardProps {
  title: string
  slug: string
  description: string
  techStack: string[]
  image?: string
  liveUrl?: string
  repoUrl?: string
  github?: string
  index: number
}

export default function ProjectCard({
  title,
  slug,
  description,
  techStack,
  image,
  liveUrl,
  repoUrl,
  github,
  index,
}: ProjectCardProps) {
  const githubUrl = github || repoUrl
  return (
    <Link href={`/project/${slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        className="group bg-card border border-border rounded-sm overflow-hidden hover:border-gold/30 transition-all duration-500 cursor-pointer"
      >
        {image && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-cream">
              {title}
            </h3>
            <div className="flex items-center gap-3 ml-4 shrink-0">
              {githubUrl && (
                <span
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(githubUrl, '_blank')
                  }}
                  className="text-cream/30 hover:text-gold transition-colors"
                  aria-label={`${title} GitHub`}
                >
                  <Github size={16} />
                </span>
              )}
              {liveUrl && (
                <span
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(liveUrl, '_blank')
                  }}
                  className="text-cream/30 hover:text-gold transition-colors"
                  aria-label={`${title} live site`}
                >
                  <ExternalLink size={16} />
                </span>
              )}
            </div>
          </div>
          <p className="font-body text-cream/50 text-sm leading-relaxed mb-5">
            {description}
          </p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-body font-semibold tracking-wider uppercase bg-cream/[0.04] text-cream/50 px-2.5 py-1 rounded-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
