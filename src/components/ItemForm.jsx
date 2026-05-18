import { useState } from 'react'
import { X, FileUp, ListPlus, PencilLine, Coffee } from 'lucide-react'
import { useStore } from '../lib/store'
import { COURSES, CATEGORIES, ACADEMIC_CATEGORIES, PERSONAL_CATEGORIES, C } from '../lib/constants'
import { todayISO, calcStartBy, fmtLong } from '../lib/dates'
import { Field, ModalShell, PrimaryBtn } from './Shared'

export default function ItemForm({ itemId, onClose, onImportPdf }) {
  const { items, prefs, addItem, addManyItems, updateItem } = useStore()
  const editing = itemId ? items.find(i => i.id === itemId) : null
  const [mode, setMode] = useState(editing ? 'single' : 'single')

  return (
    <ModalShell onClose={onClose} sheet>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: C.NAVY }}>
          {editing ? 'Edit item' : 'Add'}
        </h2>
        <button onClick={onClose}><X size={22} style={{ color: C.NAVY }} /></button>
      </div>

      {!editing && (
        <div className="flex gap-1 mb-4" style={{ background: '#EFEAE0', padding: 4, borderRadius: 10 }}>
          <TabBtn active={mode === 'single'} onClick={() => setMode('single')} icon={<PencilLine size={14}/>}>One item</TabBtn>
          <TabBtn active={mode === 'bulk'} onClick={() => setMode('bulk')} icon={<ListPlus size={14}/>}>Bulk</TabBtn>
          <TabBtn active={false} onClick={() => { onClose(); onImportPdf() }} icon={<FileUp size={14}/>}>PDF</TabBtn>
        </div>
      )}

      {mode === 'single' && (
        <SingleForm
          editing={editing}
          onSave={(item) => {
            if (editing) updateItem(editing.id, item)
            else addItem(item)
            onClose()
          }}
          hoursPerDay={prefs.hoursPerDay}
        />
      )}
      {mode === 'bulk' && !editing && (
        <BulkForm onSave={(arr) => { addManyItems(arr); onClose() }} />
      )}
    </ModalShell>
  )
}

function TabBtn({ active, onClick, children, icon }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-1.5" style={{
      flex: 1, padding: '8px 6px', borderRadius: 7, fontSize: 13, fontWeight: 600,
      background: active ? '#FFFFFF' : 'transparent',
      color: active ? C.NAVY : C.MUTED,
      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
    }}>{icon}{children}</button>
  )
}

