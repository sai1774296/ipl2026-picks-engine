import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.approved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Only show picks for completed matches (prevent copying)
  const completedMatches = await prisma.matchResult.findMany({
    where: { status: "completed" },
    select: { matchId: true },
  })
  const completedIds = completedMatches.map((m) => m.matchId)

  const picks = await prisma.pick.findMany({
    where: { matchId: { in: completedIds } },
    include: {
      user: {
        select: { id: true, displayName: true, username: true },
      },
    },
    orderBy: { matchId: "asc" },
  })

  return NextResponse.json({ picks })
}
