import { COURSES, CATEGORIES, C } from '../lib/constants'

export function CourseBadge({ courseCode }) {
  const c = COURSES[courseCode] || COURSES.PERSONAL
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px', borderRadius: 999,
      background: c.light, color: c.bg,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.bg }} />
      {c.short}
    </div>
  )
}

export function TypeBadge({ type }) {
  const cat = CATEGORIES[type] || CATEGORIES.other
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, color: C.MUTED,
    }}>
      <span style={{ fontSize: 12 }}>{cat.icon}</span>
      {cat.label}
    </span>
  )
}

export function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 12,
      padding: '12px 12px 14px', border: `1px solid ${C.BORDER}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: accent, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div className="font-serif" style={{ fontWeight: 600, fontSize: 24, color: C.NAVY, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

export function EmptyState({ title, body, ctaLabel, onCta, secondaryLabel, onSecondary }) {
  return (
    <div style={{
      textAlign: 'center', padding: '50px 20px',
      background: '#FFFFFF', borderRadius: 16, border: `1px dashed #D9CDB4`,
    }}>
      <div style={{
        fontSize: 28, marginBottom: 12, color: C.GOLD, fontFamily: 'Fraunces', fontWeight: 600,
      }}>✦</div>
      <p className="font-serif" style={{ fontSize: 22, color: C.NAVY, fontWeight: 600 }}>{title}</p>
      <p style={{ fontSize: 14, color: C.MUTED, marginTop: 6, maxWidth: 320, marginInline: 'auto' }}>{body}</p>
      <div className="flex gap-2 justify-center mt-5 flex-wrap">
        {onCta && (
          <button onClick={onCta} style={{
            padding: '10px 18px', background: C.NAVY, color: '#fff',
            borderRadius: 999, fontSize: 14, fontWeight: 600,
          }}>{ctaLabel}</button>
        )}
        {onSecondary && (
          <button onClick={onSecondary} style={{
            padding: '10px 18px', background: C.TINT, color: C.NAVY,
            borderRadius: 999, fontSize: 14, fontWeight: 600,
          }}>{secondaryLabel}</button>
        )}
      </div>
    </div>
  )
}

export function SectionHeader({ kicker, title, action }) {
  return (
    <div className="flex items-baseline justify-between mb-3 mt-5 first:mt-0">
      <div>
        {kicker && (
          <p style={{
            fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.GOLD, fontWeight: 700,
          }}>{kicker}</p>
        )}
        <h2 className="font-serif" style={{
          fontSize: 24, fontWeight: 600, color: C.NAVY,
          letterSpacing: '-0.01em', lineHeight: 1.1, marginTop: 2,
        }}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: C.NAVY,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        display: 'block', marginBottom: 5,
      }}>{label}</span>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: C.MUTED, marginTop: 5 }}>{hint}</p>
      )}
    </label>
  )
}

export function ModalShell({ children, onClose, sheet = false }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,20,30,0.55)',
      zIndex: 100, display: 'flex',
      alignItems: sheet ? 'flex-end' : 'center',
      justifyContent: 'center', padding: sheet ? 0 : 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 540, background: C.CREAM,
        borderRadius: sheet ? '20px 20px 0 0' : 18,
        maxHeight: '92vh', overflowY: 'auto',
        padding: '20px 20px 32px',
      }}>
        {sheet && (
          <div style={{
            width: 40, height: 4, background: '#D9CDB4',
            borderRadius: 99, margin: '0 auto 16px',
          }} />
        )}
        {children}
      </div>
    </div>
  )
}

export function PrimaryBtn({ children, onClick, full = false, disabled, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '12px 20px',
      background: disabled ? '#D5CCB6' : (danger ? C.RED : C.NAVY),
      color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
      width: full ? '100%' : 'auto',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</button>
  )
}

export function GhostBtn({ children, onClick, full = false }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 16px', background: C.TINT, color: C.NAVY,
      borderRadius: 10, fontWeight: 600, fontSize: 13,
      width: full ? '100%' : 'auto',
    }}>{children}</button>
  )
}
