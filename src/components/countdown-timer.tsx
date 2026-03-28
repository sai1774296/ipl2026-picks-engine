"use client"

import { useState, useEffect } from "react"

export function CountdownTimer({
  targetDate,
  onLock,
}: {
  targetDate: string
  onLock?: () => void
}) {
  const [timeLeft, setTimeLeft] = useState("")
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setLocked(true)
        setTimeLeft("LOCKED")
        onLock?.()
        return
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24))
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const m = Math.floor((diff / (1000 * 60)) % 60)
      const s = Math.floor((diff / 1000) % 60)

      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m`)
      } else if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`)
      } else {
        setTimeLeft(`${m}m ${s}s`)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate, onLock])

  if (locked) {
    return (
      <span className="text-xs font-medium text-red-400 flex items-center gap-1">
        🔒 LOCKED
      </span>
    )
  }

  return (
    <span className="text-xs font-mono text-muted-foreground">
      ⏱ {timeLeft}
    </span>
  )
}
