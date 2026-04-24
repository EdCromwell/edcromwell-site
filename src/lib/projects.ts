import projectsData from '@/../content/projects.json'

interface ProcessSection {
  heading: string
  content: string
}

export interface Project {
  slug: string
  title: string
  name: string
  tagline: string
  description: string
  process: ProcessSection[]
  techStack: string[]
  image: string
  liveUrl?: string
  repoUrl?: string
  github?: string
}

// projects.json is the authoritative source — the admin panel (Phase 2) will
// edit it and commit the change back to the repo via the GitHub API. Vercel
// auto-rebuilds on push, so edits go live in ~30s.
//
// `resolveJsonModule` is already on in tsconfig.json, so this import works
// without any extra loader config.
export const projects: Project[] = projectsData as Project[]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
