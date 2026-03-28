import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { userId, approved } = await req.json()

  if (!userId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { approved },
  })

  return NextResponse.json({ success: true, user })
}
