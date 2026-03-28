import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      displayName: string
      approved: boolean
      isAdmin: boolean
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    displayName: string
    approved: boolean
    isAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    displayName: string
    approved: boolean
    isAdmin: boolean
  }
}
