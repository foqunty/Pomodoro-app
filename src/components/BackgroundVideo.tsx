import { useEffect, useRef, useState } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4'

type SaveDataConnection = { connection?: { saveData?: boolean } }

export function BackgroundVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  // Data Saver on → don't download the 14 MB video; the solid navy background is the fallback.
  const [failed, setFailed] = useState(
    () => (navigator as Navigator & SaveDataConnection).connection?.saveData === true,
  )

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Play only when motion is allowed and the tab is visible (saves battery on mobile).
    const sync = () => {
      if (mq.matches || document.hidden) video.pause()
      else video.play().catch(() => {}) // autoplay blocked: the first frame simply stays.
    }
    sync()
    mq.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      mq.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [failed])

  return (
    <>
      {!failed && (
        <video
          ref={ref}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          onError={() => setFailed(true)}
        />
      )}
      {/* Very light readability layer only. */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/25" aria-hidden="true" />
    </>
  )
}