function SingleForm({ editing, onSave, hoursPerDay }) {
  const isPersonal = editing && PERSONAL_CATEGORIES.includes(editing.type)
  const [section, setSection] = useState(isPersonal ? 'personal' : 'academic')
  const [course, setCourse] = useState(editing?.course || 'DE')
  const [type, setType] = useState(editing?.type || 'assignment')
  const [title, setTitle] = useState(editing?.title || '')
  const [dueDate, setDueDate] = useState(editing?.dueDate || '')
  const [estHours, setEstHours] = useState(editing?.estHours ?? (CATEGORIES[editing?.type || 'assignment']?.defaultHours || 2))
  const [notes, setNotes] = useState(editing?.notes || '')

  const handleSave = () => {
    if (!title.trim()) return alert('Add a title.')
    if (section === 'academic' && !dueDate) return alert('Pick a due date.')

    const newType = section === 'personal'
      ? (PERSONAL_CATEGORIES.includes(type) ? type : 'goal')
      : type

    onSave({
      type: newType,
      course: section === 'personal' ? 'PERSONAL' : course,
      title: title.trim(),
      dueDate: dueDate || todayISO(),
      estHours: Number(estHours) || 0,
      notes: notes.trim(),
    })
  }

  // Type options based on section
  const typeOptions = section === 'academic' ? ACADEMIC_CATEGORIES : PERSONAL_CATEGORIES
  // Reset type if it doesn't match section
  if (section === 'academic' && PERSONAL_CATEGORIES.includes(type)) setType('assignment')
  if (section === 'personal' && !PERSONAL_CATEGORIES.includes(type)) setType('goal')

  const previewStart = section === 'academic' && dueDate && estHours
    ? calcStartBy(dueDate, Number(estHours), hoursPerDay) : null

  return (
    <div className="space-y-3">
      {!editing && (
        <div className="flex gap-1" style={{ background: '#EFEAE0', padding: 3, borderRadius: 8 }}>
          <button onClick={() => setSection('academic')} style={{
            flex: 1, padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: section === 'academic' ? '#FFF' : 'transparent',
            color: section === 'academic' ? C.NAVY : C.MUTED,
          }}>Academic</button>
          <button onClick={() => setSection('personal')} style={{
            flex: 1, padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: section === 'personal' ? '#FFF' : 'transparent',
            color: section === 'personal' ? C.NAVY : C.MUTED,
          }}>Personal</button>
        </div>
      )}

      {section === 'academic' && (
        <Field label="Course">
          <select value={course} onChange={e => setCourse(e.target.value)} className="field-input">
            {Object.entries(COURSES).filter(([k]) => k !== 'PERSONAL').map(([k, v]) => (
              <option key={k} value={k}>{v.short} — {v.name}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Type">
        <select value={type} onChange={e => {
          const newType = e.target.value
          setType(newType)
          if (CATEGORIES[newType]?.defaultHours !== undefined && !editing) {
            setEstHours(CATEGORIES[newType].defaultHours)
          }
        }} className="field-input">
          {typeOptions.map(t => (
            <option key={t} value={t}>{CATEGORIES[t].icon} {CATEGORIES[t].label}</option>
          ))}
        </select>
      </Field>

      <Field label="Title">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder={section === 'academic' ? 'e.g. Problem Set 3' : 'e.g. Run 3x per week'}
          className="field-input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={section === 'academic' ? 'Due date' : 'Target date'}>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="field-input" />
        </Field>
        <Field label="Hours needed">
          <input type="number" step="0.5" min="0" value={estHours}
            onChange={e => setEstHours(e.target.value)} className="field-input" />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Chapters, group members, resources..." className="field-input"
          style={{ resize: 'vertical' }} />
      </Field>

      {previewStart && Number(estHours) > 0 && (
        <div style={{ background: '#FFFBEB', borderRadius: 10, padding: 12, fontSize: 13, color: '#78350F' }}>
          <Coffee size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/>
          <strong>Latest start: </strong>{fmtLong(previewStart)}
          <p style={{ fontSize: 11, color: '#92400E', marginTop: 4 }}>
            At {hoursPerDay}h/day. Change in Settings.
          </p>
        </div>
      )}

      <PrimaryBtn full onClick={handleSave}>
        {editing ? 'Save changes' : 'Add'}
      </PrimaryBtn>
    </div>
  )
}

function BulkForm({ onSave }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    setError('')
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const parsed = []
    const errors = []
    lines.forEach((line, i) => {
      const parts = line.split('|').map(p => p.trim())
      if (parts.length < 4) {
        errors.push(`Line ${i+1}: need 4+ parts (Course | Title | YYYY-MM-DD | Hours [| Type])`)
        return
      }
      const [c, n, d, h, ty] = parts
      const upper = c.toUpperCase()
      if (!COURSES[upper]) {
        errors.push(`Line ${i+1}: unknown course "${c}". Use: ${Object.keys(COURSES).filter(k => k !== 'PERSONAL').join(', ')}`)
        return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        errors.push(`Line ${i+1}: date must be YYYY-MM-DD`)
        return
      }
      const hrs = Number(h)
      if (isNaN(hrs) || hrs < 0) {
        errors.push(`Line ${i+1}: hours must be a positive number`)
        return
      }
      const typeKey = ty ? ty.toLowerCase().replace(/\s+/g, '') : 'assignment'
      const finalType = CATEGORIES[typeKey] ? typeKey : 'assignment'
      parsed.push({
        course: upper, title: n, dueDate: d,
        estHours: hrs, type: finalType, notes: '',
      })
    })
    if (errors.length) { setError(errors.join('\n')); return }
    if (parsed.length === 0) { setError('Add at least one line.'); return }
    onSave(parsed)
  }

  return (
    <div className="space-y-3">
      <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 12, fontSize: 12, color: '#374151' }}>
        <p style={{ fontWeight: 700, color: C.NAVY, marginBottom: 6 }}>Format (one per line):</p>
        <code style={{
          display: 'block', background: C.TINT, padding: 8, borderRadius: 6,
          fontSize: 11, color: C.NAVY,
        }}>COURSE | Title | YYYY-MM-DD | hours | type</code>
        <p style={{ marginTop: 8, color: C.MUTED }}>Courses: DE, CE, MS, AP, TM, LS2</p>
        <p style={{ color: C.MUTED, marginTop: 2 }}>Types: assignment, quiz, popquiz, midsem, final, exam, reading, lab, paper, project, presentation</p>
        <p style={{ marginTop: 6, color: C.MUTED }}>Example:</p>
        <code style={{
          display: 'block', background: C.TINT, padding: 8, borderRadius: 6,
          fontSize: 11, color: C.NAVY, marginTop: 4, whiteSpace: 'pre-line',
        }}>
{`DE | Problem Set 1 | 2026-05-30 | 4 | assignment
CE | Lab 1 | 2026-06-02 | 3 | lab
MS | Midsem | 2026-06-25 | 12 | midsem`}
        </code>
      </div>

      <Field label="Paste tasks">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          placeholder="DE | Problem Set 1 | 2026-05-30 | 4 | assignment"
          className="field-input"
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }} />
      </Field>

      {error && (
        <div style={{
          background: '#FEF2F2', borderRadius: 8, padding: 10,
          fontSize: 12, color: '#7F1D1D', whiteSpace: 'pre-wrap',
        }}>{error}</div>
      )}

      <PrimaryBtn full onClick={handleSave}>Add all</PrimaryBtn>
    </div>
  )
}
