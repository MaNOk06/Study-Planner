import { useState } from 'react'
import { X, Bell, BellOff, Download, Upload, AlertCircle, Cloud, CloudOff, Copy, Check, RefreshCw, Link2, Unlink } from 'lucide-react'
import { useStore } from '../lib/store'
import { C } from '../lib/constants'
import { Field, ModalShell, PrimaryBtn, GhostBtn } from '../components/Shared'
import { isNotificationSupported, requestNotificationPermission } from '../lib/notifications'

export default function Settings({ onClose }) {
  const {
    prefs, setPrefs, exportData, importData, items,
    syncCode, syncStatus, syncError, isSyncConfigured,
    generateAndUseNewCode, useExistingCode, disconnectSync, pullFromServer,
  } = useStore()

  const [hoursPerDay, setHoursPerDay] = useState(prefs.hoursPerDay)
  const [notifEnabled, setNotifEnabled] = useState(prefs.notifications)
  const [message, setMessage] = useState('')
  const [showEnterCode, setShowEnterCode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleToggleNotifications = async () => {
    if (notifEnabled) { setNotifEnabled(false); return }
    const result = await requestNotificationPermission()
    if (result === 'granted') {
      setNotifEnabled(true)
      setMessage('Notifications enabled.')
    } else if (result === 'denied') {
      setMessage('Notifications blocked. Allow them in browser settings.')
    } else {
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
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }

  const handleImportFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const ok = importData(text)
      if (ok) { setMessage('Imported.'); setTimeout(() => onClose(), 1200) }
      else { setMessage('Could not parse this file.') }
    } catch { setMessage('Import failed.') }
  }

  const handleGenerateCode = async () => {
    setBusy(true)
    try {
      const code = await generateAndUseNewCode()
      setMessage(`New code: ${code}. Type this on your other device to sync.`)
    } catch (e) {
      setMessage('Failed to generate code: ' + (e.message || 'unknown'))
    } finally { setBusy(false) }
  }

  const handleUseCode = async () => {
    setCodeError('')
    setBusy(true)
    try {
      await useExistingCode(codeInput)
      setMessage('Connected. Your data is now synced.')
      setShowEnterCode(false)
      setCodeInput('')
    } catch (e) {
      setCodeError(e.message || 'Could not connect to this code.')
    } finally { setBusy(false) }
  }

  const handleCopyCode = async () => {
    if (!syncCode) return
    try {
      await navigator.clipboard.writeText(syncCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { setMessage('Could not copy.') }
  }

  const handleDisconnect = () => {
    if (!confirm('Stop syncing? Your data will stay on this device but no longer sync with others.')) return
    disconnectSync()
    setMessage('Sync disconnected. Data stays local on this device.')
  }

  const statusColor = {
    idle: C.GREEN,
    loading: C.GOLD,
    saving: C.GOLD,
    error: C.RED,
    offline: C.MUTED,
  }[syncStatus] || C.MUTED

  const statusLabel = {
    idle: syncCode ? 'Synced' : 'Not syncing',
    loading: 'Loading...',
    saving: 'Saving...',
    error: 'Sync error',
    offline: 'Sync not configured',
  }[syncStatus] || ''

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: C.NAVY }}>
          Settings
        </h2>
        <button onClick={onClose}><X size={22} style={{ color: C.NAVY }} /></button>
      </div>

      <div className="space-y-4">
        {/* SYNC SECTION */}
        <div style={{ paddingBottom: 4 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: C.NAVY,
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8,
          }}>Sync across devices</p>

          {!isSyncConfigured ? (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 10, padding: 12, fontSize: 12, color: '#78350F',
            }}>
              <div className="flex items-start gap-2">
                <CloudOff size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 700 }}>Sync not set up.</p>
                  <p style={{ marginTop: 4 }}>To sync your laptop & phone, add your Supabase URL and anon key as env vars on Vercel. See the README's "Sync Setup" section.</p>
                </div>
              </div>
            </div>
          ) : !syncCode ? (
            <div style={{ background: '#FFFFFF', border: `1px solid ${C.BORDER}`, borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, color: C.NAVY, marginBottom: 10 }}>
                You're not syncing yet. Choose one:
              </p>
              <div className="space-y-2">
                <button onClick={handleGenerateCode} disabled={busy} style={{
                  width: '100%', padding: '12px', background: C.NAVY, color: '#fff',
                  borderRadius: 10, fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: busy ? 0.6 : 1,
                }}>
                  <Cloud size={16}/> Generate a new sync code (first device)
                </button>
                <button onClick={() => setShowEnterCode(true)} disabled={busy} style={{
                  width: '100%', padding: '12px', background: C.TINT, color: C.NAVY,
                  borderRadius: 10, fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Link2 size={16}/> I already have a code from another device
                </button>
              </div>
              <p style={{ fontSize: 11, color: C.MUTED, marginTop: 10, lineHeight: 1.5 }}>
                On your <strong>first</strong> device, generate a code. On your <strong>other</strong> device(s), enter that same code to share data.
              </p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: `1px solid ${C.BORDER}`, borderRadius: 12, padding: 14 }}>
              <div className="flex items-center gap-2 mb-2">
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: statusColor,
                }} />
                <span style={{ fontSize: 12, color: statusColor, fontWeight: 700, letterSpacing: '0.03em' }}>
                  {statusLabel}
                </span>
              </div>

              <p style={{ fontSize: 11, color: C.MUTED, marginBottom: 4 }}>Your sync code:</p>
              <div className="flex items-center gap-2 mb-3">
                <code style={{
                  flex: 1, padding: '10px 12px',
                  background: C.PAPER, borderRadius: 8,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 18, fontWeight: 700, color: C.NAVY, letterSpacing: '0.1em',
                  textAlign: 'center',
                }}>{syncCode}</code>
                <button onClick={handleCopyCode} style={{
                  padding: 10, background: copied ? C.GREEN : C.TINT,
                  color: copied ? '#fff' : C.NAVY,
                  borderRadius: 8, transition: 'all 0.2s',
                }} aria-label="Copy code">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <p style={{ fontSize: 11, color: C.MUTED, marginBottom: 12, lineHeight: 1.5 }}>
                Enter this same code on your other device to sync. Treat it like a password — anyone with the code can read your planner.
              </p>

              <div className="flex gap-2">
                <button onClick={() => pullFromServer()} disabled={syncStatus === 'loading'} style={{
                  flex: 1, padding: '8px', background: C.TINT, color: C.NAVY,
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <RefreshCw size={13} className={syncStatus === 'loading' ? 'animate-spin' : ''} /> Refresh
                </button>
                <button onClick={handleDisconnect} style={{
                  flex: 1, padding: '8px', background: '#FEF2F2', color: C.RED,
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <Unlink size={13}/> Disconnect
                </button>
              </div>

              {syncError && (
                <p style={{ fontSize: 11, color: C.RED, marginTop: 8 }}>{syncError}</p>
              )}
            </div>
          )}

          {showEnterCode && (
            <div style={{
              background: '#FFFFFF', border: `1px solid ${C.BORDER}`,
              borderRadius: 12, padding: 14, marginTop: 10,
            }}>
              <p style={{ fontSize: 12, color: C.NAVY, fontWeight: 600, marginBottom: 8 }}>
                Enter the 8-character code from your other device:
              </p>
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleUseCode() }}
                placeholder="XXXX-XXXX"
                className="field-input"
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase' }}
                maxLength={9}
              />
              {codeError && (
                <p style={{ fontSize: 11, color: C.RED, marginTop: 6 }}>{codeError}</p>
              )}
              <div className="flex gap-2 mt-3">
                <GhostBtn full onClick={() => { setShowEnterCode(false); setCodeInput(''); setCodeError('') }}>Cancel</GhostBtn>
                <PrimaryBtn full onClick={handleUseCode} disabled={busy}>
                  {busy ? 'Connecting...' : 'Connect'}
                </PrimaryBtn>
              </div>
            </div>
          )}
        </div>

        <div style={{ paddingTop: 8, borderTop: `1px dashed ${C.BORDER}` }}>
          <Field label="Daily study hours per task"
            hint="Used to calculate 'latest start' dates. 1.5h is realistic when juggling 6 courses.">
            <input type="number" step="0.5" min="0.5" max="6"
              value={hoursPerDay}
              onChange={e => setHoursPerDay(Number(e.target.value))}
              className="field-input" />
          </Field>
        </div>

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
          </button>
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
        </div>

        {message && (
          <div style={{
            background: '#FFFBEB', borderRadius: 8, padding: 10,
            fontSize: 12, color: '#78350F',
            display: 'flex', alignItems: 'flex-start', gap: 6,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{message}</span>
          </div>
        )}

        <PrimaryBtn full onClick={handleSave}>Save settings</PrimaryBtn>
      </div>
    </ModalShell>
  )
}
