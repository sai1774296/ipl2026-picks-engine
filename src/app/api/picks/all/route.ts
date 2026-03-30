import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { SCHEDULE, TEAMS } from "@/data/schedule"

export async function GET() {
  const session = await auth()
  if (!session?.user?.approved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const now = new Date()

  // Show picks for any match whose lock time (start time) has passed
  const lockedMatchIds = SCHEDULE
    .filter((m) => new Date(m.date) <= now)
    .map((m) => m.matchId)

  if (lockedMatchIds.length === 0) {
    return NextResponse.json({ rows: [] })
  }

  // Get all results for locked matches
  const results = await prisma.matchResult.findMany({
    where: { matchId: { in: lockedMatchIds } },
  })
  const resultMap = new Map(results.map((r) => [r.matchId, r]))

  // Get all picks for locked matches with user info
  const picks = await prisma.pick.findMany({
    where: { matchId: { in: lockedMatchIds } },
    include: {
      user: { select: { displayName: true, username: true } },
    },
    orderBy: [{ matchId: "asc" }, { createdAt: "asc" }],
  })

  // Build enriched rows
  const rows = picks.map((pick) => {
    const match = SCHEDULE.find((m) => m.matchId === pick.matchId)!
    const result = resultMap.get(pick.matchId)
    const homeTeam = TEAMS[match.home]
    const awayTeam = TEAMS[match.away]
    const pickedTeam = TEAMS[pick.teamPick]

    return {
      matchId: pick.matchId,
      matchLabel: `#${pick.matchId}: ${match.home} vs ${match.away}`,
      matchDate: match.date,
      home: match.home,
      away: match.away,
      homeColor: homeTeam?.primary ?? "#ffffff",
      awayColor: awayTeam?.primary ?? "#ffffff",
      userId: pick.userId,
      displayName: pick.user.displayName,
      teamPick: pick.teamPick,
      teamPickColor: pickedTeam?.primary ?? "#ffffff",
      winner: result?.winner ?? null,
      status: result?.status ?? "upcoming",
      isCorrect: pick.isCorrect,
    }
  })

  return NextResponse.json({ rows })
}
