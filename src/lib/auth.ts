import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: credentials.username as string,
              mode: "insensitive",
            },
          },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          approved: user.approved,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!
        token.username = user.username
        token.displayName = user.displayName
        token.approved = user.approved
        token.isAdmin = user.isAdmin
      }
      // Re-fetch from DB only on explicit session update (not on every request)
      // This avoids Prisma in Edge Runtime (middleware)
      if (trigger === "update") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
          })
          if (dbUser) {
            token.approved = dbUser.approved
            token.isAdmin = dbUser.isAdmin
            token.displayName = dbUser.displayName
          }
        } catch {
          // Prisma not available in edge — skip
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.displayName = token.displayName as string
      session.user.approved = token.approved as boolean
      session.user.isAdmin = token.isAdmin as boolean
      return session
    },
  },
})
