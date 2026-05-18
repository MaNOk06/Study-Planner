import { useState, useEffect } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { CalendarDays, Layers, Sparkles, Target, Settings as SettingsIcon, Plus } from 'lucide-react'
import { C } from './lib/constants'
import Today from './pages/Today'
import Week from './pages/Week'
import AllItems from './pages/AllItems'
import Goals from './pages/Goals'
import Settings from './pages/Settings'
import ItemForm from './components/ItemForm'
import PdfImport from './components/PdfImport'
import { notifyTodaysFocus } from './lib/notifications'
import { getTodayFocus } from './lib/focus'

const TABS = [
  { id: 'today', label: 'Today', Icon: Sparkles, Page: Today },
  { id: 'week',  label: 'Week',  Icon: CalendarDays, Page: Week },
  { id: 'all',   label: 'All',   Icon: Layers, Page: AllItems },
  { id: 'goals', label: 'Goals', Icon: Target, Page: Goals },
]

function Shell() {
  const [tab, setTab] = useState('today')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showPdfImport, setShowPdfImport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { items, prefs } = useStore()

  // Show notification on app load if enabled
  useEffect(() => {
    if (prefs.notifications && Notification?.permission === 'granted') {
      const focus = getTodayFocus(items, prefs.hoursPerDay)
      if (focus.length > 0) {
        // small delay to avoid jarring
        setTimeout(() => notifyTodaysFocus(focus), 1500)
      }
    }
  }, []) // run once on mount

  const ActivePage = TABS.find(t => t.id === tab).Page

  const openEdit = (id) => { setEditingId(id); setShowForm(true) }
  const openAdd = () => { setEditingId(null); setShowForm(true) }

  return (
    <div className="min-h-screen pb-24 safe-bottom" style={{ background: C.CREAM }}>
      <ActivePage
        onEdit={openEdit}
        onAddNew={openAdd}
        onImportPdf={() => setShowPdfImport(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#FFFFFFEE', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.BORDER}`, zIndex: 20,
      }} className="safe-bottom">
        <div className="max-w-3xl mx-auto px-2 grid grid-cols-4 gap-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-col items-center justify-center py-2.5 transition-all"
              style={{
                color: tab === id ? C.NAVY : C.MUTED,
                fontWeight: tab === id ? 700 : 500,
              }}>
              <Icon size={20} strokeWidth={tab === id ? 2.5 : 2} />
              <span className="text-[11px] mt-0.5 tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Floating add button */}
      <button
        onClick={openAdd}
        aria-label="Add item"
        style={{
          position: 'fixed', bottom: 84, right: 20, width: 56, height: 56, borderRadius: '50%',
          background: C.NAVY, color: '#fff', boxShadow: '0 8px 24px rgba(30,58,95,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25,
        }}>
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {showForm && (
        <ItemForm
          itemId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null) }}
          onImportPdf={() => { setShowForm(false); setShowPdfImport(true) }}
        />
      )}
      {showPdfImport && (
        <PdfImport onClose={() => setShowPdfImport(false)} />
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
