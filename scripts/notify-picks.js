/**
 * notify-picks.js — Post a WhatsApp picks sheet when a match locks.
 *
 * Usage:
 *   node scripts/notify-picks.js <matchNumber>
 *   node scripts/notify-picks.js 3
 *   node scripts/notify-picks.js 1 --dry-run   # print message, no WhatsApp
 *
 * First run:
 *   1. Set GROUP_ID below (run find-groups.js first to get your group's ID).
 *   2. Run this script — a QR code appears.
 *   3. Scan with WhatsApp → Settings → Linked Devices → Link a Device.
 *   4. Session is saved in .wwebjs_auth/ — no re-scan needed next time.
 *
 * To disconnect:
 *   WhatsApp on phone → Settings → Linked Devices → Remove this device.
 *   OR delete scripts/.wwebjs_auth/
 */

// ─────────────────────────────────────────────────────────────
// CONFIGURE THIS: Paste your group's ID from find-groups.js
// Example: "120363XXXXXXXXXX@g.us"
const GROUP_ID = "120363425233295422@g.us"
// ─────────────────────────────────────────────────────────────

const path = require("path")
// Load scripts/.env if present (put RAILWAY DATABASE_URL there)
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true })

const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const { PrismaClient } = require("@prisma/client")

// IPL 2026 schedule (mirror of src/data/schedule.ts — keep in sync)
const SCHEDULE = [
  { matchId: 1,  date: "2026-03-28T14:00:00Z", home: "RCB",  away: "SRH",  venue: "Bengaluru" },
  { matchId: 2,  date: "2026-03-29T14:00:00Z", home: "MI",   away: "KKR",  venue: "Mumbai" },
  { matchId: 3,  date: "2026-03-30T14:00:00Z", home: "RR",   away: "CSK",  venue: "Guwahati" },
  { matchId: 4,  date: "2026-03-31T14:00:00Z", home: "PBKS", away: "GT",   venue: "New Chandigarh" },
  { matchId: 5,  date: "2026-04-01T14:00:00Z", home: "LSG",  away: "DC",   venue: "Lucknow" },
  { matchId: 6,  date: "2026-04-02T14:00:00Z", home: "KKR",  away: "SRH",  venue: "Kolkata" },
  { matchId: 7,  date: "2026-04-03T14:00:00Z", home: "CSK",  away: "PBKS", venue: "Chennai" },
  { matchId: 8,  date: "2026-04-04T10:00:00Z", home: "DC",   away: "MI",   venue: "Delhi" },
  { matchId: 9,  date: "2026-04-04T14:00:00Z", home: "GT",   away: "RR",   venue: "Ahmedabad" },
  { matchId: 10, date: "2026-04-05T10:00:00Z", home: "SRH",  away: "LSG",  venue: "Hyderabad" },
  { matchId: 11, date: "2026-04-05T14:00:00Z", home: "RCB",  away: "CSK",  venue: "Bengaluru" },
  { matchId: 12, date: "2026-04-06T14:00:00Z", home: "KKR",  away: "PBKS", venue: "Kolkata" },
  { matchId: 13, date: "2026-04-07T14:00:00Z", home: "RR",   away: "MI",   venue: "Guwahati" },
  { matchId: 14, date: "2026-04-08T14:00:00Z", home: "DC",   away: "GT",   venue: "Delhi" },
  { matchId: 15, date: "2026-04-09T14:00:00Z", home: "KKR",  away: "LSG",  venue: "Kolkata" },
  { matchId: 16, date: "2026-04-10T14:00:00Z", home: "RR",   away: "RCB",  venue: "Guwahati" },
  { matchId: 17, date: "2026-04-11T10:00:00Z", home: "PBKS", away: "SRH",  venue: "New Chandigarh" },
  { matchId: 18, date: "2026-04-11T14:00:00Z", home: "CSK",  away: "DC",   venue: "Chennai" },
  { matchId: 19, date: "2026-04-12T10:00:00Z", home: "LSG",  away: "GT",   venue: "Lucknow" },
  { matchId: 20, date: "2026-04-12T14:00:00Z", home: "MI",   away: "RCB",  venue: "Mumbai" },
  { matchId: 21, date: "2026-04-13T14:00:00Z", home: "SRH",  away: "RR",   venue: "Hyderabad" },
  { matchId: 22, date: "2026-04-14T14:00:00Z", home: "CSK",  away: "KKR",  venue: "Chennai" },
  { matchId: 23, date: "2026-04-15T14:00:00Z", home: "RCB",  away: "LSG",  venue: "Bengaluru" },
  { matchId: 24, date: "2026-04-16T14:00:00Z", home: "MI",   away: "PBKS", venue: "Mumbai" },
  { matchId: 25, date: "2026-04-17T14:00:00Z", home: "GT",   away: "KKR",  venue: "Ahmedabad" },
  { matchId: 26, date: "2026-04-18T10:00:00Z", home: "RCB",  away: "DC",   venue: "Bengaluru" },
  { matchId: 27, date: "2026-04-18T14:00:00Z", home: "SRH",  away: "CSK",  venue: "Hyderabad" },
  { matchId: 28, date: "2026-04-19T10:00:00Z", home: "KKR",  away: "RR",   venue: "Kolkata" },
  { matchId: 29, date: "2026-04-19T14:00:00Z", home: "PBKS", away: "LSG",  venue: "New Chandigarh" },
  { matchId: 30, date: "2026-04-20T14:00:00Z", home: "GT",   away: "MI",   venue: "Ahmedabad" },
  { matchId: 31, date: "2026-04-21T14:00:00Z", home: "SRH",  away: "DC",   venue: "Hyderabad" },
  { matchId: 32, date: "2026-04-22T14:00:00Z", home: "LSG",  away: "RR",   venue: "Lucknow" },
  { matchId: 33, date: "2026-04-23T14:00:00Z", home: "MI",   away: "CSK",  venue: "Mumbai" },
  { matchId: 34, date: "2026-04-24T14:00:00Z", home: "RCB",  away: "GT",   venue: "Bengaluru" },
  { matchId: 35, date: "2026-04-25T10:00:00Z", home: "DC",   away: "PBKS", venue: "Delhi" },
  { matchId: 36, date: "2026-04-25T14:00:00Z", home: "RR",   away: "SRH",  venue: "Jaipur" },
  { matchId: 37, date: "2026-04-26T10:00:00Z", home: "GT",   away: "CSK",  venue: "Ahmedabad" },
  { matchId: 38, date: "2026-04-26T14:00:00Z", home: "LSG",  away: "KKR",  venue: "Lucknow" },
  { matchId: 39, date: "2026-04-27T14:00:00Z", home: "DC",   away: "RCB",  venue: "Delhi" },
  { matchId: 40, date: "2026-04-28T14:00:00Z", home: "PBKS", away: "RR",   venue: "New Chandigarh" },
  { matchId: 41, date: "2026-04-29T14:00:00Z", home: "MI",   away: "SRH",  venue: "Mumbai" },
  { matchId: 42, date: "2026-04-30T14:00:00Z", home: "GT",   away: "RCB",  venue: "Ahmedabad" },
  { matchId: 43, date: "2026-05-01T14:00:00Z", home: "RR",   away: "DC",   venue: "Jaipur" },
  { matchId: 44, date: "2026-05-02T14:00:00Z", home: "CSK",  away: "MI",   venue: "Chennai" },
  { matchId: 45, date: "2026-05-03T10:00:00Z", home: "SRH",  away: "KKR",  venue: "Hyderabad" },
  { matchId: 46, date: "2026-05-03T14:00:00Z", home: "GT",   away: "PBKS", venue: "Ahmedabad" },
  { matchId: 47, date: "2026-05-04T14:00:00Z", home: "MI",   away: "LSG",  venue: "Mumbai" },
  { matchId: 48, date: "2026-05-05T14:00:00Z", home: "DC",   away: "CSK",  venue: "Delhi" },
  { matchId: 49, date: "2026-05-06T14:00:00Z", home: "SRH",  away: "PBKS", venue: "Hyderabad" },
  { matchId: 50, date: "2026-05-07T14:00:00Z", home: "LSG",  away: "RCB",  venue: "Lucknow" },
  { matchId: 51, date: "2026-05-08T14:00:00Z", home: "DC",   away: "KKR",  venue: "Delhi" },
  { matchId: 52, date: "2026-05-09T14:00:00Z", home: "RR",   away: "GT",   venue: "Jaipur" },
  { matchId: 53, date: "2026-05-10T10:00:00Z", home: "CSK",  away: "LSG",  venue: "Chennai" },
  { matchId: 54, date: "2026-05-10T14:00:00Z", home: "RCB",  away: "MI",   venue: "Raipur" },
  { matchId: 55, date: "2026-05-11T14:00:00Z", home: "PBKS", away: "DC",   venue: "Dharamshala" },
  { matchId: 56, date: "2026-05-12T14:00:00Z", home: "GT",   away: "SRH",  venue: "Ahmedabad" },
  { matchId: 57, date: "2026-05-13T14:00:00Z", home: "RCB",  away: "KKR",  venue: "Raipur" },
  { matchId: 58, date: "2026-05-14T14:00:00Z", home: "PBKS", away: "MI",   venue: "Dharamshala" },
  { matchId: 59, date: "2026-05-15T14:00:00Z", home: "LSG",  away: "CSK",  venue: "Lucknow" },
  { matchId: 60, date: "2026-05-16T14:00:00Z", home: "KKR",  away: "GT",   venue: "Kolkata" },
  { matchId: 61, date: "2026-05-17T10:00:00Z", home: "PBKS", away: "RCB",  venue: "Dharamshala" },
  { matchId: 62, date: "2026-05-17T14:00:00Z", home: "DC",   away: "RR",   venue: "Delhi" },
  { matchId: 63, date: "2026-05-18T14:00:00Z", home: "CSK",  away: "SRH",  venue: "Chennai" },
  { matchId: 64, date: "2026-05-19T14:00:00Z", home: "RR",   away: "LSG",  venue: "Jaipur" },
  { matchId: 65, date: "2026-05-20T14:00:00Z", home: "KKR",  away: "MI",   venue: "Kolkata" },
  { matchId: 66, date: "2026-05-21T14:00:00Z", home: "CSK",  away: "GT",   venue: "Chennai" },
  { matchId: 67, date: "2026-05-22T14:00:00Z", home: "SRH",  away: "RCB",  venue: "Hyderabad" },
  { matchId: 68, date: "2026-05-23T14:00:00Z", home: "LSG",  away: "PBKS", venue: "Lucknow" },
  { matchId: 69, date: "2026-05-24T10:00:00Z", home: "MI",   away: "RR",   venue: "Mumbai" },
  { matchId: 70, date: "2026-05-24T14:00:00Z", home: "KKR",  away: "DC",   venue: "Kolkata" },
]

