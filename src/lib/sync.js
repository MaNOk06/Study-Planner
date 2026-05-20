// Cross-device sync via Supabase.
// Architecture: localStorage is the local cache; Supabase is the source of truth.
// On boot: fetch from server, replace local if newer.
// On change: debounced push to server.
// On window focus: refetch.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SYNC_CODE_KEY = 'martha_planner_sync_code_v1'
const TABLE = 'planner_data'

// Chars excluded: 0, O, 1, I, L (visually ambiguous)
const SYNC_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

let _client = null
function getClient() {
  if (!isSyncConfigured()) return null
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  }
  return _client
}

export function isSyncConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

// Generate human-friendly 8-char code displayed as XXXX-XXXX
export function generateSyncCode() {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += SYNC_CHARS[Math.floor(Math.random() * SYNC_CHARS.length)]
  }
  return code.slice(0, 4) + '-' + code.slice(4)
}

export function formatSyncCode(raw) {
  // Normalize input: uppercase, strip non-alphanumerics, validate, format
  const clean = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length !== 8) return null
  // Validate every char is in our allowed set (no 0/O/1/I/L)
  for (const c of clean) {
    if (!SYNC_CHARS.includes(c)) return null
  }
  return clean.slice(0, 4) + '-' + clean.slice(4)
}

export function getStoredSyncCode() {
  try { return localStorage.getItem(SYNC_CODE_KEY) } catch { return null }
}

export function setStoredSyncCode(code) {
  try {
    if (code) localStorage.setItem(SYNC_CODE_KEY, code)
    else localStorage.removeItem(SYNC_CODE_KEY)
  } catch (e) { console.error('sync code save failed', e) }
}

// Fetch row from server. Returns { items, prefs, updated_at } or null if not found.
export async function fetchFromServer(code) {
  const client = getClient()
  if (!client || !code) return null
  const { data, error } = await client
    .from(TABLE)
    .select('items, prefs, updated_at')
    .eq('sync_code', code)
    .maybeSingle()
  if (error) {
    console.error('Supabase fetch error:', error)
    throw error
  }
  return data
}

// Upsert row on server.
export async function saveToServer(code, items, prefs) {
  const client = getClient()
  if (!client || !code) return null
  const payload = {
    sync_code: code,
    items: items || [],
    prefs: prefs || {},
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client
    .from(TABLE)
    .upsert(payload, { onConflict: 'sync_code' })
    .select()
    .maybeSingle()
  if (error) {
    console.error('Supabase save error:', error)
    throw error
  }
  return data
}

// Confirm a code exists on server (used when entering another device's code)
export async function codeExistsOnServer(code) {
  const client = getClient()
  if (!client || !code) return false
  const { data, error } = await client
    .from(TABLE)
    .select('sync_code')
    .eq('sync_code', code)
    .maybeSingle()
  if (error) {
    console.error('Supabase check error:', error)
    return false
  }
  return !!data
}
