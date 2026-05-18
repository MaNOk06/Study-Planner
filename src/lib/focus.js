import { daysUntil, calcStartBy, todayISO } from './dates'
import { CATEGORIES } from './constants'

/**
 * Compute focus score for an item.
 * Higher = more urgent / important to focus on today.
 *
 * Factors:
 *  - Urgency (days until due) — exponential decay
 *  - Category weight (exam > quiz > assignment > reading)
 *  - Hours remaining (more to do = need to start earlier)
 *  - Overdue penalty (or boost) — overdue items rank very high
 *  - Past start-by date with zero progress = urgent
 */
export function computeScore(item, hoursPerDay = 1.5) {
  if (item.status === 'done') return -1

  const days = daysUntil(item.dueDate)
  const cat = CATEGORIES[item.type] || CATEGORIES.other
  const weight = cat.weight || 3
  const hoursLeft = Math.max(0, (item.estHours || 0) - (item.hoursDone || 0))

  // Urgency: more aggressive as the due date approaches
  let urgency
  if (days < 0) urgency = 200            // overdue
  else if (days === 0) urgency = 150     // due today
  else if (days === 1) urgency = 100     // tomorrow
  else if (days <= 3) urgency = 60
  else if (days <= 7) urgency = 30
  else if (days <= 14) urgency = 15
  else urgency = 5

  // Start-by penalty
  const startByISO = calcStartBy(item.dueDate, item.estHours || 1, hoursPerDay)
  const daysToStart = daysUntil(startByISO)
  let startPenalty = 0
  if (daysToStart < 0 && hoursLeft > 0) {
    startPenalty = Math.min(80, Math.abs(daysToStart) * 15)
  }

  // Hours-remaining factor (logarithmic)
  const hoursFactor = Math.log1p(hoursLeft) * 3

  return urgency * weight + startPenalty * weight * 0.5 + hoursFactor
}

/**
 * Get today's focus list — top 3-5 items by score
 */
export function getTodayFocus(items, hoursPerDay = 1.5, limit = 5) {
  const active = items
    .filter(i => i.status !== 'done')
    .filter(i => i.type !== 'habit' && i.type !== 'goal')
  const scored = active.map(i => ({ item: i, score: computeScore(i, hoursPerDay) }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(s => s.item)
}

/**
 * Items due today or in next N days
 */
export function getUpcoming(items, days = 7) {
  return items
    .filter(i => i.status !== 'done')
    .filter(i => i.type !== 'habit' && i.type !== 'goal')
    .filter(i => {
      const d = daysUntil(i.dueDate)
      return d >= 0 && d <= days
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/**
 * Overdue items
 */
export function getOverdue(items) {
  return items
    .filter(i => i.status !== 'done')
    .filter(i => i.type !== 'habit' && i.type !== 'goal')
    .filter(i => daysUntil(i.dueDate) < 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/**
 * Readings for tomorrow's classes (or today's remaining)
 */
export function getTodaysReadings(items) {
  return items
    .filter(i => i.status !== 'done')
    .filter(i => i.type === 'reading')
    .filter(i => {
      const d = daysUntil(i.dueDate)
      return d >= 0 && d <= 1
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/**
 * Generate a one-sentence reason a task is the focus today
 */
export function reasonForFocus(item, hoursPerDay = 1.5) {
  const days = daysUntil(item.dueDate)
  const hoursLeft = Math.max(0, (item.estHours || 0) - (item.hoursDone || 0))
  const startByISO = calcStartBy(item.dueDate, item.estHours || 1, hoursPerDay)
  const daysToStart = daysUntil(startByISO)

  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} — finish today`
  if (days === 0) return `Due today — ${hoursLeft.toFixed(1)}h still to do`
  if (days === 1) return `Due tomorrow — ${hoursLeft.toFixed(1)}h left`
  if (daysToStart < 0 && (item.hoursDone || 0) === 0) return `Should have started ${Math.abs(daysToStart)} day${Math.abs(daysToStart) === 1 ? '' : 's'} ago`
  if (days <= 3) return `${days} days left, ${hoursLeft.toFixed(1)}h to do — start now`
  if (days <= 7) return `Due in ${days} days — get ahead today`
  return `Due in ${days} days`
}

export function weeklyStats(items, hoursPerDay = 1.5) {
  const active = items.filter(i => i.status !== 'done' && i.type !== 'habit' && i.type !== 'goal')
  const thisWeek = active.filter(i => {
    const d = daysUntil(i.dueDate)
    return d >= 0 && d <= 7
  })
  const overdue = active.filter(i => daysUntil(i.dueDate) < 0)
  const totalHoursOutstanding = active.reduce((s, t) => s + Math.max(0, (t.estHours || 0) - (t.hoursDone || 0)), 0)
  const behind = active.filter(t => {
    const startBy = calcStartBy(t.dueDate, t.estHours || 1, hoursPerDay)
    return daysUntil(startBy) < 0 && (t.hoursDone || 0) === 0
  })
  return {
    active: active.length,
    thisWeek: thisWeek.length,
    overdue: overdue.length,
    totalHoursOutstanding,
    behind: behind.length,
  }
}
