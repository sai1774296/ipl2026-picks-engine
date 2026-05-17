import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { SCHEDULE } from "@/data/schedule"

const PLAYOFF_MATCH_IDS = [71, 72, 73, 74]

export async function GET() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const playoffTeams = await prisma.playoffTeam.findMany()
  return NextResponse.json({ playoffTeams })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { matchId, home, away } = await req.json()

  if (!PLAYOFF_MATCH_IDS.includes(matchId)) {
    return NextResponse.json({ error: "Not a playoff match" }, { status: 400 })
  }
  if (!home || !away) {
    return NextResponse.json({ error: "home and away required" }, { status: 400 })
  }
  if (home === away) {
    return NextResponse.json({ error: "home and away must be different teams" }, { status: 400 })
  }

  // Validate both teams exist in schedule
  const match = SCHEDULE.find((m) => m.matchId === matchId)
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  const playoffTeam = await prisma.playoffTeam.upsert({
    where: { matchId },
    update: { home, away },
    create: { matchId, home, away },
  })

  return NextResponse.json({ success: true, playoffTeam })
}
