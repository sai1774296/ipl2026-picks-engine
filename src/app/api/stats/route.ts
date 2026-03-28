import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TEAMS, SCHEDULE } from "@/data/schedule"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const picks = await prisma.pick.findMany({
    where: { userId: session.user.id },
    orderBy: { matchId: "asc" },
  })

  const resolved = picks.filter((p) => p.isCorrect !== null)
  const correct = picks.filter((p) => p.isCorrect === true).length
  const total = resolved.length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Current streak
  let streak = 0
  for (let i = resolved.length - 1; i >= 0; i--) {
    if (resolved[i].isCorrect) streak++
    else break
  }

  // Best streak
  let bestStreak = 0
  let currentStreak = 0
  for (const p of resolved) {
    if (p.isCorrect) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  // Per-team breakdown
  const teamStats: Record<string, { picked: number; correct: number }> = {}
  for (const code of Object.keys(TEAMS)) {
    teamStats[code] = { picked: 0, correct: 0 }
  }
  for (const p of picks) {
    if (teamStats[p.teamPick]) {
      teamStats[p.teamPick].picked++
      if (p.isCorrect) teamStats[p.teamPick].correct++
    }
  }

  // Recent form (last 10 resolved)
  const recentForm = resolved.slice(-10).map((p) => ({
    matchId: p.matchId,
    teamPick: p.teamPick,
    isCorrect: p.isCorrect,
  }))

  // Match history: all picks with results
  const matchResults = await prisma.matchResult.findMany({
    where: { status: "completed" },
  })
  const resultsMap = new Map(matchResults.map((r) => [r.matchId, r]))

  const matchHistory = picks
    .filter((p) => p.isCorrect !== null)
    .map((p) => {
      const match = SCHEDULE.find((m) => m.matchId === p.matchId)
      const result = resultsMap.get(p.matchId)
      return {
        matchId: p.matchId,
        home: match?.home || "",
        away: match?.away || "",
        homeColor: TEAMS[match?.home || ""]?.primary || "#666",
        awayColor: TEAMS[match?.away || ""]?.primary || "#666",
        date: match?.date || "",
        teamPick: p.teamPick,
        winner: result?.winner || null,
        isCorrect: p.isCorrect,
      }
    })
    .sort((a, b) => b.matchId - a.matchId)

  return NextResponse.json({
    totalPicks: picks.length,
    resolvedPicks: total,
    correctPicks: correct,
    accuracy,
    currentStreak: streak,
    bestStreak,
    teamStats,
    recentForm,
    matchHistory,
  })
}
