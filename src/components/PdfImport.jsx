import { useState } from 'react'
import { X, Upload, Loader2, FileText, Check, Sparkles, AlertCircle } from 'lucide-react'
import { extractTextFromPDF, findCandidatesInText } from '../lib/pdfParser'
import { useStore } from '../lib/store'
import { COURSES, CATEGORIES, ACADEMIC_CATEGORIES, C } from '../lib/constants'
import { fmtShort, todayISO } from '../lib/dates'
import { Field, ModalShell, PrimaryBtn, GhostBtn } from './Shared'

export default function PdfImport({ onClose }) {
  const { addManyItems } = useStore()
  const [stage, setStage] = useState('upload')
  const [defaultCourse, setDefaultCourse] = useState('DE')
  const [candidates, setCandidates] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [setupHint, setSetupHint] = useState(false)
  const [parserUsed, setParserUsed] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setFileName(file.name)
    setError('')
    setSetupHint(false)

    setStage('extracting')
    let text
    try {
      text = await extractTextFromPDF(file)
    } catch (e) {
      setError('Could not read PDF. May be scanned or password-protected.')
      setStage('upload')
      return
    }

    if (!text || text.trim().length < 50) {
      setError('PDF appears empty. Try a text-based PDF, or use Bulk paste.')
      setStage('upload')
      return
    }

    setStage('analyzing')
    try {
      const resp = await fetch('/api/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (resp.status === 503) {
        const heuristicItems = findCandidatesInText(text)
        if (heuristicItems.length === 0) {
          setError('No items found. Set up AI parsing (see README) or use Bulk paste.')
          setStage('upload')
          return
        }
        setCandidates(heuristicItems.map(c => ({ ...c, course: defaultCourse })))
        setParserUsed('heuristic')
        setSetupHint(true)
        setStage('review')
        return
      }

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        const heuristicItems = findCandidatesInText(text)
        if (heuristicItems.length === 0) {
          setError(`AI parser failed (${errData.message || resp.status}).`)
          setStage('upload')
          return
        }
        setCandidates(heuristicItems.map(c => ({ ...c, course: defaultCourse })))
        setParserUsed('heuristic')
        setError(`AI parser issue — showing pattern matches. ${errData.message || ''}`)
        setStage('review')
        return
      }

      const data = await resp.json()
      const aiItems = data.items || []

      if (aiItems.length === 0) {
        setError('Claude found no tasks in this PDF. Try Bulk paste.')
        setStage('upload')
        return
      }

      const cands = aiItems.map((it, idx) => ({
        id: `ai_${idx}`,
        rawDate: it.dueDate,
        isoDate: it.dueDate || todayISO(),
        title: it.title,
        type: it.type,
        context: it.notes || '',
        estHours: it.estHours,
        course: defaultCourse,
        selected: !!it.dueDate,
      }))
      setCandidates(cands)
      setParserUsed('ai')
      setStage('review')
    } catch (e) {
      const heuristicItems = findCandidatesInText(text)
      if (heuristicItems.length === 0) {
        setError('Network error. Check connection and try again.')
        setStage('upload')
        return
      }
      setCandidates(heuristicItems.map(c => ({ ...c, course: defaultCourse })))
      setParserUsed('heuristic')
      setError('Could not reach AI. Showing pattern matches.')
      setStage('review')
    }
  }

  const toggleSelected = (id) =>
    setCandidates(p => p.map(c => c.id === id ? { ...c, selected: !c.selected } : c))
  const updateCandidate = (id, patch) =>
    setCandidates(p => p.map(c => c.id === id ? { ...c, ...patch } : c))

  const handleImport = () => {
    const selected = candidates.filter(c => c.selected)
    if (selected.length === 0) return alert('Select at least one item.')
    const items = selected.map(c => ({
      title: c.title,
      type: c.type,
      course: c.course,
      dueDate: c.isoDate,
      estHours: c.estHours,
      notes: c.context || (parserUsed === 'ai' ? 'Detected by Claude.' : 'Auto-detected.'),
    }))
    addManyItems(items)
    onClose()
  }

  return (
    <ModalShell onClose={onClose} sheet>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: C.NAVY }}>
          {stage === 'upload' ? 'Import from PDF' :
           stage === 'extracting' ? 'Reading PDF...' :
           stage === 'analyzing' ? 'Claude is reading...' :
           'Review & confirm'}
        </h2>
        <button onClick={onClose}><X size={22} style={{ color: C.NAVY }} /></button>
      </div>

      {stage === 'upload' && (
        <div className="space-y-4">
          <div style={{
            background: C.PAPER, borderRadius: 12, padding: 14,
            borderLeft: `3px solid ${C.GOLD}`,
          }}>
            <div className="flex items-start gap-2">
              <Sparkles size={16} style={{ color: C.GOLD, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, color: C.NAVY, fontWeight: 600 }}>Powered by Claude</p>
                <p style={{ fontSize: 12, color: C.MUTED, marginTop: 2, lineHeight: 1.5 }}>
                  Upload your syllabus — Claude reads it and pulls out assignments, quizzes, exams, readings with their dates. You confirm what to add.
                </p>
              </div>
            </div>
          </div>

          <Field label="Default course (for detected items)">
            <select value={defaultCourse} onChange={e => setDefaultCourse(e.target.value)} className="field-input">
              {Object.entries(COURSES).filter(([k]) => k !== 'PERSONAL').map(([k, v]) => (
                <option key={k} value={k}>{v.short} — {v.name}</option>
              ))}
            </select>
          </Field>

          <label htmlFor="pdf-input" style={{
            display: 'block', textAlign: 'center', padding: '40px 20px',
            border: '2px dashed #D9CDB4', borderRadius: 14,
            background: '#FFFFFF', cursor: 'pointer',
          }}>
            <Upload size={32} style={{ margin: '0 auto 12px', color: C.GOLD }} />
            <p className="font-serif" style={{ fontSize: 18, color: C.NAVY, fontWeight: 600 }}>
              Tap to upload a PDF
            </p>
            <p style={{ fontSize: 12, color: C.MUTED, marginTop: 4 }}>
              Best with text-based PDFs (not scanned images)
            </p>
            <input id="pdf-input" type="file" accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </label>

          {error && (
            <div style={{
              background: '#FEF2F2', borderRadius: 8, padding: 10,
              fontSize: 12, color: '#7F1D1D',
            }}>{error}</div>
          )}
        </div>
      )}

      {(stage === 'extracting' || stage === 'analyzing') && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: C.NAVY }} />
          <p className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: C.NAVY }}>
            {stage === 'extracting' ? 'Reading the file...' : 'Claude is identifying tasks...'}
          </p>
          <p style={{ fontSize: 12, color: C.MUTED, marginTop: 6 }}>
            {stage === 'extracting' ? fileName : 'Usually takes 5–15 seconds.'}
          </p>
        </div>
      )}

      {stage === 'review' && (
        <div className="space-y-3">
          {setupHint && (
            <div style={{
              background: '#FFFBEB', borderRadius: 10, padding: 12,
              fontSize: 12, color: '#78350F', border: '1px solid #FDE68A',
            }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 700 }}>AI parser not configured — using basic pattern matching.</p>
                  <p style={{ marginTop: 4 }}>For accurate results, add an ANTHROPIC_API_KEY env var on Vercel. See README.</p>
                </div>
              </div>
            </div>
          )}

          {error && !setupHint && (
            <div style={{
              background: '#FEF3C7', borderRadius: 8, padding: 10,
              fontSize: 12, color: '#78350F',
            }}>{error}</div>
          )}

          <div style={{
            background: parserUsed === 'ai' ? '#ECFDF5' : '#FFFBEB',
            borderRadius: 10, padding: 12, fontSize: 13,
            color: parserUsed === 'ai' ? '#065F46' : '#78350F',
          }}>
            {parserUsed === 'ai' ? (
              <><Sparkles size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/>
              Claude found <strong>{candidates.length}</strong> tasks. Edit titles/dates/courses inline, then confirm.</>
            ) : (
              <><FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/>
              <strong>{candidates.length}</strong> possible items found. Many may be false positives.</>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }} className="space-y-2">
            {candidates.map(c => (
              <CandidateRow
                key={c.id}
                cand={c}
                onToggle={() => toggleSelected(c.id)}
                onUpdate={(patch) => updateCandidate(c.id, patch)}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <GhostBtn full onClick={() => { setStage('upload'); setCandidates([]); setSetupHint(false) }}>Back</GhostBtn>
            <PrimaryBtn full onClick={handleImport}>
              Add {candidates.filter(c => c.selected).length} items
            </PrimaryBtn>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

function CandidateRow({ cand, onToggle, onUpdate }) {
  return (
    <div style={{
      background: cand.selected ? '#FFFFFF' : '#F5EFE0',
      border: `1px solid ${cand.selected ? '#E5DCC5' : 'transparent'}`,
      borderRadius: 10, padding: 12,
      opacity: cand.selected ? 1 : 0.5,
    }}>
      <div className="flex items-start gap-2">
        <button onClick={onToggle} style={{ flexShrink: 0, marginTop: 2 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5,
            border: `2px solid ${cand.selected ? '#1E3A5F' : '#C9BFA8'}`,
            background: cand.selected ? '#1E3A5F' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cand.selected && <Check size={14} style={{ color: '#fff' }} strokeWidth={3} />}
          </div>
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <input
            value={cand.title}
            onChange={e => onUpdate({ title: e.target.value })}
            className="field-input"
            style={{ padding: '6px 8px', fontSize: 13 }}
          />

          <div className="grid grid-cols-3 gap-1.5">
            <select value={cand.course} onChange={e => onUpdate({ course: e.target.value })} className="field-input" style={{ padding: '6px 4px', fontSize: 11 }}>
              {Object.entries(COURSES).filter(([k]) => k !== 'PERSONAL').map(([k, v]) => (
                <option key={k} value={k}>{v.short}</option>
              ))}
            </select>
            <select value={cand.type} onChange={e => onUpdate({ type: e.target.value, estHours: CATEGORIES[e.target.value]?.defaultHours || cand.estHours })} className="field-input" style={{ padding: '6px 4px', fontSize: 11 }}>
              {ACADEMIC_CATEGORIES.map(t => (
                <option key={t} value={t}>{CATEGORIES[t].label}</option>
              ))}
            </select>
            <input
              type="number" min="0" step="0.5" value={cand.estHours}
              onChange={e => onUpdate({ estHours: Number(e.target.value) })}
              className="field-input" style={{ padding: '6px 4px', fontSize: 11 }}
            />
          </div>

          <input
            type="date"
            value={cand.isoDate}
            onChange={e => onUpdate({ isoDate: e.target.value })}
            className="field-input"
            style={{ padding: '4px 6px', fontSize: 11 }}
          />

          {cand.context && (
            <p style={{ fontSize: 10, color: C.MUTED, fontStyle: 'italic' }} title={cand.context}>
              "{cand.context.slice(0, 60)}..."
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
