import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { BackgroundVideo } from './components/BackgroundVideo'
import { FocusTimer, type Phase } from './components/FocusTimer'
import { MusicDock } from './components/MusicDock'
import { NotificationPrompt } from './components/NotificationPrompt'
import { Navigation } from './components/Navigation'
import { QuoteDisplay } from './components/QuoteDisplay'
import { RewardPanel } from './components/RewardPanel'
import { SessionModes } from './components/SessionModes'
import { TimerControls } from './components/TimerControls'
import { useNotifications } from './hooks/useNotifications'
import { useOnline } from './hooks/useOnline'
import { useQuoteDeck } from './hooks/useQuoteDeck'
import { useSound } from './hooks/useSound'
import { useTimer } from './hooks/useTimer'
import { useWakeLock } from './hooks/useWakeLock'
import { formatTime } from './lib/format'
import { clearAllStoredData, loadPrefs, savePrefs } from './lib/storage'
import { focusSlot, MODE_LABEL } from './lib/timerReducer'

const TITLE = 'STILL / FOCUS'

export default function App() {
  const { state, dispatch } = useTimer()
  const sound = useSound()
  const quote = useQuoteDeck()
  const { status, mode, reward } = state

  const phase: Phase = status === 'running' || status === 'paused' ? 'active' : status === 'completed' ? 'done' : 'idle'

  const notifications = useNotifications()
  const online = useOnline()
  const [keepAwake, setKeepAwake] = useState(() => loadPrefs().keepAwake)
  useEffect(() => savePrefs({ keepAwake }), [keepAwake])
  // Screen stays on only while a session is actually running (released on pause, reset, skip and completion).
  const wake = useWakeLock(status === 'running' && keepAwake)

  // Chime + notification once per completed session. `completions` only ever increases, and it is
  // restored from storage, so a refresh or a session that ended while the page was closed never replays.
  const { play } = sound
  const { notify } = notifications
  const handled = useRef(state.completions)
  useEffect(() => {
    if (state.completions <= handled.current || !state.reward) return
    handled.current = state.completions
    play('complete')
    const r = state.reward
    notify(
      r.mode === 'focus'
        ? { title: 'Focus session complete', body: `Nice work. Time for a ${MODE_LABEL[r.nextMode].toLowerCase()}.`, tag: `session-${state.completions}` }
        : { title: `${MODE_LABEL[r.mode]} is over`, body: 'Ready for the next focus session?', tag: `session-${state.completions}` },
    )
  }, [state.completions, state.reward, play, notify])

  useEffect(() => {
    document.title =
      status === 'running' || status === 'paused'
        ? `${formatTime(state.remainingMs)} · ${MODE_LABEL[mode]} — ${TITLE}`
        : TITLE
  }, [status, mode, state.remainingMs])

  const click = (fn: () => void) => () => {
    sound.play('click')
    fn()
  }

  const onPrimary = click(() => {
    const now = Date.now()
    if (status === 'idle') dispatch({ type: 'start', now })
    else if (status === 'running') dispatch({ type: 'pause', now })
    else if (status === 'paused') dispatch({ type: 'resume', now })
    else dispatch({ type: 'startNext', now })
  })

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-root relative flex flex-col">
        <BackgroundVideo />
        <Navigation
          sessions={state.sessions}
          focusMinutes={state.focusMinutes}
          cycleLength={state.cycleLength}
          music={sound.music}
          uiSounds={sound.uiSounds}
          completionSound={sound.completionSound}
          onToggleMusic={sound.toggleMusic}
          onSelectSource={sound.selectSource}
          onVolume={sound.setVolume}
          onToggleUi={sound.toggleUiSounds}
          onToggleCompletion={sound.toggleCompletionSound}
          onCycleLength={(length) => dispatch({ type: 'setCycleLength', length })}
          online={online}
          awake={{ enabled: keepAwake, state: wake, onToggle: () => setKeepAwake((v) => !v) }}
          alerts={{ pref: notifications.pref, permission: notifications.permission, onToggle: () => void (notifications.pref === 'on' ? notifications.disable() : notifications.enable()) }}
          onResetProgress={() => {
            clearAllStoredData()
            dispatch({ type: 'resetProgress' })
          }}
        />

        <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-[max(1.25rem,env(safe-area-inset-left))] stage-pad pt-4 text-center">
          <SessionModes
            mode={mode}
            durations={state.durations}
            collapsed={phase !== 'idle'}
            onMode={(m) => click(() => dispatch({ type: 'setMode', mode: m }))()}
            onDuration={(m, minutes) => click(() => dispatch({ type: 'setDuration', mode: m, minutes }))()}
          />

          <div className="animate-fade-rise mt-[calc(var(--gap)-0.5rem)]" style={{ '--delay': '0.2s' } as React.CSSProperties}>
            <FocusTimer
              mode={mode}
              status={status}
              phase={phase}
              remainingMs={state.remainingMs}
              totalMs={state.durations[mode] * 60_000}
              slot={mode === 'focus' ? { n: focusSlot(state), of: state.cycleLength } : null}
              awakeNote={status === 'running' && keepAwake && (wake === 'unsupported' || wake === 'failed') ? 'Screen may dim — keep-awake unavailable' : null}
            />
          </div>

          {/* Fixed-height slot: the quote never moves when the timer changes state or when quotes change length. */}
          <div
            className={`scene-ease my-[var(--gap)] flex w-full max-w-xl items-center justify-center transition-[min-height] ${
              phase === 'done' ? 'min-h-[24rem]' : 'min-h-[var(--quote-h)]'
            }`}
          >
            <div className="animate-fade-rise" style={{ '--delay': '0.35s' } as React.CSSProperties}>
              <AnimatePresence mode="wait" initial={false}>
                {phase === 'done' && reward ? (
                  <RewardPanel
                    key="reward"
                    reward={reward}
                    sessions={state.sessions}
                    focusMinutes={state.focusMinutes}
                    points={state.points}
                    cycleLength={state.cycleLength}
                  />
                ) : (
                  quote && <QuoteDisplay key={quote.id} quote={quote} />
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="animate-fade-rise" style={{ '--delay': '0.5s' } as React.CSSProperties}>
            <TimerControls
              status={status}
              nextLabel={reward ? MODE_LABEL[reward.nextMode].toLowerCase() : null}
              onPrimary={onPrimary}
              onReset={click(() => dispatch({ type: 'reset' }))}
              onSkip={click(() => dispatch({ type: 'skip' }))}
            />
          </div>
        </main>
        <NotificationPrompt open={notifications.needsDecision} onEnable={() => void notifications.enable()} onDecline={notifications.disable} />
        <MusicDock active={sound.music.on && sound.music.source === 'youtube'} volume={sound.music.volume} />
      </div>
    </MotionConfig>
  )
}
