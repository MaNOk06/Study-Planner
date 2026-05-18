import { useState, useMemo } from 'react'
import { useStore } from '../lib/store'
import { COURSES, CATEGORIES, ACADEMIC_CATEGORIES, C } from '../lib/constants'
import { daysUntil } from '../lib/dates'
import { SectionHeader, EmptyState } from '../components/Shared'
import ItemCard from '../components/ItemCard'

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'week', label: 'This week' },
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
]

export default function AllItems({ onEdit, onAddNew, onImportPdf }) {
  const { items } = useStore()
  const [filter, setFilter] = useState('active')
  const [courseFilter, setCourseFilter] = useState('all')

  const academicItems = useMemo(() => items.filter(i =>
    i.type !== 'habit' && i.type !== 'goal'
  ), [items])

  const filtered = useMemo(() => {
    let list = [...academicItems]
    if (courseFilter !== 'all') list = list.filter(i => i.course === courseFilter)

    if (filter === 'active') list = list.filter(i => i.status !== 'done')
    if (filter === 'week') list = list.filter(i => {
      if (i.status === 'done') return false
      const d = daysUntil(i.dueDate)
      return d <= 7 && d >= -7
    })
    if (filter === 'done') list = list.filter(i => i.status === 'done')

    if (filter === 'done') {
      list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
    } else {
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    }
    return list
  }, [academicItems, filter, courseFilter])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
      <SectionHeader
        kicker="All items"
        title="Everything academic"
      />

      {/* Status filter */}
      <div className="flex gap-1 mb-3" style={{ background: '#EFEAE0', padding: 4, borderRadius: 12 }}>
        {FILTERS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            flex: 1, padding: '8px', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            background: filter === t.id ? '#FFF' : 'transparent',
            color: filter === t.id ? C.NAVY : C.MUTED,
            boxShadow: filter === t.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Course filter - horizontal scroll */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        <CourseChip active={courseFilter === 'all'} onClick={() => setCourseFilter('all')}
          label="All courses" />
        {Object.entries(COURSES).filter(([k]) => k !== 'PERSONAL').map(([k, v]) => (
          <CourseChip key={k}
            active={courseFilter === k}
            onClick={() => setCourseFilter(k)}
            color={v.bg}
            label={v.short}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing here."
          body={filter === 'done' ? "Completed items will appear here." : "Add an item or upload your syllabus."}
          ctaLabel="Add item"
          onCta={onAddNew}
          secondaryLabel={filter !== 'done' ? 'Upload PDF' : null}
          onSecondary={filter !== 'done' ? onImportPdf : null}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => <ItemCard key={item.id} item={item} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  )
}

function CourseChip({ active, onClick, color, label }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 999,
      fontSize: 12, fontWeight: 700,
      background: active ? (color || C.NAVY) : '#FFFFFF',
      color: active ? '#FFFFFF' : C.MUTED,
      border: `1px solid ${active ? (color || C.NAVY) : C.BORDER}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>{label}</button>
  )
}
