import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

  // Get completed match count
  const completedCount = await prisma.matchResult.count({
    where: { status: "completed" },
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

  return NextResponse.json({ leaderboard: ranked, completedMatches: completedCount })
}
