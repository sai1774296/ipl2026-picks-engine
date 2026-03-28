import { NavBar } from "@/components/nav-bar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <NavBar />
      {/* Mobile: add bottom padding for tab bar */}
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  )
}
