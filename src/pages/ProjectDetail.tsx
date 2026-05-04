import { motion } from 'framer-motion'
import { Link, useParams } from 'wouter'
import { ArrowLeft, Github } from 'lucide-react'
import { getProjectBySlug } from '@/lib/projects'

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const project = getProjectBySlug(slug || '')

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <h1 className="font-heading text-4xl uppercase text-cream/50">Project Not Found</h1>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end px-6 pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={project.image}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(100%)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F1] via-[#FAF6F1]/80 to-[#FAF6F1]/40" />
        </div>
        <div className="relative max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/" className="inline-flex items-center gap-2 font-body text-sm text-cream/50 hover:text-gold transition-colors mb-6">
              <ArrowLeft size={14} />
              Back to Portfolio
            </Link>
            <h1 className="font-heading font-black text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] tracking-tight uppercase text-cream mb-4">
              {project.name}
            </h1>
            <p className="font-heading text-lg tracking-wider uppercase text-gold">
              {project.tagline}
            </p>
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 font-heading text-sm tracking-[0.2em] uppercase text-cream/60 hover:text-gold border border-border hover:border-gold/30 px-6 py-3 rounded-sm transition-colors"
              >
                <Github size={16} />
                View on GitHub
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Description */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-6">Overview</h2>
            <p className="font-body text-cream/70 text-lg leading-relaxed max-w-3xl">
              {project.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Process */}
      <section className="px-6 py-16 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-10">The Process</h2>
            <div className="space-y-10 max-w-3xl">
              {project.process.map((section, i) => (
                <div key={i}>
                  <h3 className="font-heading text-lg font-bold uppercase text-cream mb-3">
                    {section.heading}
                  </h3>
                  <p className="font-body text-cream/60 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-6">Tech Stack</h2>
            <div className="flex flex-wrap gap-3">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="font-body text-sm font-semibold tracking-wider uppercase bg-cream/[0.06] text-cream/60 px-4 py-2 rounded-sm border border-border"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Back Link */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-sm tracking-[0.2em] uppercase text-cream/50 hover:text-gold transition-colors">
            <ArrowLeft size={14} />
            Back to All Projects
          </Link>
        </div>
      </section>
    </div>
  )
}
