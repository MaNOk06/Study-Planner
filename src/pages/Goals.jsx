import { useMemo } from 'react'
import { Check, Flame, Edit3, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { C } from '../lib/constants'
import { todayISO, addDays, parseDate } from '../lib/dates'
import { SectionHeader, EmptyState } from '../components/Shared'

export default function Goals({ onEdit, onAddNew }) {
  const { items, toggleHabitToday, deleteItem } = useStore()

  const habits = useMemo(() => items.filter(i => i.type === 'habit'), [items])
  const goals = useMemo(() => items.filter(i => i.type === 'goal'), [items])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
      <SectionHeader
        kicker="Personal"
        title="Goals & Habits"
      />

      {habits.length === 0 && goals.length === 0 ? (
        <EmptyState
          title="Set a goal."
          body="Track habits like daily quiet time, weekly workouts, or longer goals like 'finish wellness app by August'."
          ctaLabel="Add goal or habit"
          onCta={onAddNew}
        />
      ) : (
        <>
          {habits.length > 0 && (
            <>
              <h3 className="font-serif" style={{
                fontSize: 18, color: C.NAVY, fontWeight: 600,
                marginTop: 8, marginBottom: 12,
              }}>Daily habits</h3>
              <div className="space-y-3 mb-6">
                {habits.map(h => <HabitCard key={h.id} habit={h}
                  onToggle={() => toggleHabitToday(h.id)}
                  onEdit={() => onEdit(h.id)}
                  onDelete={() => { if (confirm('Delete this habit?')) deleteItem(h.id) }}
                />)}
              </div>
            </>
          )}

          {goals.length > 0 && (
            <>
              <h3 className="font-serif" style={{
                fontSize: 18, color: C.NAVY, fontWeight: 600,
                marginBottom: 12,
              }}>Bigger goals</h3>
              <div className="space-y-3">
                {goals.map(g => <GoalCard key={g.id} goal={g}
                  onEdit={() => onEdit(g.id)}
                  onDelete={() => { if (confirm('Delete this goal?')) deleteItem(g.id) }}
                />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function HabitCard({ habit, onToggle, onEdit, onDelete }) {
  const today = todayISO()
  const todayDone = !!(habit.history || {})[today]

  // Last 7 days streak
  const last7 = useMemo(() => {
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i)
      out.push({ date: d, done: !!(habit.history || {})[d] })
    }
    return out
  }, [habit.history, today])

  // Compute streak (consecutive days back from today that are done)
  const streak = useMemo(() => {
    let s = 0
    let cur = today
    while ((habit.history || {})[cur]) {
      s++
      cur = addDays(cur, -1)
    }
    return s
  }, [habit.history, today])

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: `1px solid ${C.BORDER}`, padding: '14px 16px',
    }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif" style={{
            fontSize: 17, color: C.NAVY, fontWeight: 600, lineHeight: 1.25,
          }}>{habit.title}</h3>
          {habit.notes && (
            <p style={{ fontSize: 12, color: C.MUTED, marginTop: 3 }}>{habit.notes}</p>
          )}
        </div>
        <button onClick={onToggle} aria-label="Mark today" style={{ flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `2px solid ${todayDone ? C.GREEN : '#C9BFA8'}`,
            background: todayDone ? C.GREEN : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {todayDone && <Check size={20} style={{ color: '#fff' }} strokeWidth={3} />}
          </div>
        </button>
      </div>

      {/* Streak + last 7 days */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5" style={{
          color: streak > 0 ? C.ORANGE : C.MUTED,
        }}>
          <Flame size={14} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {streak} day streak
          </span>
        </div>
        <div className="flex gap-1">
          {last7.map(d => (
            <div key={d.date} style={{
              width: 14, height: 14, borderRadius: 3,
              background: d.done ? C.GREEN : '#F0EADD',
            }} title={d.date} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px dashed #EFEAE0' }}>
        <button onClick={onEdit} style={{
          flex: 1, padding: 7, background: C.TINT, color: C.NAVY,
          borderRadius: 8, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}><Edit3 size={12}/> Edit</button>
        <button onClick={onDelete} style={{
          flex: 1, padding: 7, background: '#FEF2F2', color: C.RED,
          borderRadius: 8, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}><Trash2 size={12}/> Delete</button>
      </div>
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete }) {
  const targetDate = goal.dueDate
  const target = targetDate ? parseDate(targetDate) : null
  const targetLabel = target ? target.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: `1px solid ${C.BORDER}`, padding: '14px 16px',
    }}>
      <h3 className="font-serif" style={{
        fontSize: 17, color: C.NAVY, fontWeight: 600, lineHeight: 1.25,
      }}>{goal.title}</h3>
      {goal.notes && (
        <p style={{ fontSize: 13, color: '#374151', marginTop: 6, whiteSpace: 'pre-wrap' }}>
          {goal.notes}
        </p>
      )}
      {targetLabel && (
        <p style={{ fontSize: 12, color: C.MUTED, marginTop: 8 }}>
          Target: {targetLabel}
        </p>
      )}
      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px dashed #EFEAE0' }}>
        <button onClick={onEdit} style={{
          flex: 1, padding: 7, background: C.TINT, color: C.NAVY,
          borderRadius: 8, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}><Edit3 size={12}/> Edit</button>
        <button onClick={onDelete} style={{
          flex: 1, padding: 7, background: '#FEF2F2', color: C.RED,
          borderRadius: 8, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}><Trash2 size={12}/> Delete</button>
      </div>
    </div>
  )
}
