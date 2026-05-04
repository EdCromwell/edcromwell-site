import { useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Circle,
} from 'lucide-react'
import { projects as bundledProjects, Project } from '@/lib/projects'
import ProjectListRail from '@/components/admin/ProjectListRail'
import ProjectForm from '@/components/admin/ProjectForm'

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; commitUrl: string }
  | { kind: 'error'; message: string }

export default function AdminContent() {
  const { getToken } = useAuth()

  // Load the currently-bundled projects.json as the starting point.
  // When we save, the serverless fn writes to GitHub, Vercel rebuilds, and
  // the bundle re-imports the new data on next page load. Simple and honest.
  const [original] = useState<Project[]>(() =>
    structuredClone(bundledProjects),
  )
  const [projects, setProjects] = useState<Project[]>(() =>
    structuredClone(bundledProjects),
  )
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    bundledProjects[0]?.slug ?? null,
  )
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' })

  // Dirty tracking — compare each project to its original.
  const dirtySlugs = useMemo(() => {
    const originalBySlug = new Map(original.map((p) => [p.slug, p]))
    const out = new Set<string>()
    for (const p of projects) {
      const o = originalBySlug.get(p.slug)
      if (!o || JSON.stringify(o) !== JSON.stringify(p)) {
        out.add(p.slug)
      }
    }
    for (const o of original) {
      if (!projects.find((p) => p.slug === o.slug)) {
        out.add(o.slug) // deleted
      }
    }
    return out
  }, [projects, original])

  const hasChanges = dirtySlugs.size > 0
  const selected = projects.find((p) => p.slug === selectedSlug) ?? null

  const updateSelected = (next: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.slug === selected?.slug ? next : p)),
    )
    setStatus({ kind: 'idle' }) // clear previous save indicators
  }

  const deleteSelected = () => {
    if (!selected) return
    setProjects((prev) => prev.filter((p) => p.slug !== selected.slug))
    const remaining = projects.filter((p) => p.slug !== selected.slug)
    setSelectedSlug(remaining[0]?.slug ?? null)
    setStatus({ kind: 'idle' })
  }

  const addNew = () => {
    const base = 'new-project'
    let slug = base
    let n = 1
    const existing = new Set(projects.map((p) => p.slug))
    while (existing.has(slug)) {
      slug = `${base}-${n++}`
    }
    const fresh: Project = {
      slug,
      title: 'New Project',
      name: 'New Project',
      tagline: '',
      description: '',
      process: [],
      techStack: [],
      image: '',
    }
    setProjects((prev) => [...prev, fresh])
    setSelectedSlug(slug)
    setStatus({ kind: 'idle' })
  }

  const discard = () => {
    if (!hasChanges) return
    if (
      !window.confirm(
        'Discard all unsaved changes? This reverts every project to the last deployed version.',
      )
    ) {
      return
    }
    setProjects(structuredClone(original))
    setStatus({ kind: 'idle' })
  }

  const save = async () => {
    setStatus({ kind: 'saving' })
    try {
      const token = await getToken()
      if (!token) {
        setStatus({
          kind: 'error',
          message: 'Not signed in. Refresh and try again.',
        })
        return
      }
      const res = await fetch('/api/content/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: 'content/projects.json',
          content: projects,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({
          kind: 'error',
          message: body?.error ?? `Save failed (${res.status})`,
        })
        return
      }
      setStatus({ kind: 'saved', commitUrl: body.commitUrl })
      // NOTE: we don't clear `dirtySlugs` by updating `original` — on purpose.
      // The bundled projects the browser has are now stale (GitHub has the new
      // ones, but the JS bundle doesn't reload until Vercel redeploys). A
      // subsequent save re-sends the current state, which is correct.
      //
      // If you reload the page after a few minutes (once Vercel finishes
      // redeploying), original and projects will both reflect the committed
      // version and the dirty dots will clear naturally.
    } catch (err: any) {
      setStatus({
        kind: 'error',
        message: err?.message ?? 'Network error while saving',
      })
    }
  }

  return (
    <div>
      {/* Header + actions */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-widest text-cream mb-2">
            Site Content
          </h1>
          <p className="font-body text-cream/60">
            Edit project cards here. Saving commits{' '}
            <code className="text-gold font-mono text-sm">
              content/projects.json
            </code>{' '}
            to GitHub and triggers a Vercel rebuild.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={discard}
            disabled={!hasChanges || status.kind === 'saving'}
            className="flex items-center gap-2 px-4 py-2 border border-border text-cream/70 hover:text-cream disabled:opacity-40 disabled:cursor-not-allowed rounded font-body text-sm transition-colors"
          >
            <RotateCcw size={14} />
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!hasChanges || status.kind === 'saving'}
            className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-accent text-bg disabled:opacity-40 disabled:cursor-not-allowed rounded font-heading text-sm uppercase tracking-widest transition-colors"
          >
            <Save size={14} />
            {status.kind === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner status={status} dirtyCount={dirtySlugs.size} />

      {/* List + form */}
      <div className="flex gap-8 mt-4">
        <ProjectListRail
          projects={projects}
          selectedSlug={selectedSlug}
          dirtySlugs={dirtySlugs}
          onSelect={setSelectedSlug}
          onAdd={addNew}
        />
        {selected ? (
          <ProjectForm
            key={selected.slug}
            project={selected}
            onChange={updateSelected}
            onDelete={deleteSelected}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[40vh] border border-dashed border-border rounded">
            <p className="font-body text-cream/40">
              No project selected. Use "+" to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBanner({
  status,
  dirtyCount,
}: {
  status: SaveStatus
  dirtyCount: number
}) {
  if (status.kind === 'saved') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-warm/20 border border-gold/30 rounded">
        <div className="flex items-center gap-2 text-cream">
          <CheckCircle2 size={16} className="text-gold" />
          <span className="font-body text-sm">
            Saved. Vercel is rebuilding — changes go live in ~30–60 seconds.
          </span>
        </div>
        <a
          href={status.commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-gold hover:underline"
        >
          View commit →
        </a>
      </div>
    )
  }
  if (status.kind === 'error') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
        <AlertCircle size={16} className="text-red-400" />
        <span className="font-body text-sm text-red-200">
          {status.message}
        </span>
      </div>
    )
  }
  if (dirtyCount > 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/20 rounded">
        <Circle size={8} className="text-gold fill-gold" />
        <span className="font-body text-sm text-cream/70">
          {dirtyCount} project{dirtyCount === 1 ? '' : 's'} with unsaved changes
        </span>
      </div>
    )
  }
  return null
}
