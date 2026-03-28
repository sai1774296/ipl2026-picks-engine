import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { SCHEDULE, TEAMS } from "@/data/schedule"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { approved: true },
    select: {
      id: true,
      displayName: true,
      username: true,
      picks: {
        select: { isCorrect: true, matchId: true },
      },
    },
  })

  // Get completed matches with results
  const completedResults = await prisma.matchResult.findMany({
    where: { status: "completed" },
    orderBy: { matchId: "desc" },
  })

  const leaderboard = users
    .map((user) => {
      const completedPicks = user.picks.filter((p) => p.isCorrect !== null)
      const correctPicks = user.picks.filter((p) => p.isCorrect === true).length
      const totalPicks = completedPicks.length
      const accuracy = totalPicks > 0 ? Math.round((correctPicks / totalPicks) * 100) : 0

      return {
        userId: user.id,
        displayName: user.displayName,
        username: user.username,
        correctPicks,
        totalPicks,
        accuracy,
      }
    })
    .sort((a, b) => b.correctPicks - a.correctPicks || b.accuracy - a.accuracy)

  // Assign ranks with tie handling
  let currentRank = 1
  const ranked = leaderboard.map((entry, i) => {
    if (i > 0 && entry.correctPicks < leaderboard[i - 1].correctPicks) {
      currentRank = i + 1
    }
    return { ...entry, rank: currentRank }
  })

  // Recent results (last 10 completed matches)
  const recentResults = completedResults.slice(0, 10).map((r) => {
    const match = SCHEDULE.find((m) => m.matchId === r.matchId)
    return {
      matchId: r.matchId,
      home: match?.home || "",
      away: match?.away || "",
      homeName: TEAMS[match?.home || ""]?.name || "",
      awayName: TEAMS[match?.away || ""]?.name || "",
      homeColor: TEAMS[match?.home || ""]?.primary || "#666",
      awayColor: TEAMS[match?.away || ""]?.primary || "#666",
      winner: r.winner,
      date: match?.date || "",
    }
  })

  return NextResponse.json({
    leaderboard: ranked,
    completedMatches: completedResults.length,
    recentResults,
  })
}
