import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { todayISO } from './dates'

const STORAGE_KEY = 'martha_planner_v1'
const PREFS_KEY = 'martha_planner_prefs_v1'

const DEFAULT_PREFS = {
  hoursPerDay: 1.5,
  notifications: false,
  morningReminderTime: '07:00',
}

// Load from localStorage
function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveItems(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }
  catch (e) { console.error('Save failed', e) }
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch { return DEFAULT_PREFS }
}

function savePrefs(p) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) }
  catch (e) { console.error('Save prefs failed', e) }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [items, setItems] = useState(() => loadItems())
  const [prefs, setPrefs] = useState(() => loadPrefs())

  useEffect(() => saveItems(items), [items])
  useEffect(() => savePrefs(prefs), [prefs])

  const addItem = useCallback((item) => {
    const newItem = {
      id: `i_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      status: 'active',
      hoursDone: 0,
      createdAt: todayISO(),
      completedAt: null,
      lastWorkedOn: null,
      history: {},
      ...item,
    }
    setItems(prev => [...prev, newItem])
    return newItem
  }, [])

  const addManyItems = useCallback((arr) => {
    const stamped = arr.map((item, i) => ({
      id: `i_${Date.now()}_${i}_${Math.random().toString(36).slice(2,5)}`,
      status: 'active',
      hoursDone: 0,
      createdAt: todayISO(),
      completedAt: null,
      lastWorkedOn: null,
      history: {},
      ...item,
    }))
    setItems(prev => [...prev, ...stamped])
  }, [])

  const updateItem = useCallback((id, patch) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }, [])

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const logHours = useCallback((id, amount) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const newHours = Math.max(0, Math.min(i.estHours || 999, (i.hoursDone || 0) + amount))
      return { ...i, hoursDone: newHours, lastWorkedOn: todayISO() }
    }))
  }, [])

  const toggleDone = useCallback((id) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      return {
        ...i,
        status: i.status === 'done' ? 'active' : 'done',
        completedAt: i.status === 'done' ? null : todayISO(),
      }
    }))
  }, [])

  // For habits: toggle today's completion
  const toggleHabitToday = useCallback((id) => {
    const day = todayISO()
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const history = { ...(i.history || {}) }
      history[day] = !history[day]
      return { ...i, history }
    }))
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  const exportData = useCallback(() => {
    return JSON.stringify({ items, prefs, exportedAt: new Date().toISOString() }, null, 2)
  }, [items, prefs])

  const importData = useCallback((json) => {
    try {
      const obj = typeof json === 'string' ? JSON.parse(json) : json
      if (Array.isArray(obj.items)) setItems(obj.items)
      if (obj.prefs) setPrefs(p => ({ ...p, ...obj.prefs }))
      return true
    } catch { return false }
  }, [])

  const value = {
    items, prefs,
    addItem, addManyItems, updateItem, deleteItem,
    logHours, toggleDone, toggleHabitToday,
    setPrefs, clearAll, exportData, importData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
