"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountdownTimer } from "@/components/countdown-timer"
import { formatMatchDate, formatMatchTime } from "@/lib/utils"
import type { Team } from "@/data/schedule"

interface MatchData {
  matchId: number
  date: string
  home: string
  away: string
  venue: string
  homeTeam: Team
  awayTeam: Team
  isLocked: boolean
  status: string
  winner: string | null
  userPick: string | null
  isCorrect: boolean | null
}

export function MatchCard({
  match,
  onPick,
}: {
  match: MatchData
  onPick: (matchId: number, team: string) => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [localLocked, setLocalLocked] = useState(match.isLocked)
  const [localPick, setLocalPick] = useState(match.userPick)

  const handlePick = async (team: string) => {
    if (localLocked || submitting) return
    setSubmitting(true)
    setLocalPick(team)
    try {
      await onPick(match.matchId, team)
    } catch {
      setLocalPick(match.userPick) // revert on error
    }
    setSubmitting(false)
  }

  const handleLock = useCallback(() => {
    setLocalLocked(true)
  }, [])

  const isCompleted = match.status === "completed"
  const isNoResult = match.status === "no_result"

  return (
    <Card className="overflow-hidden bg-card text-card-foreground">
      {/* Header: match number, date, venue */}
      <div className="px-4 py-2 bg-black/10 flex items-center justify-between text-xs">
        <span className="font-medium">Match {match.matchId}</span>
        <span>{formatMatchDate(match.date)} &middot; {formatMatchTime(match.date)}</span>
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <TeamButton
            team={match.homeTeam}
            code={match.home}
            selected={localPick === match.home}
            isWinner={match.winner === match.home}
            isCompleted={isCompleted}
            disabled={localLocked || submitting}
            onClick={() => handlePick(match.home)}
          />

          {/* VS / Status */}
          <div className="flex flex-col items-center gap-1 min-w-[50px]">
            {isCompleted ? (
              <Badge variant="secondary" className="text-xs">
                {isNoResult ? "N/R" : "FT"}
              </Badge>
            ) : match.status === "live" ? (
              <Badge className="bg-red-500 text-white animate-pulse text-xs">
                LIVE
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">VS</span>
            )}
          </div>

          {/* Away Team */}
          <TeamButton
            team={match.awayTeam}
            code={match.away}
            selected={localPick === match.away}
            isWinner={match.winner === match.away}
            isCompleted={isCompleted}
            disabled={localLocked || submitting}
            onClick={() => handlePick(match.away)}
          />
        </div>

        {/* Footer: venue, countdown, result */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[60%]">
            {match.venue}
          </span>

          {isCompleted && localPick ? (
            <span
              className={`text-xs font-bold ${
                match.isCorrect ? "text-green-500" : "text-red-400"
              }`}
            >
              {match.isCorrect ? "✓ Correct!" : "✗ Wrong"}
            </span>
          ) : !localLocked ? (
            <CountdownTimer targetDate={match.date} onLock={handleLock} />
          ) : (
            <span className="text-xs text-red-400">🔒 Locked</span>
          )}
        </div>
      </div>
    </Card>
  )
}

function TeamButton({
  team,
  code,
  selected,
  isWinner,
  isCompleted,
  disabled,
  onClick,
}: {
  team: Team
  code: string
  selected: boolean
  isWinner: boolean
  isCompleted: boolean
  disabled: boolean
  onClick: () => void
}) {
  const isPickable = !disabled && !isCompleted

  return (
    <button
      onClick={onClick}
      disabled={!isPickable}
      className={`
        flex-1 py-3 px-2 rounded-lg text-center transition-all
        ${isPickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "cursor-default"}
        ${
          selected && !isCompleted
            ? "ring-2 ring-gold shadow-md"
            : ""
        }
        ${
          isCompleted && isWinner
            ? "ring-2 ring-green-500"
            : ""
        }
        ${
          isCompleted && selected && !isWinner
            ? "opacity-50"
            : ""
        }
      `}
      style={{
        backgroundColor: selected
          ? team.primary + "30"
          : isCompleted && isWinner
          ? team.primary + "20"
          : "rgba(0,0,0,0.05)",
        borderLeft: `4px solid ${team.primary}`,
      }}
    >
      <div className="text-lg font-bold" style={{ color: team.primary }}>
        {code}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {team.name}
      </div>
      {selected && !isCompleted && (
        <div className="text-[9px] text-gold mt-1 font-medium">YOUR PICK</div>
      )}
      {isCompleted && isWinner && (
        <div className="text-[9px] text-green-500 mt-1 font-medium">WINNER</div>
      )}
    </button>
  )
}
