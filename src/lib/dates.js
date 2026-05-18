// All date functions assume ISO date strings (YYYY-MM-DD) for due dates,
// and handle timezone-safely by anchoring to local midnight.

export const todayISO = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10)
}

export const parseDate = (iso) => {
  if (!iso) return null
  const [y, m, d] = iso.slice(0,10).split('-').map(Number)
  return new Date(y, m-1, d)
}

export const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0,0,0,0)
  return x
}

export const fmtShort = (iso) => {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const fmtLong = (iso) => {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export const fmtWeekday = (iso) => {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'long' })
}

export const daysUntil = (iso) => {
  const today = startOfDay(new Date())
  const due = parseDate(iso)
  if (!due) return 0
  return Math.round((due - today) / 86400000)
}

export const addDays = (iso, n) => {
  const d = parseDate(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0,10)
}

// Latest start date based on estimated hours + hours/day capacity
export const calcStartBy = (dueDate, estHours, hoursPerDay = 1.5) => {
  if (!dueDate || !estHours) return dueDate
  const daysNeeded = Math.max(1, Math.ceil(estHours / hoursPerDay))
  return addDays(dueDate, -daysNeeded)
}

// Get start (Monday) of current week
export const startOfWeek = () => {
  const d = startOfDay(new Date())
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0,10)
}

// Get 7 days starting from Monday of current week
export const weekDates = () => {
  const start = startOfWeek()
  return [0,1,2,3,4,5,6].map(i => addDays(start, i))
}
