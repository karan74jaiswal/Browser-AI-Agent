"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { AlertCircle, Film, RefreshCw } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SessionReplayProps {
  sessionId?: string | null
  pageId?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  onReady?: () => void
  onError?: (error: Error) => void
}

type ReplayStatus = "idle" | "polling" | "ready" | "error"

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 45

export function SessionReplay({
  sessionId,
  pageId,
  className,
  autoPlay = true,
  muted = true,
  controls = true,
  onReady,
  onError,
}: SessionReplayProps) {
  const [retryCount, setRetryCount] = useState(0)
  const [status, setStatus] = useState<ReplayStatus>(
    sessionId ? "polling" : "idle"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, setPollAttempt] = useState(1)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute("src")
      videoRef.current.load()
    }
  }, [])

  const startPlayback = useCallback(
    (playlistUrl: string) => {
      cleanupHls()
      const video = videoRef.current
      if (!video) return

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        })
        hlsRef.current = hls

        hls.loadSource(playlistUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus("ready")
          onReady?.()
          if (autoPlay) {
            video.play().catch(() => {
              // Autoplay may require prior user interaction
            })
          }
        })

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError()
                break
              default:
                cleanupHls()
                setStatus("error")
                const err = new Error(`Playback error: ${data.details}`)
                setErrorMessage(err.message)
                onError?.(err)
                break
            }
          }
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support fallback (e.g. Safari)
        video.src = playlistUrl
        const handleLoadedMetadata = () => {
          setStatus("ready")
          onReady?.()
          if (autoPlay) {
            video.play().catch(() => {})
          }
        }
        video.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        })
      } else {
        setStatus("error")
        const err = new Error("HLS playback is not supported on this browser")
        setErrorMessage(err.message)
        onError?.(err)
      }
    },
    [autoPlay, cleanupHls, onReady, onError]
  )

  useEffect(() => {
    if (!sessionId) {
      cleanupHls()
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const poll = async () => {
      let attempt = 1
      const query = pageId ? `?pageId=${encodeURIComponent(pageId)}` : ""
      const url = `/api/replays/${encodeURIComponent(sessionId)}${query}`

      while (isMounted && attempt <= MAX_POLL_ATTEMPTS) {
        try {
          setPollAttempt(attempt)
          const response = await fetch(url, {
            signal: controller.signal,
            cache: "no-store",
          })

          if (response.ok) {
            if (isMounted) {
              setStatus("ready")
              startPlayback(url)
            }
            return
          }

          if (
            (response.status === 404 ||
              response.status === 422 ||
              response.status === 202 ||
              response.status === 503) &&
            attempt < MAX_POLL_ATTEMPTS
          ) {
            attempt += 1
            await new Promise((resolve) =>
              setTimeout(resolve, POLL_INTERVAL_MS)
            )
            continue
          }

          const text = await response.text().catch(() => "")
          throw new Error(
            text || `Failed to load session replay (HTTP ${response.status})`
          )
        } catch (err: unknown) {
          if (controller.signal.aborted || !isMounted) return

          if (attempt < MAX_POLL_ATTEMPTS) {
            attempt += 1
            await new Promise((resolve) =>
              setTimeout(resolve, POLL_INTERVAL_MS)
            )
            continue
          }

          const error =
            err instanceof Error
              ? err
              : new Error("Session recording is taking longer than expected")
          if (isMounted) {
            setStatus("error")
            setErrorMessage(error.message)
            onError?.(error)
          }
          return
        }
      }

      if (isMounted && attempt > MAX_POLL_ATTEMPTS) {
        const error = new Error("Session recording took too long to prepare")
        setStatus("error")
        setErrorMessage(error.message)
        onError?.(error)
      }
    }

    poll()

    return () => {
      isMounted = false
      controller.abort()
      cleanupHls()
    }
  }, [sessionId, pageId, retryCount, startPlayback, cleanupHls, onError])

  const handleRetry = () => {
    setStatus("polling")
    setErrorMessage(null)
    setPollAttempt(1)
    setRetryCount((c) => c + 1)
  }

  const effectiveStatus = !sessionId ? "idle" : status

  return (
    <div
      className={cn(
        "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-black text-white shadow-inner",
        className
      )}
    >
      <video
        ref={videoRef}
        controls={controls}
        muted={muted}
        playsInline
        autoPlay={autoPlay}
        className={cn(
          "size-full object-contain",
          effectiveStatus !== "ready" && "hidden"
        )}
      />

      {effectiveStatus === "idle" && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
          <Film className="size-8 stroke-[1.5] text-muted-foreground/60" />
          <p className="text-xs font-medium">No session recording available</p>
          <p className="text-[11px] text-muted-foreground/70">
            A recording will be generated once a Browserbase browser session
            completes.
          </p>
        </div>
      )}

      {effectiveStatus === "polling" && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Spinner className="size-6 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-foreground">
              Preparing session recording...
            </p>
          </div>
        </div>
      )}

      {effectiveStatus === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="size-7 text-destructive" />
          <div className="flex max-w-sm flex-col gap-1">
            <p className="text-xs font-semibold text-destructive">
              Replay Unavailable
            </p>
            <p className="line-clamp-2 text-[11px] text-muted-foreground">
              {errorMessage || "Unable to load session recording."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            className="mt-1 h-7 gap-1.5 px-3 text-xs text-foreground"
          >
            <RefreshCw className="size-3" />
            <span>Retry</span>
          </Button>
        </div>
      )}
    </div>
  )
}
