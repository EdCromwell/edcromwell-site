import { Project } from '@/lib/projects'
import { Plus, X, Trash2 } from 'lucide-react'

type Props = {
  project: Project
  onChange: (next: Project) => void
  onDelete: () => void
}

/**
 * Per-project editor. Controlled component — parent holds the array, we only
 * mutate our own slot and call onChange. Keeps state management boring.
 *
 * Slug is shown but read-only after creation because it's in public URLs
 * (/project/:slug) — renaming a project should be a deliberate act, not
 * something to do by accident in a text field.
 */
export default function ProjectForm({ project, onChange, onDelete }: Props) {
  const update = <K extends keyof Project>(key: K, value: Project[K]) => {
    onChange({ ...project, [key]: value })
  }

  return (
    <div className="flex-1 min-w-0 max-w-3xl">
      {/* Slug + delete */}
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-border">
        <div>
          <div className="font-heading text-xs uppercase tracking-widest text-cream/40 mb-1">
            Slug (read-only)
          </div>
          <div className="font-mono text-sm text-cream">{project.slug}</div>
          <div className="font-body text-xs text-cream/50 mt-1">
            Appears at /project/{project.slug}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Delete "${project.title}"? This removes it from the site on next save.`,
              )
            ) {
              onDelete()
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-cream/50 hover:text-red-500 border border-border hover:border-red-500/40 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {/* Basic fields */}
      <Section label="Basics">
        <Field label="Title (short — appears on cards)">
          <TextInput
            value={project.title}
            onChange={(v) => update('title', v)}
          />
        </Field>
        <Field label="Name (long — appears on detail page)">
          <TextInput value={project.name} onChange={(v) => update('name', v)} />
        </Field>
        <Field label="Tagline">
          <TextInput
            value={project.tagline}
            onChange={(v) => update('tagline', v)}
          />
        </Field>
        <Field label="Description">
          <TextArea
            rows={5}
            value={project.description}
            onChange={(v) => update('description', v)}
          />
        </Field>
      </Section>

      {/* Image */}
      <Section label="Image">
        <Field label="Image URL">
          <TextInput
            value={project.image}
            onChange={(v) => update('image', v)}
            placeholder="https://images.unsplash.com/…"
          />
        </Field>
        {project.image && (
          <div className="mt-2">
            <img
              src={project.image}
              alt="Preview"
              className="max-w-full max-h-48 rounded border border-border object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.opacity = '0.3'
              }}
            />
          </div>
        )}
      </Section>

      {/* Links */}
      <Section label="Links (optional)">
        <Field label="Live URL">
          <TextInput
            value={project.liveUrl ?? ''}
            onChange={(v) => update('liveUrl', v || undefined)}
            placeholder="https://…"
          />
        </Field>
        <Field label="GitHub">
          <TextInput
            value={project.github ?? ''}
            onChange={(v) => update('github', v || undefined)}
            placeholder="https://github.com/…"
          />
        </Field>
        <Field label="Repo URL (alternate)">
          <TextInput
            value={project.repoUrl ?? ''}
            onChange={(v) => update('repoUrl', v || undefined)}
            placeholder="#"
          />
        </Field>
      </Section>

      {/* Tech stack */}
      <Section label={`Tech stack (${project.techStack.length})`}>
        <TechStackEditor
          items={project.techStack}
          onChange={(next) => update('techStack', next)}
        />
      </Section>

      {/* Process sections */}
      <Section label={`Process (${project.process.length} sections)`}>
        <ProcessEditor
          sections={project.process}
          onChange={(next) => update('process', next)}
        />
      </Section>
    </div>
  )
}

// ───────── Building blocks ─────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h3 className="font-heading text-sm uppercase tracking-widest text-cream/60 mb-3">
        {label}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-body text-xs text-cream/50 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-card border border-border rounded font-body text-sm text-cream focus:outline-none focus:border-gold/60"
    />
  )
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-card border border-border rounded font-body text-sm text-cream focus:outline-none focus:border-gold/60 leading-relaxed"
    />
  )
}

// ───────── Tech stack (chip input) ─────────────────────────────────────

function TechStackEditor({
  items,
  onChange,
}: {
  items: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <span
            key={`${i}-${item}`}
            className="inline-flex items-center gap-2 px-3 py-1 bg-warm/30 text-cream font-body text-sm rounded"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-cream/60 hover:text-red-500"
              aria-label={`Remove ${item}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <AddChipInput onAdd={(v) => onChange([...items, v])} />
    </div>
  )
}

function AddChipInput({ onAdd }: { onAdd: (v: string) => void }) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget as HTMLFormElement
        const input = form.elements.namedItem('chip') as HTMLInputElement
        const v = input.value.trim()
        if (v) {
          onAdd(v)
          input.value = ''
        }
      }}
    >
      <input
        name="chip"
        type="text"
        placeholder="Add tech… (Enter)"
        className="flex-1 px-3 py-1.5 bg-card border border-border rounded font-body text-sm text-cream focus:outline-none focus:border-gold/60"
      />
      <button
        type="submit"
        className="px-3 py-1.5 bg-warm/30 hover:bg-warm/50 text-cream rounded font-body text-sm"
      >
        <Plus size={14} />
      </button>
    </form>
  )
}

// ───────── Process sections editor ─────────────────────────────────────

function ProcessEditor({
  sections,
  onChange,
}: {
  sections: { heading: string; content: string }[]
  onChange: (next: { heading: string; content: string }[]) => void
}) {
  const updateAt = (i: number, next: { heading: string; content: string }) =>
    onChange(sections.map((s, idx) => (idx === i ? next : s)))
  const removeAt = (i: number) =>
    onChange(sections.filter((_, idx) => idx !== i))
  const addSection = () =>
    onChange([...sections, { heading: '', content: '' }])

  return (
    <div className="space-y-4">
      {sections.map((s, i) => (
        <div
          key={i}
          className="p-4 bg-card border border-border rounded space-y-3"
        >
          <div className="flex items-start gap-2">
            <input
              type="text"
              value={s.heading}
              placeholder="Heading"
              onChange={(e) => updateAt(i, { ...s, heading: e.target.value })}
              className="flex-1 px-3 py-2 bg-bg border border-border rounded font-heading text-sm uppercase tracking-wider text-cream focus:outline-none focus:border-gold/60"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="p-2 text-cream/40 hover:text-red-500 border border-border rounded"
              aria-label="Remove section"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            value={s.content}
            rows={4}
            placeholder="Section content…"
            onChange={(e) => updateAt(i, { ...s, content: e.target.value })}
            className="w-full px-3 py-2 bg-bg border border-border rounded font-body text-sm text-cream focus:outline-none focus:border-gold/60 leading-relaxed"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addSection}
        className="w-full py-2 border border-dashed border-border hover:border-gold/60 rounded font-body text-sm text-cream/60 hover:text-cream transition-colors"
      >
        <Plus size={14} className="inline mr-2" />
        Add section
      </button>
    </div>
  )
}
