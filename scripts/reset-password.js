/**
 * reset-password.js — Reset a user's password as admin.
 *
 * Usage:
 *   node scripts/reset-password.js <username> <newPassword>
 *
 * Example:
 *   node scripts/reset-password.js ketan newpass123
 */

const path = require("path")
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true })

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

async function main() {
  const username = process.argv[2]
  const newPassword = process.argv[3]

  if (!username || !newPassword) {
    console.error("Usage: node scripts/reset-password.js <username> <newPassword>")
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    })

    if (!user) {
      console.error(`❌ User "${username}" not found.`)
      const all = await prisma.user.findMany({ select: { username: true, displayName: true } })
      console.log("\nAll users:")
      all.forEach((u) => console.log(`  • ${u.username} (${u.displayName})`))
      process.exit(1)
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    console.log(`✅ Password reset for ${user.displayName} (@${user.username})`)
    console.log(`   They can now log in with: ${newPassword}`)
  } finally {
    await prisma.$disconnect()
  }
}

main()
