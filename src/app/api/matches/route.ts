import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { SCHEDULE, TEAMS, isMatchLocked } from "@/data/schedule"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all match results from DB
  const results = await prisma.matchResult.findMany()
  const resultsMap = new Map(results.map((r) => [r.matchId, r]))

  // Get current user's picks
  const picks = await prisma.pick.findMany({
    where: { userId: session.user.id },
  })
  const picksMap = new Map(picks.map((p) => [p.matchId, p]))

  const matches = SCHEDULE.map((match) => {
    const result = resultsMap.get(match.matchId)
    const pick = picksMap.get(match.matchId)
    const locked = isMatchLocked(match.matchId)

    return {
      ...match,
      homeTeam: TEAMS[match.home],
      awayTeam: TEAMS[match.away],
      isLocked: locked,
      status: result?.status || (locked ? "live" : "upcoming"),
      winner: result?.winner || null,
      userPick: pick?.teamPick || null,
      isCorrect: pick?.isCorrect ?? null,
    }
  })

  return NextResponse.json({ matches })
}
