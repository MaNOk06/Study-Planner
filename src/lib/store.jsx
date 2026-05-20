import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { todayISO } from './dates'
import {
  isSyncConfigured, generateSyncCode, getStoredSyncCode, setStoredSyncCode,
  fetchFromServer, saveToServer, codeExistsOnServer, formatSyncCode,
} from './sync'

const STORAGE_KEY = 'martha_planner_v1'
const PREFS_KEY = 'martha_planner_prefs_v1'
const LAST_SYNCED_KEY = 'martha_planner_last_synced_v1'

const DEFAULT_PREFS = {
  hoursPerDay: 1.5,
  notifications: false,
  morningReminderTime: '07:00',
}

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
function getLastSynced() {
  try { return localStorage.getItem(LAST_SYNCED_KEY) || '' } catch { return '' }
}
function setLastSynced(iso) {
  try { localStorage.setItem(LAST_SYNCED_KEY, iso || '') }
  catch (e) {}
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [items, setItems] = useState(() => loadItems())
  const [prefs, setPrefsState] = useState(() => loadPrefs())
  const [syncCode, setSyncCodeState] = useState(() => getStoredSyncCode())
  const [syncStatus, setSyncStatus] = useState('idle') // idle | loading | saving | error | offline
  const [syncError, setSyncError] = useState('')

  // Track whether we've done the initial server fetch (to avoid push-before-pull races)
  const hasInitialFetched = useRef(false)
  // Debounce timer for saves
  const saveTimer = useRef(null)
  // Skip the next save (used after a fetch replaces local state — no need to push back)
  const skipNextSave = useRef(false)

  // --- Local persistence (always) ---
  useEffect(() => { saveItems(items) }, [items])
  useEffect(() => { savePrefs(prefs) }, [prefs])

  // --- Initial fetch from server on mount, if sync configured + code exists ---
  useEffect(() => {
    if (!isSyncConfigured()) {
      setSyncStatus('offline')
      hasInitialFetched.current = true
      return
    }
    if (!syncCode) {
      // No code yet, we wait for user to either generate or enter one
      hasInitialFetched.current = true
      return
    }
    pullFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pullFromServer = useCallback(async () => {
    if (!isSyncConfigured() || !syncCode) return
    setSyncStatus('loading')
    setSyncError('')
    try {
      const remote = await fetchFromServer(syncCode)
      if (remote && remote.updated_at) {
        const lastLocal = getLastSynced()
        // Server has data, and it's newer than our last sync → replace local
        if (!lastLocal || remote.updated_at > lastLocal) {
          skipNextSave.current = true
          setItems(remote.items || [])
          setPrefsState(p => ({ ...p, ...(remote.prefs || {}) }))
          setLastSynced(remote.updated_at)
        }
      } else {
        // No server row yet — push current local up
        await pushToServer(items, prefs)
      }
      setSyncStatus('idle')
      hasInitialFetched.current = true
    } catch (e) {
      setSyncStatus('error')
      setSyncError(e.message || 'Sync failed')
      hasInitialFetched.current = true
    }
  }, [syncCode, items, prefs])

  const pushToServer = useCallback(async (itemsArg, prefsArg) => {
    if (!isSyncConfigured() || !syncCode) return
    setSyncStatus('saving')
    try {
      const result = await saveToServer(syncCode, itemsArg, prefsArg)
      if (result?.updated_at) setLastSynced(result.updated_at)
      setSyncStatus('idle')
      setSyncError('')
    } catch (e) {
      setSyncStatus('error')
      setSyncError(e.message || 'Save failed')
    }
  }, [syncCode])

  // --- Debounced save to server on any state change ---
  useEffect(() => {
    if (!isSyncConfigured() || !syncCode || !hasInitialFetched.current) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      pushToServer(items, prefs)
    }, 1200)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [items, prefs, syncCode, pushToServer])

  // --- Refetch on window focus ---
  useEffect(() => {
    if (!isSyncConfigured() || !syncCode) return
    const onFocus = () => { pullFromServer() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [syncCode, pullFromServer])

  // --- Sync code management ---
  const generateAndUseNewCode = useCallback(async () => {
    const code = generateSyncCode()
    setStoredSyncCode(code)
    setSyncCodeState(code)
    setLastSynced('')
    // Push current local data up under the new code
    hasInitialFetched.current = true
    skipNextSave.current = false
    await pushToServer(items, prefs)
    return code
  }, [items, prefs, pushToServer])

  const useExistingCode = useCallback(async (rawInput) => {
    const formatted = formatSyncCode(rawInput)
    if (!formatted) throw new Error('Invalid code format. Must be 8 letters/numbers.')
    // Verify it exists on server
    const exists = await codeExistsOnServer(formatted)
    if (!exists) throw new Error('No data found for this code. Check it and try again.')
    setStoredSyncCode(formatted)
    setSyncCodeState(formatted)
    setLastSynced('')
    // Fetch and apply
    setSyncStatus('loading')
    try {
      const remote = await fetchFromServer(formatted)
      if (remote) {
        skipNextSave.current = true
        setItems(remote.items || [])
        setPrefsState(p => ({ ...p, ...(remote.prefs || {}) }))
        setLastSynced(remote.updated_at || '')
      }
      setSyncStatus('idle')
      hasInitialFetched.current = true
      return true
    } catch (e) {
      setSyncStatus('error')
      setSyncError(e.message)
      throw e
    }
  }, [])

  const disconnectSync = useCallback(() => {
    setStoredSyncCode(null)
    setSyncCodeState(null)
    setLastSynced('')
    setSyncStatus(isSyncConfigured() ? 'idle' : 'offline')
  }, [])

  // --- Standard CRUD (unchanged from before) ---
  const addItem = useCallback((item) => {
    const newItem = {
      id: `i_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      status: 'active', hoursDone: 0, createdAt: todayISO(),
      completedAt: null, lastWorkedOn: null, history: {},
      ...item,
    }
    setItems(prev => [...prev, newItem])
    return newItem
  }, [])

  const addManyItems = useCallback((arr) => {
    const stamped = arr.map((item, i) => ({
      id: `i_${Date.now()}_${i}_${Math.random().toString(36).slice(2,5)}`,
      status: 'active', hoursDone: 0, createdAt: todayISO(),
      completedAt: null, lastWorkedOn: null, history: {},
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

  const toggleHabitToday = useCallback((id) => {
    const day = todayISO()
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const history = { ...(i.history || {}) }
      history[day] = !history[day]
      return { ...i, history }
    }))
  }, [])

  const setPrefs = useCallback((updater) => {
    setPrefsState(typeof updater === 'function' ? updater : (p => ({ ...p, ...updater })))
  }, [])

  const clearAll = useCallback(() => { setItems([]) }, [])

  const exportData = useCallback(() => {
    return JSON.stringify({ items, prefs, syncCode, exportedAt: new Date().toISOString() }, null, 2)
  }, [items, prefs, syncCode])

  const importData = useCallback((json) => {
    try {
      const obj = typeof json === 'string' ? JSON.parse(json) : json
      if (Array.isArray(obj.items)) setItems(obj.items)
      if (obj.prefs) setPrefsState(p => ({ ...p, ...obj.prefs }))
      return true
    } catch { return false }
  }, [])

  const value = {
    items, prefs,
    addItem, addManyItems, updateItem, deleteItem,
    logHours, toggleDone, toggleHabitToday,
    setPrefs, clearAll, exportData, importData,
    // Sync API
    syncCode, syncStatus, syncError,
    isSyncConfigured: isSyncConfigured(),
    generateAndUseNewCode, useExistingCode, disconnectSync,
    pullFromServer,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
