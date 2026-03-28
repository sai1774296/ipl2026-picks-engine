import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncResults } from "@/lib/services/result-sync"

export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const result = await syncResults()
  return NextResponse.json(result)
}
