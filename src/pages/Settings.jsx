import { useState } from 'react'
import { X, Bell, BellOff, Download, Upload, AlertCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import { C } from '../lib/constants'
import { Field, ModalShell, PrimaryBtn, GhostBtn } from '../components/Shared'
import { isNotificationSupported, requestNotificationPermission } from '../lib/notifications'

export default function Settings({ onClose }) {
  const { prefs, setPrefs, exportData, importData, clearAll, items } = useStore()
  const [hoursPerDay, setHoursPerDay] = useState(prefs.hoursPerDay)
  const [notifEnabled, setNotifEnabled] = useState(prefs.notifications)
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')

  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false)
      return
    }
    const result = await requestNotificationPermission()
    if (result === 'granted') {
      setNotifEnabled(true)
      setMessage('Notifications enabled. You\'ll see a focus reminder when you open the app.')
    } else if (result === 'denied') {
      setMessage('Notifications were blocked. Allow them in your browser settings to enable.')
    } else if (result === 'unsupported') {
      setMessage('Notifications aren\'t supported on this browser.')
    }
  }

  const handleSave = () => {
    setPrefs({ ...prefs, hoursPerDay: Number(hoursPerDay), notifications: notifEnabled })
    onClose()
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planner-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }

  const handleImportFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const ok = importData(text)
      if (ok) {
        setMessage('Data imported successfully.')
        setTimeout(() => onClose(), 1200)
      } else {
        setMessage('Could not parse this file.')
      }
    } catch (e) {
      setMessage('Import failed.')
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: C.NAVY }}>
          Settings
        </h2>
        <button onClick={onClose}><X size={22} style={{ color: C.NAVY }} /></button>
      </div>

      <div className="space-y-4">
        <Field
          label="Daily study hours per task"
          hint="Used to calculate 'latest start' dates. 1.5h is realistic when juggling 6 courses + life."
        >
          <input type="number" step="0.5" min="0.5" max="6"
            value={hoursPerDay}
            onChange={e => setHoursPerDay(Number(e.target.value))}
            className="field-input" />
        </Field>

        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: C.NAVY,
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5,
          }}>Notifications</p>
          <button onClick={handleToggleNotifications} style={{
            width: '100%', padding: '12px 14px',
            background: notifEnabled ? C.GREEN : '#FFFFFF',
            color: notifEnabled ? '#FFFFFF' : C.NAVY,
            border: `1px solid ${notifEnabled ? C.GREEN : C.BORDER}`,
            borderRadius: 10, fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="flex items-center gap-2">
              {notifEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
              {notifEnabled ? 'Notifications on' : 'Enable notifications'}
            </span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              {notifEnabled ? 'Tap to turn off' : 'Browser permission'}
            </span>
          </button>
          {!isNotificationSupported() && (
            <p style={{ fontSize: 11, color: C.MUTED, marginTop: 6 }}>
              Notifications not supported on this browser.
            </p>
          )}
          <p style={{ fontSize: 11, color: C.MUTED, marginTop: 6 }}>
            For best results: install this app to your home screen (tap Share → Add to Home Screen on iPhone, or "Install app" on Android Chrome).
          </p>
        </div>

        <div style={{ paddingTop: 8, borderTop: `1px dashed ${C.BORDER}` }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: C.NAVY,
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8,
          }}>Data ({items.length} items)</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleExport} style={{
              padding: '10px', background: C.TINT, color: C.NAVY,
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Download size={14}/> Backup
            </button>
            <label style={{
              padding: '10px', background: C.TINT, color: C.NAVY,
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer',
            }}>
              <Upload size={14}/> Restore
              <input type="file" accept=".json"
                style={{ display: 'none' }}
                onChange={e => handleImportFile(e.target.files[0])} />
            </label>
          </div>
          <p style={{ fontSize: 11, color: C.MUTED, marginTop: 6 }}>
            Your data lives only in this browser. Back up regularly.
          </p>
        </div>

        {message && (
          <div style={{
            background: '#FFFBEB', borderRadius: 8, padding: 10,
            fontSize: 12, color: '#78350F',
            display: 'flex', alignItems: 'flex-start', gap: 6,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {message}
          </div>
        )}

        <PrimaryBtn full onClick={handleSave}>Save settings</PrimaryBtn>
      </div>
    </ModalShell>
  )
}
