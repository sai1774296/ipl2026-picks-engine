"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TEAMS } from "@/data/schedule"

interface MatchHistoryItem {
  matchId: number
  home: string
  away: string
  homeColor: string
  awayColor: string
  date: string
  teamPick: string
  winner: string | null
  isCorrect: boolean | null
}

interface StatsData {
  totalPicks: number
  resolvedPicks: number
  correctPicks: number
  accuracy: number
  currentStreak: number
  bestStreak: number
  teamStats: Record<string, { picked: number; correct: number }>
  recentForm: { matchId: number; teamPick: string; isCorrect: boolean | null }[]
  matchHistory: MatchHistoryItem[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/stats")
      const data = await res.json()
      setStats(data)
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading || !stats) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gold">Your Stats</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Picks" value={stats.totalPicks} />
        <StatCard label="Correct" value={stats.correctPicks} color="text-green-500" />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} />
        <StatCard label="Streak" value={stats.currentStreak} sublabel={`Best: ${stats.bestStreak}`} />
      </div>

      {/* Recent Form */}
      {stats.recentForm.length > 0 && (
        <Card className="bg-card text-card-foreground">
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-3">Recent Form</div>
            <div className="flex gap-2 flex-wrap">
              {stats.recentForm.map((f) => (
                <div
                  key={f.matchId}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    f.isCorrect === true
                      ? "bg-green-500/20 text-green-500"
                      : f.isCorrect === false
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                  title={`Match ${f.matchId}: ${f.teamPick}`}
                >
                  {f.isCorrect === true ? "✓" : f.isCorrect === false ? "✗" : "?"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Pick Distribution */}
      <Card className="bg-card text-card-foreground">
        <CardContent className="pt-4">
          <div className="text-sm font-medium mb-3">Pick Distribution by Team</div>
          <div className="space-y-2">
            {Object.entries(stats.teamStats)
              .filter(([, s]) => s.picked > 0)
              .sort((a, b) => b[1].picked - a[1].picked)
              .map(([code, s]) => {
                const team = TEAMS[code]
                const pct = stats.totalPicks > 0 ? (s.picked / stats.totalPicks) * 100 : 0
                const winRate = s.picked > 0 ? Math.round((s.correct / s.picked) * 100) : 0
                return (
                  <div key={code} className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold w-12 text-right"
                      style={{ color: team?.primary }}
                    >
                      {code}
                    </span>
                    <div className="flex-1 h-6 bg-black/10 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 5)}%`,
                          backgroundColor: team?.primary || "#666",
                          opacity: 0.7,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium">
                        {s.picked} picks &middot; {winRate}% win rate
                      </span>
                    </div>
                  </div>
                )
              })}
            {Object.values(stats.teamStats).every((s) => s.picked === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No picks made yet. Start picking winners!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Match History */}
      {stats.matchHistory && stats.matchHistory.length > 0 && (
        <Card className="bg-card text-card-foreground overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 py-3 bg-black/5 border-b border-border/50">
              <span className="text-sm font-semibold">Match History</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({stats.matchHistory.length} completed)
              </span>
            </div>
            {stats.matchHistory.map((m, i) => (
              <div
                key={m.matchId}
                className={`flex items-center justify-between px-4 py-3 ${
                  i !== stats.matchHistory.length - 1 ? "border-b border-border/30" : ""
                } ${m.isCorrect ? "bg-green-500/5" : "bg-red-500/5"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">
                    #{m.matchId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${
                        m.winner === m.home ? "" : "opacity-40"
                      }`}
                      style={{ color: m.homeColor }}
                    >
                      {m.home}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span
                      className={`font-bold text-sm ${
                        m.winner === m.away ? "" : "opacity-40"
                      }`}
                      style={{ color: m.awayColor }}
                    >
                      {m.away}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        (m.teamPick === m.home ? m.homeColor : m.awayColor) + "15",
                      color: m.teamPick === m.home ? m.homeColor : m.awayColor,
                    }}
                  >
                    Picked {m.teamPick}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      m.isCorrect ? "text-green-500" : "text-red-400"
                    }`}
                  >
                    {m.isCorrect ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  sublabel,
}: {
  label: string
  value: string | number
  color?: string
  sublabel?: string
}) {
  return (
    <Card className="bg-card text-card-foreground">
      <CardContent className="pt-4 text-center">
        <div className={`text-2xl font-bold ${color || "text-gold"}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
        {sublabel && <div className="text-[10px] text-muted-foreground">{sublabel}</div>}
      </CardContent>
    </Card>
  )
}
