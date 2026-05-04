import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Send,
  CheckCircle,
  Globe,
  PhoneCall,
  CalendarCheck,
  MessageSquare,
  Star,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'

const services = [
  {
    icon: Globe,
    title: 'Custom Websites',
    description:
      "A modern, mobile-friendly site that loads fast and looks like your business. Online ordering, service pages, photo galleries, contact forms — built so customers can actually find you and reach you.",
    tags: ['Responsive', 'Fast', 'On-Brand'],
  },
  {
    icon: PhoneCall,
    title: 'AI Phone Answering',
    description:
      'A natural-sounding AI receptionist that picks up every call, books appointments, takes messages, and answers common questions — 24/7. Stop losing customers to voicemail.',
    tags: ['24/7', 'Natural Voice', 'Lead Capture'],
  },
  {
    icon: CalendarCheck,
    title: 'Online Booking',
    description:
      'Let customers book themselves directly into your calendar. Automatic confirmations, SMS reminders, deposit collection, and no double-bookings. More appointments, less back-and-forth.',
    tags: ['Self-Service', 'Reminders', 'Calendar Sync'],
  },
  {
    icon: MessageSquare,
    title: 'Lead Follow-up Automation',
    description:
      'Every inquiry gets an instant reply via text or email, then a smart follow-up sequence to nurture them into a paying customer. The sales work happens while you focus on the job.',
    tags: ['SMS', 'Email', 'Auto-Reply'],
  },
  {
    icon: Star,
    title: 'Reviews & Reputation',
    description:
      "After every appointment or sale, automatically ask happy customers for a Google review. More 5-star ratings, higher local rankings, more trust before someone even calls.",
    tags: ['Google Reviews', 'Auto-Request', 'Trust'],
  },
  {
    icon: MapPin,
    title: 'Local SEO & Google Business',
    description:
      'Show up when neighbors search "near me." Optimized Google Business profile, local citations, photos, posts, and monthly reporting so you can actually see what\'s working.',
    tags: ['Google Maps', 'Local Search', 'Reporting'],
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
    link: 'https://propersupply.store',
  },
  {
    title: 'Lumen',
    subtitle: 'AI Study Platform',
    description: 'An intelligent tutoring system that auto-generates Anki flash cards from course materials. Built for WGU students who want to study smarter, not harder.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  },
]

function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just show success — wire up to a backend (Formspree, Netlify Forms, etc.) later
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section id="contact" className="py-20 md:py-32 px-6 scroll-mt-16 md:scroll-mt-0">
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
    <section id="contact" className="py-20 md:py-32 px-6 scroll-mt-16">
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
              Need a website, want to automate the parts of your business that eat your day, or just
              tired of missing calls? Tell me what you're working on and I'll get back to you.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-heading text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm font-body text-cream placeholder-cream/20 focus:outline-none focus:border-gold/40 transition-colors"
                  placeholder="(555) 555-5555"
                />
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
      {/* Mobile section quick-jump — only shows on phones, lets visitors
          jump to Services / Work / Contact without scrolling. */}
      <nav
        aria-label="Section quick-jump"
        className="md:hidden sticky top-16 z-30 bg-bg/95 backdrop-blur border-b border-border"
      >
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-4 py-2 text-[11px] tracking-[0.18em] uppercase font-heading font-semibold whitespace-nowrap">
          <a href="#services" className="px-3 py-1.5 rounded-full text-cream/70 hover:text-cream hover:bg-card transition-colors">Services</a>
          <a href="#work" className="px-3 py-1.5 rounded-full text-cream/70 hover:text-cream hover:bg-card transition-colors">Work</a>
          <a href="#contact" className="px-3 py-1.5 rounded-full bg-accent text-bg">Contact</a>
        </div>
      </nav>

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
            Websites, AI automation, and growth tools for local small businesses
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
      <section id="services" className="py-20 md:py-32 px-6 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-10 md:mb-16"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">What I Do</span>
            <h2 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-cream mt-3">
              Services
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section id="work" className="relative py-20 md:py-32 px-6 bg-[#5C3D1A]/[0.04] scroll-mt-16">
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
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-10 md:mb-16"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">Portfolio</span>
            <h2 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-cream mt-3">
              Featured Work
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredWork.map((project, i) => {
              // Optional outbound link (e.g., propersupply.store). When present,
              // the entire card becomes a link that opens in a new tab.
              const link = (project as { link?: string }).link
              const cardInner = (
                <>
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
                    <h3 className="font-heading text-3xl font-black uppercase tracking-tight text-cream mt-1 mb-2 flex items-center gap-2">
                      {project.title}
                      {link && (
                        <ArrowRight
                          size={20}
                          className="text-gold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                        />
                      )}
                    </h3>
                    <p className="font-body text-cream/40 text-sm leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                    {link && (
                      <span className="inline-flex items-center gap-1.5 mt-3 font-heading text-[10px] tracking-[0.25em] uppercase text-gold">
                        Visit store
                        <ExternalLink size={12} />
                      </span>
                    )}
                  </div>
                </>
              )
              const motionProps = {
                key: project.title,
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '0px 0px -10% 0px' },
                transition: { duration: 0.25, ease: 'easeOut' },
                className:
                  'group relative overflow-hidden rounded-sm border border-border hover:border-gold/30 transition-colors' +
                  (link ? ' cursor-pointer' : ''),
              }
              return link ? (
                <motion.a
                  {...motionProps}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {cardInner}
                </motion.a>
              ) : (
                <motion.div {...motionProps}>{cardInner}</motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactSection />
    </div>
  )
}
