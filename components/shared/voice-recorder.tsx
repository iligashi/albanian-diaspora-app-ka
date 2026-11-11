"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Square, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const MAX_SECONDS = 60

/**
 * Records a short voice message in the browser and puts it into a hidden file
 * input, so it is submitted with the form like any upload. Grandparents who
 * can't read a small card can still hear it.
 */
export function VoiceRecorder({ name }: { name: string }) {
  const input = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [state, setState] = useState<"idle" | "recording" | "done" | "unsupported">("idle")
  const [seconds, setSeconds] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && (!navigator.mediaDevices || typeof MediaRecorder === "undefined")) setState("unsupported")
    return () => {
      if (timer.current) clearInterval(timer.current)
      recorder.current?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t))
      const rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 48_000 } : undefined)
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: rec.mimeType })
        const ext = rec.mimeType.includes("ogg") ? "ogg" : rec.mimeType.includes("mp4") ? "m4a" : "webm"
        const transfer = new DataTransfer()
        transfer.items.add(new File([blob], `voice-note.${ext}`, { type: rec.mimeType }))
        if (input.current) input.current.files = transfer.files
        setUrl(URL.createObjectURL(blob))
        setState("done")
      }
      recorder.current = rec
      rec.start()
      setSeconds(0)
      setState("recording")
      timer.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop()
          return s + 1
        })
      }, 1000)
    } catch {
      setError("Allow microphone access in your browser to record a message.")
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    if (recorder.current?.state === "recording") recorder.current.stop()
  }

  function discard() {
    if (input.current) input.current.value = ""
    setUrl(null)
    setState("idle")
  }

  if (state === "unsupported") return null

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <input ref={input} type="file" name={name} accept="audio/*" className="hidden" tabIndex={-1} aria-hidden />
      <div className="flex flex-wrap items-center gap-3">
        {state === "idle" && (
          <Button type="button" variant="outline" size="sm" onClick={start}>
            <Mic /> Record a voice message
          </Button>
        )}
        {state === "recording" && (
          <>
            <Button type="button" variant="destructive" size="sm" onClick={stop}>
              <Square /> Stop
            </Button>
            <span className="flex items-center gap-2 text-sm tabular-nums text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-red-600" />
              0:{String(seconds).padStart(2, "0")} / 1:00
            </span>
          </>
        )}
        {state === "done" && url && (
          <>
            <audio controls src={url} className="h-9 max-w-full" />
            <Button type="button" variant="ghost" size="sm" onClick={discard}>
              <Trash2 /> Remove
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {error ?? "Optional. The shop plays it to them when they deliver. Up to one minute."}
      </p>
    </div>
  )
}
