"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { IplBanner } from "@/components/ipl-banner"

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  username: string
  correctPicks: number
  totalPicks: number
  accuracy: number
}

interface MatchResult {
  matchId: number
  home: string
  away: string
  homeName: string
  awayName: string
  homeColor: string
  awayColor: string
  winner: string | null
  date: string
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [completedMatches, setCompletedMatches] = useState(0)
  const [recentResults, setRecentResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/leaderboard")
      const data = await res.json()
      setEntries(data.leaderboard || [])
      setCompletedMatches(data.completedMatches || 0)
      setRecentResults(data.recentResults || [])
      setLoading(false)
    }
    fetchData()
    const interval = setInterval(fetchData, 120000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-28 bg-muted rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <IplBanner subtitle={`${completedMatches} matches completed · ${entries.length} players`} />

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-muted-foreground">
            No results yet. The leaderboard updates once matches are completed.
          </p>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 0, 2].map((idx) => {
              const entry = entries[idx]
              if (!entry) return <div key={idx} />
              const isMe = session?.user?.id === entry.userId
              const podiumOrder =
                idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3"
              return (
                <Card
                  key={entry.userId}
                  className={`bg-card text-card-foreground text-center ${podiumOrder} ${
                    idx === 0
                      ? "ring-2 ring-gold shadow-lg shadow-gold/10"
                      : "mt-4"
                  } ${isMe ? "bg-gold/5" : ""}`}
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="text-3xl mb-1">{medals[entry.rank - 1]}</div>
                    <div className="font-bold text-sm truncate">
                      {entry.displayName}
                      {isMe && (
                        <span className="text-gold text-[10px] block">(you)</span>
                      )}
                    </div>
                    <div className="text-3xl font-extrabold text-gold mt-1">
                      {entry.correctPicks}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      of {entry.totalPicks} picked
                    </div>
                    {/* Accuracy bar */}
                    <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${entry.accuracy}%`,
                          backgroundColor:
                            entry.accuracy >= 60
                              ? "#22c55e"
                              : entry.accuracy >= 40
                              ? "#eab308"
                              : "#ef4444",
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {entry.accuracy}% accuracy
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Full Rankings Table */}
          <Card className="bg-card text-card-foreground overflow-hidden">
            <div className="px-4 py-3 bg-black/5 border-b border-border/50">
              <span className="text-sm font-semibold">Full Rankings</span>
            </div>
            <CardContent className="p-0">
              {entries.map((entry, i) => {
                const isMe = session?.user?.id === entry.userId
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i !== entries.length - 1 ? "border-b border-border/30" : ""
                    } ${isMe ? "bg-gold/5" : ""} transition-colors hover:bg-black/5`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-10 text-center">
                        {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
                      </span>
                      <div>
                        <div className="font-medium text-sm">
                          {entry.displayName}
                          {isMe && (
                            <span className="text-gold ml-1.5 text-xs font-normal">
                              (you)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{entry.username}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Mini accuracy bar */}
                      <div className="hidden md:flex items-center gap-2 w-24">
                        <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${entry.accuracy}%`,
                              backgroundColor:
                                entry.accuracy >= 60
                                  ? "#22c55e"
                                  : entry.accuracy >= 40
                                  ? "#eab308"
                                  : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {entry.accuracy}%
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gold text-lg">
                          {entry.correctPicks}
                          <span className="text-xs text-muted-foreground font-normal">
                            /{entry.totalPicks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Recent Match Results */}
          {recentResults.length > 0 && (
            <Card className="bg-card text-card-foreground overflow-hidden">
              <div className="px-4 py-3 bg-black/5 border-b border-border/50">
                <span className="text-sm font-semibold">Recent Results</span>
              </div>
              <CardContent className="p-0">
                {recentResults.map((result, i) => (
                  <div
                    key={result.matchId}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i !== recentResults.length - 1 ? "border-b border-border/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">
                        #{result.matchId}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            result.winner === result.home ? "" : "opacity-40"
                          }`}
                          style={{ color: result.homeColor }}
                        >
                          {result.home}
                        </span>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <span
                          className={`font-bold text-sm ${
                            result.winner === result.away ? "" : "opacity-40"
                          }`}
                          style={{ color: result.awayColor }}
                        >
                          {result.away}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.winner ? (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              (result.winner === result.home
                                ? result.homeColor
                                : result.awayColor) + "20",
                            color:
                              result.winner === result.home
                                ? result.homeColor
                                : result.awayColor,
                          }}
                        >
                          {result.winner} won
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No result</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
