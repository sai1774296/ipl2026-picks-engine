/**
 * find-groups.js — One-time helper to find your WhatsApp group ID.
 *
 * Run: node scripts/find-groups.js
 *
 * 1. A QR code will appear in the terminal.
 * 2. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device.
 * 3. Scan the QR code.
 * 4. All your group chats will be listed with their IDs.
 * 5. Copy the ID of your IPL group (ends in @g.us) into notify-picks.js.
 * 6. To disconnect: WhatsApp on phone → Linked Devices → Remove this device.
 */

const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
})

client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp:\n")
  qrcode.generate(qr, { small: true })
  console.log("\nWhatsApp → Settings → Linked Devices → Link a Device\n")
})

client.on("ready", async () => {
  console.log("\n✅ Connected! Fetching your group chats...\n")
  const chats = await client.getChats()
  const groups = chats.filter((c) => c.isGroup)

  if (groups.length === 0) {
    console.log("No groups found.")
  } else {
    console.log("Your WhatsApp Groups:\n")
    groups.forEach((g) => {
      console.log(`  Name : ${g.name}`)
      console.log(`  ID   : ${g.id._serialized}`)
      console.log()
    })
    console.log("Copy the ID of your IPL picks group into scripts/notify-picks.js")
  }
  await client.destroy()
  process.exit(0)
})

client.on("auth_failure", () => {
  console.error("❌ Auth failed. Delete .wwebjs_auth/ and try again.")
  process.exit(1)
})

client.initialize()
