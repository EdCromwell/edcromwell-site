import { Project } from '@/lib/projects'
import { Plus, Circle } from 'lucide-react'

type Props = {
  projects: Project[]
  selectedSlug: string | null
  dirtySlugs: Set<string>
  onSelect: (slug: string) => void
  onAdd: () => void
}

export default function ProjectListRail({
  projects,
  selectedSlug,
  dirtySlugs,
  onSelect,
  onAdd,
}: Props) {
  return (
    <aside className="w-60 shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-xs uppercase tracking-widest text-cream/60">
            Projects ({projects.length})
          </h2>
          <button
            type="button"
            onClick={onAdd}
            className="text-cream/40 hover:text-gold transition-colors"
            aria-label="Add project"
            title="Add new project"
          >
            <Plus size={16} />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {projects.map((p) => {
            const isSelected = p.slug === selectedSlug
            const isDirty = dirtySlugs.has(p.slug)
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => onSelect(p.slug)}
                className={`text-left px-3 py-2 rounded flex items-center justify-between gap-2 transition-colors ${
                  isSelected
                    ? 'bg-warm/40 text-cream'
                    : 'text-cream/60 hover:text-cream hover:bg-warm/20'
                }`}
              >
                <span className="font-body text-sm truncate">{p.title}</span>
                {isDirty && (
                  <Circle
                    size={6}
                    className="text-gold fill-gold shrink-0"
                    aria-label="Unsaved changes"
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
