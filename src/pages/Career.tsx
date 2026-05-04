import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProjectCard from '@/components/ProjectCard'
import { projects } from '@/lib/projects'

const skills = [
  'Windows Server', 'Active Directory', 'VMware vSphere/ESXi', 'Tier 2/3 Troubleshooting',
  'ServiceNow', 'PowerShell', 'Patch Management', 'STIG Compliance', 'RMF/DFARS',
  'Server & Desktop Support', 'DNS/DHCP', 'High-Availability Infrastructure', 'Virtualization',
  'DoD Security Standards', 'SolarWinds', 'Python', 'React', 'CrewAI', 'Ollama', 'Shopify',
]

const awards = [
  { title: '5th Communications Squadron Team of the Year', org: 'Air Force', description: 'Led team and coordinated a multi-flight solution for the 5 BW Classified Processing Area initiative, bringing 252 vulnerable computers into security compliance across 34 classified areas supporting 2 Wings.' },
  { title: 'General Edwin W. Rawling Team Award', org: 'Air Force', description: 'Spearheaded a $20K technology upgrade for 5 BW Headquarters, improving operational efficiency by 5% and boosting productivity by 20%.' },
  { title: 'Letter of Appreciation', org: 'FIRST Lego League', description: 'Coached Robotics Club; volunteered 25 hours and taught 8 children robotics and engineering principles, leading the team to compete for a city title and earned an LOA from the youth program manager.' },
  { title: 'Information Dominance Award', org: 'Air Force', description: 'Led 4 members through a wing SIPR evaluation, accounting for 113 devices and revitalizing links to SIPR terminals, ensuring 99.9% network uptime and bolstering the base\'s secure communication capabilities.' },
  { title: 'General Edwin W. Rawling Team Award', org: 'Air Force', description: 'Executed a $32K VoIP migration; configured 15 sites and deployed 105 devices, eliminating end-of-life technology in less than 6 months and driving forward command initiatives.' },
]

const employment = [
  {
    role: 'System Network Administrator',
    org: 'OSAAVA Services (83rd Network Operations Squadron, Langley AFB)',
    location: 'Hampton, VA',
    dates: 'Jan 2025 - Present',
    description: 'I manage the storage and virtual infrastructure for the 83rd Network Operations Squadron at Langley Air Force Base. Day to day, that means I\'m deploying and maintaining virtual machines in VMware, monitoring systems to catch issues before they become problems, and making sure everything meets Department of Defense security standards. I also maintain all the documentation \u2014 configurations, processes, procedures \u2014 so the team can operate smoothly. It\'s enterprise-level IT in a military environment where uptime and security aren\'t optional.',
  },
  {
    role: 'Enterprise Administrator (Internship)',
    org: 'NASA Johnson Space Center',
    location: 'Houston, TX',
    dates: 'Feb 2024 - Jun 2024',
    description: 'I interned at NASA\'s Johnson Space Center in Houston, where I worked on their internal web systems and IT infrastructure. I streamlined the troubleshooting process and CMS for the NASA M2M website, which cut team response times by 15% and improved overall efficiency by 20%. I also led a 4-month SharePoint site overhaul \u2014 redesigned the UI and navigation, which boosted team productivity by 25%. One of my favorite parts was creating software tutorials and guides that simplified complex NASA tools for over 1,000 users, cutting their training time by 40%.',
  },
  {
    role: 'System Administrator',
    org: 'Air Force (5th Communications Squadron, Minot AFB)',
    location: 'Minot, ND',
    dates: 'Jun 2020 - Feb 2024',
    description: 'I spent nearly four years as a System Administrator at Minot Air Force Base in North Dakota, supporting mission-critical communications for the 5th Bomb Wing. I led some big projects \u2014 a $300K security upgrade for the base\'s E911 emergency system, deploying two secure servers that improved dispatch times for 7,000 people. I also spearheaded a $180K network upgrade across four organizations, deploying 30 security-hardened devices to ensure secure communications at missile facilities. Other highlights include a $52K encrypted phone installation project where I trained 127 users on cybersecurity, a $45K laptop refresh for missile alert crews, and building out 25 encrypted fiber connections across three offices that saved $7.8K annually in contract fees.',
  },
]

