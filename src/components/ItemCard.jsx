import { useState } from 'react'
import { Circle, CheckCircle2, AlertTriangle, Target, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { COURSES, CATEGORIES, C } from '../lib/constants'
import { daysUntil, calcStartBy, fmtShort, fmtLong } from '../lib/dates'
import { useStore } from '../lib/store'
import { CourseBadge } from './Shared'

export default function ItemCard({ item, onEdit }) {
  const { prefs, logHours, toggleDone, deleteItem } = useStore()
  const [expanded, setExpanded] = useState(false)
  const course = COURSES[item.course] || COURSES.PERSONAL
  const cat = CATEGORIES[item.type] || CATEGORIES.other

  const days = daysUntil(item.dueDate)
  const startByISO = calcStartBy(item.dueDate, item.estHours || 1, prefs.hoursPerDay)
  const daysToStart = daysUntil(startByISO)
  const isDone = item.status === 'done'
  const progress = item.estHours > 0 ? Math.min(100, ((item.hoursDone || 0) / item.estHours) * 100) : 0

  // Urgency text + color
  let urgencyColor = '#4A5563'
  let urgencyText = ''
  if (isDone) {
    urgencyColor = C.GREEN
    urgencyText = 'Done'
  } else if (days < 0) {
    urgencyColor = C.RED
    urgencyText = `${Math.abs(days)}d overdue`
  } else if (days === 0) {
    urgencyColor = C.RED
    urgencyText = 'Due TODAY'
  } else if (days === 1) {
    urgencyColor = C.ORANGE
    urgencyText = 'Due tomorrow'
  } else if (days <= 3) {
    urgencyColor = C.ORANGE
    urgencyText = `${days} days left`
  } else if (days <= 7) {
    urgencyColor = C.GOLD
    urgencyText = `${days} days left`
  } else {
    urgencyColor = '#4A5563'
    urgencyText = `${days} days left`
  }

  const shouldStartWarning = !isDone && daysToStart < 0 && (item.hoursDone || 0) === 0

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: shouldStartWarning ? '1px solid #FECACA' : `1px solid ${C.BORDER}`,
      overflow: 'hidden', opacity: isDone ? 0.65 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ padding: '14px 16px 12px' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <CourseBadge courseCode={item.course} />
          <span style={{
            fontSize: 12, fontWeight: 700, color: urgencyColor,
            whiteSpace: 'nowrap',
          }}>{urgencyText}</span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif" style={{
              fontWeight: 600, fontSize: 17, color: C.NAVY,
              lineHeight: 1.25,
              textDecoration: isDone ? 'line-through' : 'none',
            }}>{item.title}</h3>
            <p style={{ fontSize: 12, color: C.MUTED, marginTop: 3 }}>
              <span style={{ marginRight: 4 }}>{cat.icon}</span>
              {cat.label} · Due {fmtShort(item.dueDate)}
            </p>
          </div>
          <button onClick={() => toggleDone(item.id)} style={{ flexShrink: 0, padding: 4 }}>
            {isDone
              ? <CheckCircle2 size={22} style={{ color: C.GREEN }} />
              : <Circle size={22} style={{ color: '#C9BFA8' }} />}
          </button>
        </div>

        {/* Progress */}
        {!isDone && item.estHours > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: C.MUTED, marginBottom: 4,
            }}>
              <span>{(item.hoursDone || 0).toFixed(1)}h / {item.estHours}h</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ background: '#F0EADD', borderRadius: 999, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: progress >= 100 ? C.GREEN : course.bg,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Start-by warning */}
        {shouldStartWarning && (
          <div style={{
            marginTop: 12, padding: '8px 10px', background: '#FEF2F2',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={13} style={{ color: C.RED, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#7F1D1D', fontWeight: 600 }}>
              Should have started by {fmtShort(startByISO)}. Start today.
            </p>
          </div>
        )}

        {!shouldStartWarning && !isDone && daysToStart >= 0 && daysToStart <= 1 && (item.hoursDone || 0) === 0 && (
          <div style={{
            marginTop: 12, padding: '8px 10px', background: '#FFFBEB',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Target size={13} style={{ color: C.GOLD, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#78350F', fontWeight: 600 }}>
              Start {daysToStart === 0 ? 'today' : 'tomorrow'} to stay on track.
            </p>
          </div>
        )}

        {/* Quick actions */}
        {!isDone && (
          <div className="flex gap-1.5 mt-3">
            {item.estHours > 0 && (
              <>
                <button onClick={() => logHours(item.id, 0.5)} style={{
                  flex: 1, padding: 8, background: course.tint, color: course.bg,
                  borderRadius: 8, fontSize: 12, fontWeight: 700,
                }}>+30 min</button>
                <button onClick={() => logHours(item.id, 1)} style={{
                  flex: 1, padding: 8, background: course.light, color: course.bg,
                  borderRadius: 8, fontSize: 12, fontWeight: 700,
                }}>+1 hour</button>
              </>
            )}
            <button onClick={() => setExpanded(!expanded)} style={{
              padding: '8px 12px', background: C.TINT, color: C.MUTED,
              borderRadius: 8, fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>{expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #EFEAE0' }}>
            <Detail label="Course" value={course.name} />
            <Detail label="Type" value={cat.label} />
            <Detail label="Due" value={fmtLong(item.dueDate)} />
            {item.estHours > 0 && <Detail label="Estimated" value={`${item.estHours} hours`} />}
            <Detail label="Latest start" value={fmtLong(startByISO)} />
            {item.lastWorkedOn && <Detail label="Last worked on" value={fmtShort(item.lastWorkedOn)} />}
            {item.notes && (
              <div style={{ marginTop: 8 }}>
                <p style={{
                  fontSize: 11, color: C.MUTED, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>Notes</p>
                <p style={{ fontSize: 13, color: '#374151', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {item.notes}
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => onEdit(item.id)} style={{
                flex: 1, padding: 8, background: C.TINT,
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                color: C.NAVY,
              }}>
                <Edit3 size={13} /> Edit
              </button>
              <button onClick={() => { if (confirm('Delete this item?')) deleteItem(item.id) }} style={{
                flex: 1, padding: 8, background: '#FEF2F2', color: C.RED,
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '4px 0', fontSize: 13,
    }}>
      <span style={{
        color: C.MUTED, fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>{label}</span>
      <span style={{ color: C.NAVY, fontWeight: 500 }}>{value}</span>
    </div>
  )
}
