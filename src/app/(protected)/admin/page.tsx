"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { SCHEDULE, TEAMS } from "@/data/schedule"

interface UserRow {
  id: string
  username: string
  displayName: string
  approved: boolean
  isAdmin: boolean
  createdAt: string
  _count: { picks: number }
}

type AdminTab = "users" | "results" | "picks"

interface UserPick {
  matchId: number
  teamPick: string
  isCorrect: boolean | null
}

export default function AdminPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<AdminTab>("users")
  const [users, setUsers] = useState<UserRow[]>([])
  const [results, setResults] = useState<Record<number, { winner: string | null; status: string }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [usersRes, resultsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/results"),
    ])
    const usersData = await usersRes.json()
    const resultsData = await resultsRes.json()
    setUsers(usersData.users || [])

    const rMap: Record<number, { winner: string | null; status: string }> = {}
    for (const r of resultsData.results || []) {
      rMap[r.matchId] = { winner: r.winner, status: r.status }
    }
    setResults(rMap)
    setLoading(false)
  }

  async function toggleApproval(userId: string, approved: boolean) {
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved }),
    })
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, approved } : u))
    )
    toast({ title: approved ? "User approved" : "User access revoked" })
  }

  async function setResult(matchId: number, winner: string | null, status: string) {
    const res = await fetch("/api/admin/results/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, winner, status }),
    })
    if (res.ok) {
      setResults((prev) => ({ ...prev, [matchId]: { winner, status } }))
      toast({ title: `Match ${matchId} result updated` })
    } else {
      toast({ title: "Failed to update result", variant: "destructive" })
    }
  }

  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [userPicks, setUserPicks] = useState<Record<number, string>>({})
  const [loadingPicks, setLoadingPicks] = useState(false)
  const [syncing, setSyncing] = useState(false)

  async function fetchUserPicks(userId: string) {
    if (!userId) return
    setLoadingPicks(true)
    const res = await fetch(`/api/admin/picks?userId=${userId}`)
    const data = await res.json()
    const picksMap: Record<number, string> = {}
    for (const p of data.picks || []) {
      picksMap[p.matchId] = p.teamPick
    }
    setUserPicks(picksMap)
    setLoadingPicks(false)
  }

  async function adminSetPick(userId: string, matchId: number, teamPick: string) {
    const res = await fetch("/api/admin/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, matchId, teamPick }),
    })
    if (res.ok) {
      setUserPicks((prev) => ({ ...prev, [matchId]: teamPick }))
      toast({ title: `Pick set: Match ${matchId} → ${teamPick}` })
    } else {
      const data = await res.json()
      toast({ title: "Failed", description: data.error, variant: "destructive" })
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/results/sync", { method: "POST" })
      const data = await res.json()
      if (data.synced > 0) {
        toast({ title: `Synced ${data.synced} match result(s) from CricAPI` })
        fetchData() // refresh results
      } else if (data.errors?.length > 0) {
        toast({ title: "Sync issue", description: data.errors[0], variant: "destructive" })
      } else {
        toast({ title: "No new results to sync" })
      }
    } catch {
      toast({ title: "Sync failed", variant: "destructive" })
    }
    setSyncing(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gold">Admin Panel</h1>

      {/* Tab Filters */}
      <div className="flex gap-2">
        {(["users", "results", "picks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-gold text-black" : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "users"
              ? `Users (${users.length})`
              : t === "results"
              ? "Results"
              : "Picks"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-sm">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/5"
                >
                  <div>
                    <div className="font-medium text-sm">{user.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      @{user.username} &middot; {user._count.picks} picks
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {user.approved ? "Approved" : "Pending"}
                      </span>
                      <Switch
                        checked={user.approved}
                        onCheckedChange={(checked) => toggleApproval(user.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "results" && (
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Match Results</CardTitle>
            <Button
              size="sm"
              className="text-xs h-8 bg-gold text-black hover:bg-gold/80"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? "Syncing..." : "Sync from CricAPI"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {SCHEDULE.map((match) => {
                const result = results[match.matchId]
                const isPast = new Date() >= new Date(match.date)
                const homeTeam = TEAMS[match.home]
                const awayTeam = TEAMS[match.away]

                return (
                  <div
                    key={match.matchId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result?.status === "completed" ? "bg-green-500/5" : "bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">#{match.matchId}</span>
                      <span className="text-sm font-medium" style={{ color: homeTeam.primary }}>
                        {match.home}
                      </span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span className="text-sm font-medium" style={{ color: awayTeam.primary }}>
                        {match.away}
                      </span>
                      {result?.status === "completed" && (
                        <Badge className="bg-green-500/20 text-green-600 text-[10px]">
                          Winner: {result.winner}
                        </Badge>
                      )}
                    </div>
                    {isPast && result?.status !== "completed" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => setResult(match.matchId, match.home, "completed")}
                        >
                          {match.home}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => setResult(match.matchId, match.away, "completed")}
                        >
                          {match.away}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => setResult(match.matchId, null, "no_result")}
                        >
                          N/R
                        </Button>
                      </div>
                    )}
                    {!isPast && (
                      <span className="text-xs text-muted-foreground">Upcoming</span>
                    )}
                    {result?.status === "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-muted-foreground"
                        onClick={() => setResult(match.matchId, null, "upcoming")}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "picks" && (
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-sm">Manage User Picks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User selector */}
            <div className="flex gap-2 flex-wrap">
              {users
                .filter((u) => u.approved)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id)
                      fetchUserPicks(u.id)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedUserId === u.id
                        ? "bg-gold text-black"
                        : "bg-black/10 text-muted-foreground hover:bg-black/20"
                    }`}
                  >
                    {u.displayName}
                  </button>
                ))}
            </div>

            {/* Picks list for selected user */}
            {selectedUserId && (
              loadingPicks ? (
                <div className="text-sm text-muted-foreground animate-pulse py-4 text-center">
                  Loading picks...
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {SCHEDULE.map((match) => {
                    const pick = userPicks[match.matchId]
                    const homeTeam = TEAMS[match.home]
                    const awayTeam = TEAMS[match.away]
                    const result = results[match.matchId]

                    return (
                      <div
                        key={match.matchId}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          pick ? "bg-black/5" : "bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6">
                            #{match.matchId}
                          </span>
                          <span
                            className="text-sm font-medium"
                            style={{ color: homeTeam.primary }}
                          >
                            {match.home}
                          </span>
                          <span className="text-xs text-muted-foreground">vs</span>
                          <span
                            className="text-sm font-medium"
                            style={{ color: awayTeam.primary }}
                          >
                            {match.away}
                          </span>
                          {pick && (
                            <Badge
                              className="text-[10px]"
                              style={{
                                backgroundColor:
                                  (pick === match.home
                                    ? homeTeam.primary
                                    : awayTeam.primary) + "20",
                                color:
                                  pick === match.home
                                    ? homeTeam.primary
                                    : awayTeam.primary,
                              }}
                            >
                              Picked: {pick}
                            </Badge>
                          )}
                          {!pick && (
                            <Badge variant="secondary" className="text-[10px] text-red-400">
                              No pick
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={pick === match.home ? "default" : "outline"}
                            className={`text-xs h-7 px-2 ${
                              pick === match.home ? "bg-gold text-black" : ""
                            }`}
                            onClick={() =>
                              adminSetPick(selectedUserId, match.matchId, match.home)
                            }
                          >
                            {match.home}
                          </Button>
                          <Button
                            size="sm"
                            variant={pick === match.away ? "default" : "outline"}
                            className={`text-xs h-7 px-2 ${
                              pick === match.away ? "bg-gold text-black" : ""
                            }`}
                            onClick={() =>
                              adminSetPick(selectedUserId, match.matchId, match.away)
                            }
                          >
                            {match.away}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {!selectedUserId && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Select a user above to view and manage their picks
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
