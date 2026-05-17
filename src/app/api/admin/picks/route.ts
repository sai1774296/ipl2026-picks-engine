import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMatchById, getTeamCodes } from "@/data/schedule"

// GET: fetch all picks for a specific user
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const picks = await prisma.pick.findMany({
    where: { userId },
    orderBy: { matchId: "asc" },
  })

  return NextResponse.json({ picks })
}

// POST: admin sets/updates a pick for any user (bypasses lock)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { userId, matchId, teamPick } = await req.json()

  if (!userId || !matchId || !teamPick) {
    return NextResponse.json({ error: "userId, matchId, and teamPick required" }, { status: 400 })
  }

  // Validate match exists
  const match = getMatchById(matchId)
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  // Validate team is in this match (check DB for playoff team overrides)
  const teams = getTeamCodes(matchId)
  if (!teams) {
    return NextResponse.json({ error: "Invalid team for this match" }, { status: 400 })
  }
  let validTeams: [string, string] = teams
  if (teams.includes("TBD")) {
    const playoffTeam = await prisma.playoffTeam.findUnique({ where: { matchId } })
    if (!playoffTeam) {
      return NextResponse.json({ error: "Teams not yet announced for this match" }, { status: 400 })
    }
    validTeams = [playoffTeam.home, playoffTeam.away]
  }
  if (!validTeams.includes(teamPick)) {
    return NextResponse.json({ error: "Invalid team for this match" }, { status: 400 })
  }

  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Check if result already exists for this match -- set isCorrect accordingly
  const matchResult = await prisma.matchResult.findUnique({ where: { matchId } })
  let isCorrect: boolean | null = null
  if (matchResult?.status === "completed" && matchResult.winner) {
    isCorrect = teamPick === matchResult.winner
  }

  // Upsert pick (admin bypasses lock)
  const pick = await prisma.pick.upsert({
    where: {
      userId_matchId: { userId, matchId },
    },
    update: { teamPick, isCorrect },
    create: { userId, matchId, teamPick, isCorrect },
  })

  return NextResponse.json({ pick })
}
