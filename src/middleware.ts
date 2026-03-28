import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

  // Public routes — no auth needed
  if (
        pathname === "/" ||
        pathname === "/register" ||
        pathname.startsWith("/api/auth")
      ) {
        return NextResponse.next()
  }

  // Auth.js v5 uses __Secure-authjs.session-token on HTTPS, authjs.session-token on HTTP
  const isSecure = req.url.startsWith("https://")
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
          : "authjs.session-token"

  const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName,
  })

  // Not logged in
  if (!token) {
        return NextResponse.redirect(new URL("/", req.url))
  }

  // Logged in but not approved
  if (!token.approved && pathname !== "/pending") {
        return NextResponse.redirect(new URL("/pending", req.url))
  }

  // Approved but trying to access pending page
  if (token.approved && pathname === "/pending") {
        return NextResponse.redirect(new URL("/matches", req.url))
  }

  // Admin routes
  if (
        (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
        !token.isAdmin
      ) {
        return NextResponse.redirect(new URL("/matches", req.url))
  }

  return NextResponse.next()
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)"],
}
