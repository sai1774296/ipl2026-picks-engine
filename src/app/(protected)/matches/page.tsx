"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { MatchCard } from "@/components/match-card"
import { IplBanner } from "@/components/ipl-banner"
import { useToast } from "@/hooks/use-toast"

type MatchData = {
  matchId: number
  date: string
  home: string
  away: string
  venue: string
  homeTeam: { code: string; name: string; primary: string; secondary: string }
  awayTeam: { code: string; name: string; primary: string; secondary: string }
  isLocked: boolean
  status: string
  winner: string | null
  userPick: string | null
  isCorrect: boolean | null
}

type TabFilter = "upcoming" | "completed" | "all"

export default function MatchesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>("upcoming")

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches")
      const data = await res.json()
      if (data.matches) setMatches(data.matches)
    } catch (e) {
      console.error("Failed to fetch matches:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
    const interval = setInterval(fetchMatches, 60000)
    return () => clearInterval(interval)
  }, [fetchMatches])

  async function handlePick(matchId: number, team: string) {
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, teamPick: team }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast({
        title: "Pick failed",
        description: data.error || "Something went wrong",
        variant: "destructive",
      })
      throw new Error(data.error)
    }

    toast({ title: "Pick saved!", description: `You picked ${team} for Match ${matchId}` })
    setMatches((prev) =>
      prev.map((m) => (m.matchId === matchId ? { ...m, userPick: team } : m))
    )
  }

  const filtered = matches.filter((m) => {
    if (tab === "upcoming")
      return !m.winner && m.status !== "completed" && m.status !== "no_result"
    if (tab === "completed")
      return m.status === "completed" || m.status === "no_result"
    return true
  })

  const completedMatches = matches.filter(
    (m) => m.status === "completed" || m.status === "no_result"
  )
  const correctPicks = matches.filter((m) => m.isCorrect === true).length
  const totalPicked = matches.filter(
    (m) => m.userPick && m.status === "completed"
  ).length
  const totalPicksMade = matches.filter((m) => m.userPick).length

  // Group by date
  const grouped = filtered.reduce<Record<string, MatchData[]>>((acc, m) => {
    const dateKey = new Date(m.date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(m)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-28 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* IPL Banner with stats */}
      <IplBanner subtitle={`Hey ${session?.user?.displayName}! ${completedMatches.length} of 70 matches played`}>
        <div className="flex gap-3">
          <StatPill label="Correct" value={correctPicks} />
          <StatPill
            label="Accuracy"
            value={
              totalPicked > 0
                ? `${Math.round((correctPicks / totalPicked) * 100)}%`
                : "–"
            }
          />
          <StatPill label="Picked" value={totalPicksMade} />
        </div>
      </IplBanner>

      {/* Tab Filters */}
      <div className="flex gap-2">
        {(["upcoming", "completed", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? "bg-gold text-black shadow-md shadow-gold/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-1 text-xs opacity-80">
              {t === "upcoming" &&
                `(${matches.filter((m) => !m.winner && m.status !== "completed" && m.status !== "no_result").length})`}
              {t === "completed" && `(${completedMatches.length})`}
              {t === "all" && `(${matches.length})`}
            </span>
          </button>
        ))}
      </div>

      {/* Match Cards grouped by date */}
      {Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏏</div>
          <p className="text-muted-foreground">No matches to show in this tab.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayMatches]) => (
          <div key={date}>
            <div className="sticky top-14 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/50 mb-3">
              <h2 className="text-sm font-semibold text-gold/80">{date}</h2>
              {dayMatches.length > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  Double Header
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {dayMatches.map((match) => (
                <MatchCard key={match.matchId} match={match} onPick={handlePick} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center border border-white/5">
      <div className="text-lg font-bold text-gold">{value}</div>
      <div className="text-[10px] text-foreground/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
