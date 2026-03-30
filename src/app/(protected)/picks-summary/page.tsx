"use client"

import { useEffect, useState, useMemo } from "react"

interface PickRow {
  matchId: number
  matchLabel: string
  matchDate: string
  home: string
  away: string
  homeColor: string
  awayColor: string
  displayName: string
  teamPick: string
  teamPickColor: string
  winner: string | null
  status: string
  isCorrect: boolean | null
}

function StatusBadge({ status, winner }: { status: string; winner: string | null }) {
  if (status === "completed" && winner) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800">
        {winner} won
      </span>
    )
  }
  if (status === "no_result") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
        No result
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-500 border border-yellow-800">
      Live / Pending
    </span>
  )
}

function ResultIcon({ isCorrect, status }: { isCorrect: boolean | null; status: string }) {
  if (status !== "completed") return <span className="text-gray-500 text-lg">⏳</span>
  if (isCorrect === true) return <span className="text-lg">✅</span>
  if (isCorrect === false) return <span className="text-lg">❌</span>
  return <span className="text-gray-500 text-lg">—</span>
}

export default function PicksSummaryPage() {
  const [rows, setRows] = useState<PickRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMatch, setFilterMatch] = useState<number | "all">("all")
  const [filterUser, setFilterUser] = useState<string>("all")

  useEffect(() => {
    fetch("/api/picks/all")
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const matchOptions = useMemo(() => {
    const seen = new Map<number, string>()
    rows.forEach((r) => seen.set(r.matchId, r.matchLabel))
    return Array.from(seen.entries()).sort((a, b) => a[0] - b[0])
  }, [rows])

  const userOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.displayName))).sort()
  }, [rows])

  const filtered = rows.filter((r) => {
    if (filterMatch !== "all" && r.matchId !== filterMatch) return false
    if (filterUser !== "all" && r.displayName !== filterUser) return false
    return true
  })

  // Group by matchId for the match header rows
  const grouped = useMemo(() => {
    const map = new Map<number, PickRow[]>()
    filtered.forEach((r) => {
      if (!map.has(r.matchId)) map.set(r.matchId, [])
      map.get(r.matchId)!.push(r)
    })
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]) // newest first
  }, [filtered])

  // Per-user win summary
  const userStats = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number; pending: number }> = {}
    rows.forEach((r) => {
      if (!stats[r.displayName]) stats[r.displayName] = { wins: 0, losses: 0, pending: 0 }
      if (r.isCorrect === true) stats[r.displayName].wins++
      else if (r.isCorrect === false) stats[r.displayName].losses++
      else stats[r.displayName].pending++
    })
    return Object.entries(stats).sort((a, b) => b[1].wins - a[1].wins)
  }, [rows])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Loading picks...</div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-xl font-bold mb-2">No picks visible yet</h1>
        <p className="text-muted-foreground text-sm">
          Picks are hidden until a match starts. Once the first match begins, everyone&apos;s picks appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold mb-1">📋 Picks Summary</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Visible to all after each match locks. No secrets. 🔒
      </p>

      {/* Mini leaderboard */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Win Tally
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {userStats.map(([name, s], i) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4 shrink-0">
                  {i + 1}.
                </span>
                <span className="text-sm font-medium truncate">{name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-green-400 text-sm font-bold">{s.wins}</span>
                <span className="text-muted-foreground text-xs">W</span>
                <span className="text-red-400 text-sm font-bold ml-1">{s.losses}</span>
                <span className="text-muted-foreground text-xs">L</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterMatch === "all" ? "all" : String(filterMatch)}
          onChange={(e) =>
            setFilterMatch(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="text-sm bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          <option value="all">All Matches</option>
          {matchOptions.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          <option value="all">All Players</option>
          {userOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Match groups */}
      <div className="space-y-4">
        {grouped.map(([matchId, matchRows]) => {
          const first = matchRows[0]
          return (
            <div key={matchId} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Match header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{first.matchId}</span>
                  <span className="font-semibold text-sm">
                    <span style={{ color: first.homeColor }}>{first.home}</span>
                    <span className="text-muted-foreground mx-1">vs</span>
                    <span style={{ color: first.awayColor }}>{first.away}</span>
                  </span>
                </div>
                <StatusBadge status={first.status} winner={first.winner} />
              </div>

              {/* Picks rows */}
              <div className="divide-y divide-border">
                {matchRows.map((row) => (
                  <div
                    key={`${row.matchId}-${row.displayName}`}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm font-medium">{row.displayName}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-bold px-2 py-0.5 rounded"
                        style={{
                          color: row.teamPickColor,
                          backgroundColor: row.teamPickColor + "22",
                        }}
                      >
                        {row.teamPick}
                      </span>
                      <ResultIcon isCorrect={row.isCorrect} status={row.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
