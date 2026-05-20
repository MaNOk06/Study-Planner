import { useMemo } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle2, Flame, BookOpen, Settings as SettingsIcon, Cloud, CloudOff } from 'lucide-react'
import { useStore } from '../lib/store'
import { getTodayFocus, getOverdue, getTodaysReadings, weeklyStats, reasonForFocus } from '../lib/focus'
import { COURSES, C } from '../lib/constants'
import { fmtShort } from '../lib/dates'
import { StatCard, EmptyState, SectionHeader } from '../components/Shared'
import ItemCard from '../components/ItemCard'

export default function Today({ onEdit, onAddNew, onImportPdf, onOpenSettings }) {
  const { items, prefs, syncCode, syncStatus, isSyncConfigured } = useStore()

  const focus = useMemo(() => getTodayFocus(items, prefs.hoursPerDay, 5), [items, prefs.hoursPerDay])
  const overdue = useMemo(() => getOverdue(items), [items])
  const todaysReadings = useMemo(() => getTodaysReadings(items), [items])
  const stats = useMemo(() => weeklyStats(items, prefs.hoursPerDay), [items, prefs.hoursPerDay])

  const today = new Date()
  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const hasItems = items.some(i => i.type !== 'habit' && i.type !== 'goal')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
      <header className="pb-4">
        <div className="flex items-baseline justify-between">
          <p style={{
            fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.GOLD, fontWeight: 700,
          }}>Y2 · Semester 2</p>
          <button onClick={onOpenSettings} aria-label="Settings" style={{
            color: C.NAVY, padding: 4, opacity: 0.6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {isSyncConfigured && (
              <span title={syncCode ? `Sync: ${syncStatus}` : 'Tap to set up sync'} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600,
                color: syncCode
                  ? (syncStatus === 'error' ? C.RED : syncStatus === 'idle' ? C.GREEN : C.GOLD)
                  : C.MUTED,
              }}>
                {syncCode ? <Cloud size={13}/> : <CloudOff size={13}/>}
              </span>
            )}
            <SettingsIcon size={18} />
          </button>
        </div>
        <h1 className="font-serif" style={{
          fontWeight: 600, fontSize: 38, color: C.NAVY,
          letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 6,
        }}>Stay ahead.</h1>
        <p style={{ fontSize: 14, color: '#4A5563', marginTop: 4 }}>{todayLabel}</p>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <StatCard
          label="Due this week" value={stats.thisWeek}
          accent={C.NAVY} icon={<Calendar size={14}/>}
        />
        <StatCard
          label="Hours outstanding" value={`${stats.totalHoursOutstanding.toFixed(1)}h`}
          accent={C.GOLD} icon={<Clock size={14}/>}
        />
        <StatCard
          label="Behind start"
          value={stats.behind}
          accent={stats.behind > 0 ? C.RED : C.GREEN}
          icon={stats.behind > 0 ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>}
        />
      </div>

      {/* Overdue banner */}
      {overdue.length > 0 && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 12, padding: 14, marginBottom: 16,
        }}>
          <div className="flex items-start gap-3">
            <Flame size={18} style={{ color: C.RED, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, color: '#7F1D1D', fontSize: 14 }}>
                {overdue.length} overdue
              </p>
              <p style={{ fontSize: 13, color: '#991B1B', marginTop: 2 }}>
                Clear these before adding new commitments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's readings */}
      {todaysReadings.length > 0 && (
        <>
          <SectionHeader kicker="Before class" title="Readings" />
          <div className="space-y-3 mb-5">
            {todaysReadings.map(item => (
              <ItemCard key={item.id} item={item} onEdit={onEdit} />
            ))}
          </div>
        </>
      )}

      {/* Focus */}
      <SectionHeader
        kicker="Today's focus"
        title={focus.length === 0 ? "You're clear" : "Where to spend your energy"}
      />

      {!hasItems ? (
        <EmptyState
          title="Nothing yet."
          body="Upload your syllabus to auto-detect quizzes, exams, and assignments — or add one manually."
          ctaLabel="Upload syllabus"
          onCta={onImportPdf}
          secondaryLabel="Add manually"
          onSecondary={onAddNew}
        />
      ) : focus.length === 0 ? (
        <div style={{
          background: '#FFFFFF', borderRadius: 14, padding: 24, textAlign: 'center',
          border: `1px solid ${C.BORDER}`,
        }}>
          <CheckCircle2 size={32} style={{ color: C.GREEN, margin: '0 auto 8px' }} />
          <p className="font-serif" style={{ fontSize: 20, color: C.NAVY, fontWeight: 600 }}>
            Caught up.
          </p>
          <p style={{ fontSize: 13, color: C.MUTED, marginTop: 4 }}>
            No urgent tasks. Use the time to get ahead.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {focus.map((item, idx) => (
            <div key={item.id}>
              {idx === 0 && (
                <p style={{
                  fontSize: 11, color: C.GOLD, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 6, marginLeft: 4,
                }}>
                  ★ Start here · {reasonForFocus(item, prefs.hoursPerDay)}
                </p>
              )}
              {idx === 1 && (
                <p style={{
                  fontSize: 11, color: C.MUTED, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 6, marginTop: 8, marginLeft: 4,
                }}>Then</p>
              )}
              <ItemCard item={item} onEdit={onEdit} />
            </div>
          ))}
        </div>
      )}

      {/* Verse footer */}
      {hasItems && (
        <div style={{
          marginTop: 24, padding: 16, background: C.PAPER,
          borderRadius: 12, borderLeft: `3px solid ${C.GOLD}`,
        }}>
          <p style={{ fontStyle: 'italic', fontSize: 14, color: '#4A5563', lineHeight: 1.6 }}>
            "Commit to the Lord whatever you do, and he will establish your plans." — Proverbs 16:3
          </p>
        </div>
      )}
    </div>
  )
}
