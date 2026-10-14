/**
 * Session-completion notifications (local only: no push server, no external provider).
 * Uses the service worker's showNotification when available (required on Android Chrome) and falls
 * back to the Notification constructor. `tag` makes the OS replace — never duplicate — a notification.
 */
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'
export const currentPermission = (): PermissionState => (notificationsSupported() ? Notification.permission : 'unsupported')

export interface Payload {
  title: string
  body: string
  tag: string
}

export async function showNotification({ title, body, tag }: Payload): Promise<boolean> {
  if (currentPermission() !== 'granted') return false
  const options: NotificationOptions = { body, tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', silent: false }
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    if (reg) {
      await reg.showNotification(title, options)
      return true
    }
    const n = new Notification(title, options)
    n.onclick = () => {
      window.focus()
      n.close()
    }
    return true
  } catch {
    return false // never let a notification failure touch timer state
  }
}
