import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Cpu, Code2, Settings, Send, CheckCircle } from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'

const services = [
  {
    icon: Cpu,
    title: 'AI Automation',
    description: 'End-to-end intelligent automation using CrewAI and multi-agent orchestration. Transform manual workflows into autonomous systems that run 24/7.',
    tags: ['CrewAI', 'Multi-Agent', 'Orchestration'],
  },
  {
    icon: Bot,
    title: 'AI Agents',
    description: 'Custom Discord bots, local LLM deployment with Ollama, and purpose-built AI agents that integrate directly into your business operations.',
    tags: ['Discord Bots', 'Ollama', 'Local LLM'],
  },
  {
    icon: Code2,
    title: 'Web Development',
    description: 'Modern React applications, Shopify storefronts, and full-stack solutions. Performance-first architecture with clean, maintainable code.',
    tags: ['React', 'Shopify', 'Full-Stack'],
  },
  {
    icon: Settings,
    title: 'Technical Consulting',
    description: 'Architecture reviews, scaling strategies, and integration planning. Navigate complex technical decisions with confidence and clarity.',
    tags: ['Architecture', 'Scaling', 'Integration'],
  },
]

const featuredWork = [
  {
    title: 'Aldric',
    subtitle: 'Local AI Agent Crew',
    description: 'A fully local multi-agent automation system powered by CrewAI and Ollama. Four specialized agents handling finance, business strategy, education, and general tasks — all running privately on Apple Silicon.',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
  },
  {
    title: 'Pulse',
    subtitle: 'Crypto Arbitrage Scanner',
    description: 'Real-time cryptocurrency arbitrage detection across multiple exchanges. Automated scanning, alert systems, and opportunity analysis with sub-second latency.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  },
  {
    title: 'PROPER SUPPLY',
    subtitle: 'Streetwear Storefront',
    description: 'Premium e-commerce platform for a West Coast streetwear brand. Custom Shopify theme with editorial design language, optimized for conversion and brand experience.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  },
  {
    title: 'Lumen',
    subtitle: 'AI Study Platform',
    description: 'An intelligent tutoring system that auto-generates Anki flash cards from course materials. Built for WGU students who want to study smarter, not harder.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  },
]

function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just show success — wire up to a backend (Formspree, Netlify Forms, etc.) later
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section id="contact" className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle size={48} className="text-gold mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tight text-cream mb-4">
              Message Received
            </h2>
            <p className="font-body text-cream/50 text-lg">
              Thanks for reaching out. I'll get back to you shortly.
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-32 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">Let's Work Together</span>
            <h2 className="font-heading text-5xl md:text-7xl font-black uppercase tracking-tight text-cream mt-3 mb-6">
              Get in Touch
            </h2>
            <p className="font-body text-cream/50 text-lg leading-relaxed">
              Have a project in mind? Looking to automate your workflows or build something new?
              Fill out the form below and I'll get back to you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-heading text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm font-body text-cream placeholder-cream/20 focus:outline-none focus:border-gold/40 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm font-body text-cream placeholder-cream/20 focus:outline-none focus:border-gold/40 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-heading text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">
                Company / Organization
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm font-body text-cream placeholder-cream/20 focus:outline-none focus:border-gold/40 transition-colors"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block font-heading text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm font-body text-cream placeholder-cream/20 focus:outline-none focus:border-gold/40 transition-colors resize-none"
                placeholder="Tell me about your project or what you're looking for..."
              />
            </div>

            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-3 bg-accent text-bg font-heading font-bold text-sm tracking-[0.2em] uppercase px-10 py-4 rounded-sm hover:bg-accent/90 transition-colors"
            >
              <Send size={16} />
              Send Message
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}

export default function Business() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Hero background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80&sat=-100"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F1]/90 via-[#FAF6F1]/70 to-[#FAF6F1]" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-heading font-black text-[clamp(3.5rem,12vw,10rem)] leading-[0.85] tracking-tight uppercase text-cream">
              ED<br />CROMWELL
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-body text-cream/50 text-lg md:text-xl max-w-2xl mx-auto mt-8 leading-relaxed"
          >
            AI automation, web development, and technical consulting for ambitious SMBs
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <a
              href="#contact"
              className="group flex items-center gap-2 bg-accent text-bg font-heading font-bold text-sm tracking-[0.2em] uppercase px-8 py-4 rounded-sm hover:bg-accent/90 transition-colors"
            >
              Get in Touch
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#work"
              className="flex items-center gap-2 border border-accent/30 text-cream font-heading font-bold text-sm tracking-[0.2em] uppercase px-8 py-4 rounded-sm hover:border-accent/60 transition-colors"
            >
              View Work
            </a>
          </motion.div>

        </div>
      </section>

      {/* Services */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">What I Do</span>
            <h2 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-cream mt-3">
              Services
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, i) => (
              <ServiceCard key={service.title} {...service} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section id="work" className="relative py-32 px-6 bg-[#5C3D1A]/[0.04]">
        {/* Section background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80&sat=-100"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F1]/90 via-[#FAF6F1]/85 to-[#FAF6F1]/90" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">Portfolio</span>
            <h2 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-cream mt-3">
              Featured Work
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredWork.map((project, i) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-sm border border-border hover:border-gold/30 transition-all duration-500"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">
                    {project.subtitle}
                  </span>
                  <h3 className="font-heading text-3xl font-black uppercase tracking-tight text-cream mt-1 mb-2">
                    {project.title}
                  </h3>
                  <p className="font-body text-cream/40 text-sm leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactSection />
    </div>
  )
}
