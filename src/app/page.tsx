"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.approved) {
        router.push("/matches")
      } else {
        router.push("/pending")
      }
    }
  }, [status, session, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      setLoading(false)

      if (result?.error || result?.code) {
        setError("Invalid username or password. Need an account? Click 'Create an account' below.")
      } else if (result?.ok) {
        router.push("/matches")
        router.refresh()
      } else {
        setError("Sign in failed. Please try again.")
      }
    } catch {
      setLoading(false)
      setError("Sign in failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="text-4xl font-bold mb-2 text-gold">IPL 2026</div>
          <CardTitle className="text-xl">Picks Engine</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Predict match winners with your friends
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">New here? </span>
            <a href="/register" className="text-gold hover:underline font-medium">
              Create an account
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
