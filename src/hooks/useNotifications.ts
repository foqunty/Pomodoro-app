import { useCallback, useEffect, useRef, useState } from 'react'
import { currentPermission, showNotification, type Payload, type PermissionState } from '../lib/notify'
import { loadPrefs, savePrefs, type NotificationPref } from '../lib/storage'

/**
 * Two separate facts: the app's own preference (unset / on / off — set only by the user) and the
 * browser's real permission. A notification is sent only when the preference is "on" AND the browser says
 * "granted". The browser prompt is only ever shown from `enable()`, which runs from an explicit click.
 */
export function useNotifications() {
  const [pref, setPref] = useState<NotificationPref>(() => loadPrefs().notifications)
  const [permission, setPermission] = useState<PermissionState>(currentPermission)
  const prefRef = useRef(pref)
  prefRef.current = pref

  // The user can change the permission in browser settings at any time; re-read when they come back.
  useEffect(() => {
    const sync = () => setPermission(currentPermission())
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const choose = useCallback((next: NotificationPref) => {
    prefRef.current = next
    setPref(next)
    savePrefs({ notifications: next })
  }, [])

  const enable = useCallback(async () => {
    choose('on')
    if (currentPermission() === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        /* some browsers throw instead of resolving 'denied' */
      }
    }
    setPermission(currentPermission()) // a denial is final: we never ask again
  }, [choose])

  const disable = useCallback(() => choose('off'), [choose])

  const notify = useCallback((payload: Payload) => {
    if (prefRef.current === 'on') void showNotification(payload)
  }, [])

  return { pref, permission, enable, disable, notify, needsDecision: pref === 'unset' && permission !== 'unsupported' && permission !== 'denied' }
}
