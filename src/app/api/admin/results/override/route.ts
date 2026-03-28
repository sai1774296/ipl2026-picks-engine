import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMatchById, getTeamCodes } from "@/data/schedule"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { matchId, winner, status } = await req.json()

  const match = getMatchById(matchId)
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  // Validate winner is one of the teams or null
  if (winner) {
    const teams = getTeamCodes(matchId)
    if (!teams || !teams.includes(winner)) {
      return NextResponse.json({ error: "Invalid winner" }, { status: 400 })
    }
  }

  // Upsert match result
  await prisma.matchResult.upsert({
    where: { matchId },
    update: { winner, status },
    create: { matchId, winner, status },
  })

  // Update all picks for this match
  if (status === "completed" && winner) {
    await prisma.pick.updateMany({
      where: { matchId, teamPick: winner },
      data: { isCorrect: true },
    })
    await prisma.pick.updateMany({
      where: { matchId, teamPick: { not: winner } },
      data: { isCorrect: false },
    })
  } else if (status === "no_result") {
    await prisma.pick.updateMany({
      where: { matchId },
      data: { isCorrect: null },
    })
  }

  return NextResponse.json({ success: true })
}