function JobCard({ job, i }: { job: typeof employment[number]; i: number }) {
  const [expanded, setExpanded] = useState(false)
  const previewLength = 150
  const needsTruncation = job.description.length > previewLength
  return (
    <motion.div
      key={i}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      className="relative pl-8 pb-12 border-l-2 border-gold/20 last:pb-0"
    >
      {/* Timeline dot */}
      <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-gold" />
      <div
        className="bg-card border border-border rounded-sm p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h4 className="font-heading text-xl font-bold uppercase tracking-wider text-cream">
            {job.role}
          </h4>
        </div>
        <p className="font-body text-cream/50 text-sm mb-4">
          {job.org} — {job.location}
        </p>
        {/* Description with truncation */}
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.p
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="text-cream/60 leading-relaxed font-body text-sm"
            >
              {job.description}
            </motion.p>
          ) : (
            <motion.p
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="text-cream/60 leading-relaxed font-body text-sm"
            >
              {needsTruncation
                ? job.description.slice(0, previewLength) + '...'
                : job.description}
            </motion.p>
          )}
        </AnimatePresence>
        {needsTruncation && (
          <button className="font-body text-xs text-gold/60 hover:text-gold mt-3 transition-colors">
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function Career() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-6 pt-16">
        {/* Hero background image — NASA photo */}
        <div className="absolute inset-0">
          <img
            src="/images/ed-nasa-hangar.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(100%)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F1]/90 via-[#FAF6F1]/70 to-[#FAF6F1]" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">Technical Portfolio</span>
            <h1 className="font-heading font-black text-[clamp(3.5rem,12vw,10rem)] leading-[0.85] tracking-tight uppercase text-cream mt-3 mb-8">
              ED<br />CROMWELL
            </h1>
            <p className="font-body text-cream/50 text-lg md:text-xl max-w-2xl leading-relaxed">
              Air Force veteran. NASA intern. Systems administrator. AI engineer.
              Building what's next — from the ground up.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-card/50 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-8">About</h2>

            <div className="space-y-6 font-body text-cream/60 text-base leading-relaxed">
              <p>
                I'm Ed Cromwell — a DoD-experienced IT professional with 5+ years in enterprise systems administration,
                currently working at Langley Air Force Base managing storage and virtualization infrastructure for the
                83rd Network Operations Squadron. Before that, I interned at NASA's Johnson Space Center in Houston,
                where I worked on their internal web systems, led a SharePoint overhaul, and built software tutorials
                for over 1,000 users.
              </p>

              <p>
                I spent nearly four years as a System Administrator with the Air Force at Minot AFB in North Dakota,
                supporting mission-critical communications for the 5th Bomb Wing. I led infrastructure projects worth
                over half a million dollars combined — from E911 security upgrades and secure network deployments at
                missile facilities to encrypted communications installations and cybersecurity tech refreshes. During
                that time, my team was recognized as Division IT Team of the Year and Headquarters IT Team of the Year,
                and I was individually named Headquarters IT Technician of the Year.
              </p>

              <p>
                I hold a CompTIA Security+ certification and a VMware Certified Professional credential. I'm currently
                finishing my B.S. in Information Technology Management at Western Governors University. Outside of work,
                I volunteer — I coached a FIRST Lego League robotics club, teaching 8 kids engineering principles and
                leading them to compete for a city title.
              </p>

              <p>
                On my own time, I build. I designed and deployed Aldric — a fully local multi-agent AI automation system
                running on a Mac Mini M4 Pro that handles my finances, business research, and studying through four
                specialized AI agents. I built PROPER SUPPLY, a West Coast streetwear brand with a custom React storefront
                deployed on Vercel. I built Pulse, a real-time crypto arbitrage scanner. Everything I ship is production-grade,
                locally-hosted where possible, and built to solve a real problem I actually have.
              </p>

              <p className="text-accent font-medium">
                I'm based in Hampton, VA. If you want to work together or just talk tech, reach out.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">Background</span>
            <h2 className="font-heading font-black text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] tracking-tight uppercase text-cream mt-3">
              Experience
            </h2>
          </motion.div>

          {/* Employment Timeline */}
          <div className="mb-20">
            <h3 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-10">Employment History</h3>
            <div className="space-y-0">
              {employment.map((job, i) => (
                <JobCard key={i} job={job} i={i} />
              ))}
            </div>
          </div>

          {/* Education & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-6">Education</h3>
              <div className="bg-card border border-border rounded-sm p-6">
                <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-cream mb-1">
                  B.S. Information Technology Management
                </h4>
                <p className="font-body text-cream/50 text-sm">Western Governors University</p>
                <p className="font-body text-cream/40 text-xs mt-1">Oct 2022 - Aug 2026</p>
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-6">Certifications</h3>
              <div className="space-y-3">
                <div className="bg-card border border-border rounded-sm p-6">
                  <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-cream mb-1">
                    CompTIA Security+
                  </h4>
                  <p className="font-body text-cream/40 text-xs">Oct 2020 - Oct 2026</p>
                </div>
                <div className="bg-card border border-border rounded-sm p-6">
                  <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-cream mb-1">
                    VMware Certified Professional
                  </h4>
                  <p className="font-body text-cream/40 text-xs">Apr 2025 - Apr 2028</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <h3 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-6">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="font-body text-xs font-semibold tracking-wider uppercase bg-cream/[0.06] text-cream/60 px-4 py-2 rounded-full border border-border hover:border-gold/30 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Awards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-heading text-xs tracking-[0.3em] uppercase text-gold mb-6">Awards</h3>
            <div className="space-y-3">
              {awards.map((award, i) => (
                <div key={i} className="bg-card border border-border rounded-sm px-6 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-heading text-sm font-bold uppercase tracking-wider text-cream">
                        {award.title}
                      </span>
                      <span className="font-body text-cream/40 text-xs ml-3">{award.org}</span>
                    </div>
                  </div>
                  <p className="text-cream/50 text-sm font-body leading-relaxed mt-2">
                    {award.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Grid */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold">Work</span>
            <h2 className="font-heading font-black text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] tracking-tight uppercase text-cream mt-3">
              Projects
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <ProjectCard key={project.slug} {...project} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
