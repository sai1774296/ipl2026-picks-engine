import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      approved: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { picks: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ users })
}
