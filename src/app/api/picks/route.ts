import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMatchById, isMatchLocked, getTeamCodes } from "@/data/schedule"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const picks = await prisma.pick.findMany({
    where: { userId: session.user.id },
    orderBy: { matchId: "asc" },
  })

  return NextResponse.json({ picks })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!session.user.approved) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 })
  }

  const { matchId, teamPick } = await req.json()

  // Validate match exists
  const match = getMatchById(matchId)
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  // Validate team is in this match
  const teams = getTeamCodes(matchId)
  if (!teams || !teams.includes(teamPick)) {
    return NextResponse.json({ error: "Invalid team for this match" }, { status: 400 })
  }

  // CRITICAL: check match is not locked
  if (isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Match has already started. Picks are locked." }, { status: 403 })
  }

  // Upsert the pick
  const pick = await prisma.pick.upsert({
    where: {
      userId_matchId: {
        userId: session.user.id,
        matchId,
      },
    },
    update: { teamPick },
    create: {
      userId: session.user.id,
      matchId,
      teamPick,
    },
  })

  return NextResponse.json({ pick })
}
