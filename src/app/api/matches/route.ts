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

  // Get playoff team assignments from DB
  const playoffTeams = await prisma.playoffTeam.findMany()
  const playoffTeamsMap = new Map(playoffTeams.map((p) => [p.matchId, p]))

  const matches = SCHEDULE.map((match) => {
    const result = resultsMap.get(match.matchId)
    const pick = picksMap.get(match.matchId)
    const locked = isMatchLocked(match.matchId)

    // Apply playoff team override from DB if available
    const playoffOverride = playoffTeamsMap.get(match.matchId)
    const home = playoffOverride?.home ?? match.home
    const away = playoffOverride?.away ?? match.away

    return {
      ...match,
      home,
      away,
      homeTeam: TEAMS[home] ?? TEAMS["TBD"],
      awayTeam: TEAMS[away] ?? TEAMS["TBD"],
      isLocked: locked,
      status: result?.status || (locked ? "live" : "upcoming"),
      winner: result?.winner || null,
      userPick: pick?.teamPick || null,
      isCorrect: pick?.isCorrect ?? null,
    }
  })

  return NextResponse.json({ matches })
}
