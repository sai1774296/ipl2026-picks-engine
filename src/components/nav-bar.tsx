"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/matches", label: "Matches", icon: "&#9917;" },
  { href: "/leaderboard", label: "Board", icon: "&#127942;" },
  { href: "/stats", label: "Stats", icon: "&#128202;" },
]

export function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const allItems = session?.user?.isAdmin
    ? [...navItems, { href: "/admin", label: "Admin", icon: "&#9881;" }]
    : navItems

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-pitch-dark border-b border-border sticky top-0 z-50">
        <Link href="/matches" className="text-lg font-bold text-gold">
          IPL 2026 Picks
        </Link>
        <div className="flex items-center gap-6">
          {allItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-gold",
                pathname === item.href
                  ? "text-gold"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
            <span className="text-sm text-muted-foreground">
              {session?.user?.displayName}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-pitch-dark border-t border-border z-50 safe-area-pb">
        <div className="flex justify-around py-2">
          {allItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                pathname === item.href
                  ? "text-gold"
                  : "text-muted-foreground"
              )}
            >
              <span
                className="text-lg"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
