import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { COURSES, CATEGORIES, C } from '../lib/constants'
import { todayISO, parseDate, addDays, fmtShort, fmtLong, daysUntil } from '../lib/dates'
import { SectionHeader, EmptyState } from '../components/Shared'
import ItemCard from '../components/ItemCard'

export default function Week({ onEdit, onAddNew }) {
  const { items } = useStore()
  const [weekStart, setWeekStart] = useState(() => {
    // Monday of this week
    const d = new Date()
    d.setHours(0,0,0,0)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0,10)
  })

  const days = useMemo(() => [0,1,2,3,4,5,6].map(i => addDays(weekStart, i)), [weekStart])

  // Group items by day
  const itemsByDay = useMemo(() => {
    const map = {}
    days.forEach(d => map[d] = [])
    items.forEach(item => {
      if (item.type === 'habit' || item.type === 'goal') return
      if (map[item.dueDate]) map[item.dueDate].push(item)
    })
    return map
  }, [items, days])

  const totalItems = Object.values(itemsByDay).reduce((s, arr) => s + arr.length, 0)
  const today = todayISO()

  const prevWeek = () => setWeekStart(addDays(weekStart, -7))
  const nextWeek = () => setWeekStart(addDays(weekStart, 7))
  const thisWeek = () => {
    const d = new Date()
    d.setHours(0,0,0,0)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    setWeekStart(d.toISOString().slice(0,10))
  }

  const weekLabel = `${fmtShort(days[0])} – ${fmtShort(days[6])}`

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
      <SectionHeader
        kicker="Week view"
        title="By day"
      />

      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2 mb-4" style={{
        background: '#FFFFFF', borderRadius: 12, padding: '8px 10px', border: `1px solid ${C.BORDER}`,
      }}>
        <button onClick={prevWeek} style={{ padding: 6, color: C.NAVY }}>
          <ChevronLeft size={20}/>
        </button>
        <button onClick={thisWeek} className="font-serif" style={{
          fontSize: 16, fontWeight: 600, color: C.NAVY, flex: 1, textAlign: 'center',
        }}>
          {weekLabel}
        </button>
        <button onClick={nextWeek} style={{ padding: 6, color: C.NAVY }}>
          <ChevronRight size={20}/>
        </button>
      </div>

      {totalItems === 0 ? (
        <EmptyState
          title="Nothing this week."
          body="No academic items scheduled. Use this time to get ahead or rest."
          ctaLabel="Add an item"
          onCta={onAddNew}
        />
      ) : (
        <div className="space-y-4">
          {days.map(day => {
            const list = itemsByDay[day] || []
            const isToday = day === today
            const isPast = daysUntil(day) < 0
            return (
              <div key={day}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 8,
                  paddingBottom: 6, marginBottom: 8,
                  borderBottom: `1px dashed ${C.BORDER}`,
                }}>
                  <span className="font-serif" style={{
                    fontSize: 18, fontWeight: 600,
                    color: isToday ? C.GOLD : (isPast ? C.MUTED : C.NAVY),
                  }}>{fmtShort(day)}</span>
                  {isToday && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#fff', background: C.GOLD,
                      padding: '2px 8px', borderRadius: 999, letterSpacing: '0.05em',
                    }}>TODAY</span>
                  )}
                  <span style={{ fontSize: 12, color: C.MUTED, marginLeft: 'auto' }}>
                    {list.length === 0 ? 'Free' : `${list.length} item${list.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                {list.length === 0 ? (
                  <p style={{
                    fontSize: 13, color: C.MUTED, fontStyle: 'italic',
                    paddingLeft: 4, opacity: 0.6,
                  }}>—</p>
                ) : (
                  <div className="space-y-2">
                    {list.map(item => <ItemCard key={item.id} item={item} onEdit={onEdit} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
