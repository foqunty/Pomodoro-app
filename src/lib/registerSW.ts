/**
 * Registers the service worker (production builds, secure contexts only). Registering the same URL again is a
 * no-op, so there is never more than one worker. `updateViaCache: 'none'` makes the browser re-check sw.js on
 * every load; a new version installs in the background and takes over on the next load without interrupting a session.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      /* offline support is an enhancement; the app works without it */
    })
  })
}
