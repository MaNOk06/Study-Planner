// Simple browser Notifications API helper
// For deeper background push, a service worker would be needed,
// but this works while the tab is open or PWA is in foreground.

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function showNotification(title, body) {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'planner',
    })
  } catch (e) { console.error('notify', e) }
}

// Show today's focus summary in a notification (call on app load if enabled)
export function notifyTodaysFocus(focusItems) {
  if (!focusItems || focusItems.length === 0) return
  const top = focusItems[0]
  const restCount = focusItems.length - 1
  const body = restCount > 0
    ? `Focus: ${top.title}. Plus ${restCount} other priorit${restCount === 1 ? 'y' : 'ies'} today.`
    : `Focus: ${top.title}`
  showNotification('Today', body)
}