// IST offset for display
function toIST(utcDate) {
  const d = new Date(utcDate)
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

async function getPicksMessage(matchId) {
  const match = SCHEDULE.find((m) => m.matchId === matchId)
  if (!match) throw new Error(`Match #${matchId} not found in schedule`)

  const prisma = new PrismaClient()
  try {
    const picks = await prisma.pick.findMany({
      where: { matchId },
      include: { user: { select: { displayName: true } } },
      orderBy: { createdAt: "asc" },
    })

    // Get total approved users for "X/Y picked" count
    const totalUsers = await prisma.user.count({ where: { approved: true } })

    // Group by team
    const byTeam = {}
    for (const pick of picks) {
      if (!byTeam[pick.teamPick]) byTeam[pick.teamPick] = []
      byTeam[pick.teamPick].push(pick.user.displayName)
    }

    const missed = totalUsers - picks.length

    // Build message
    const lines = [
      `🏏 *IPL 2026 — Match #${matchId}: ${match.home} vs ${match.away}*`,
      `📍 ${match.venue}  |  📅 ${toIST(match.date)} IST`,
      `⏰ Picks are *LOCKED!*`,
      ``,
    ]

    const teams = Object.keys(byTeam).sort()
    for (const team of teams) {
      const names = byTeam[team]
      lines.push(`*${team}* (${names.length})`)
      names.forEach((n) => lines.push(`  • ${n}`))
      lines.push(``)
    }

    lines.push(`📊 ${picks.length}/${totalUsers} picked${missed > 0 ? ` | ${missed} missed` : ""}`)
    lines.push(`🔒 No changes allowed. Good luck! 🤞`)

    return lines.join("\n")
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const matchArg = process.argv[2]
  const dryRun = process.argv.includes("--dry-run")

  if (!matchArg) {
    console.error("Usage: node scripts/notify-picks.js <matchNumber> [--dry-run]")
    console.error("Example: node scripts/notify-picks.js 3")
    console.error("Example: node scripts/notify-picks.js 1 --dry-run")
    process.exit(1)
  }

  const matchId = parseInt(matchArg, 10)
  if (isNaN(matchId)) {
    console.error("Match number must be a number")
    process.exit(1)
  }

  if (!dryRun && GROUP_ID === "PASTE_YOUR_GROUP_ID_HERE") {
    console.error("❌ Set GROUP_ID at the top of this file first.")
    console.error("   Run: node scripts/find-groups.js  to find your group ID.")
    console.error("   (Or use --dry-run to test without WhatsApp.)")
    process.exit(1)
  }

  console.log(`\n📋 Fetching picks for Match #${matchId}...`)
  let message
  try {
    message = await getPicksMessage(matchId)
  } catch (e) {
    console.error("Failed to fetch picks:", e.message)
    process.exit(1)
  }

  console.log("\n--- Message Preview ---")
  console.log(message)
  console.log("---\n")

  if (dryRun) {
    console.log("✅ Dry run complete — no WhatsApp message sent.")
    process.exit(0)
  }

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: "scripts/.wwebjs_auth" }),
    puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
  })

  client.on("qr", (qr) => {
    console.log("📱 First time setup — scan this QR code with WhatsApp:\n")
    qrcode.generate(qr, { small: true })
    console.log("\nWhatsApp → Settings → Linked Devices → Link a Device\n")
  })

  client.on("ready", async () => {
    console.log("✅ WhatsApp connected. Fetching chat...")
    try {
      const chat = await client.getChatById(GROUP_ID)
      if (!chat) {
        console.error("❌ Group not found. Check GROUP_ID.")
        process.exit(1)
      }
      console.log(`📨 Sending to: ${chat.name}`)
      const msg = await chat.sendMessage(message)
      console.log(`✅ Message sent! ID: ${msg.id.id}`)
      // Wait for delivery confirmation before disconnecting
      await new Promise((resolve) => setTimeout(resolve, 5000))
    } catch (e) {
      console.error("❌ Failed to send:", e.message)
    } finally {
      await client.destroy()
      process.exit(0)
    }
  })

  client.on("auth_failure", () => {
    console.error("❌ Auth failed. Delete scripts/.wwebjs_auth/ and try again.")
    process.exit(1)
  })

  client.initialize()
}

main()
