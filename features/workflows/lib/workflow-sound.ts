// Synthesized Web Audio API sound effects for workflow execution (0kb external assets)

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem("workflow_sound_muted") === "true"
  } catch {
    return false
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("workflow_sound_muted", muted ? "true" : "false")
    window.dispatchEvent(new Event("workflow-sound-muted-change"))
  } catch {}
}

export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted()
  setSoundMuted(next)
  return next
}

/**
 * Play a subtle, high-tech soft whoosh/pop when a step begins executing
 */
export function playStepStartSound(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.06)

    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  } catch {}
}

/**
 * Play a pleasant, crisp ascending micro-chime when a step completes successfully
 */
export function playStepSuccessSound(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    // First bell tone
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0.05, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.12)

    // Second higher harmonic chime
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "triangle"
    osc2.frequency.setValueAtTime(880, now + 0.04) // A5
    gain2.gain.setValueAtTime(0.04, now + 0.04)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.04)
    osc2.stop(now + 0.18)
  } catch {}
}

/**
 * Play a soft muted warning double-tap when a step fails
 */
export function playStepErrorSound(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15)

    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.16)
  } catch {}
}

/**
 * Play a rich 3-tone harmonic arpeggio when the entire workflow completes
 */
export function playWorkflowSuccessSound(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!ctx) return
      const now = ctx.currentTime + i * 0.07
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    })
  } catch {}
}
