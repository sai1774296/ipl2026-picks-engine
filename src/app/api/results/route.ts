import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = await prisma.matchResult.findMany({
    orderBy: { matchId: "asc" },
  })

  return NextResponse.json({ results })
}
