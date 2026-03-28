"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PendingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  // Poll for approval every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await update()
      if (updated?.user?.approved) {
        router.push("/matches")
        router.refresh()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [update, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-cream text-card-foreground text-center">
        <CardHeader>
          <div className="text-4xl mb-2">&#9203;</div>
          <CardTitle className="text-xl">Waiting for Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Hey <span className="font-medium text-card-foreground">{session?.user?.displayName}</span>,
            your account is pending admin approval. You&apos;ll be redirected automatically once approved.
          </p>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
