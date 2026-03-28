import { SCHEDULE } from "@/data/schedule"
import { syncResults } from "./services/result-sync"

// T20 match ~3.5 hours + 30 min buffer = 4 hours after start
const MATCH_DURATION_MS = 4 * 60 * 60 * 1000

let scheduledTimeouts: ReturnType<typeof setTimeout>[] = []
let fallbackInterval: ReturnType<typeof setInterval> | null = null

function scheduleMatchSync(match: { matchId: number; date: string }) {
  const matchStart = new Date(match.date).getTime()
  const syncTime = matchStart + MATCH_DURATION_MS
  const now = Date.now()
  const delay = syncTime - now

  if (delay <= 0) {
    // Match should already be done — sync immediately on startup
    console.log(`[Cron] Match ${match.matchId} overdue — syncing now`)
    syncResults().catch(console.error)
    return
  }

  if (delay > 2147483647) return // setTimeout max (~24.8 days), skip far future

  console.log(
    `[Cron] Match ${match.matchId} sync scheduled for ${new Date(syncTime).toISOString()} (in ${Math.round(delay / 60000)} min)`
  )

  const timeout = setTimeout(async () => {
    console.log(`[Cron] Triggering sync for Match ${match.matchId}`)
    const result = await syncResults()
    console.log(`[Cron] Match ${match.matchId} sync: ${result.synced} synced`)

    // If no result found, retry after 30 minutes (match might still be going)
    if (result.synced === 0 && result.errors.length === 0) {
      console.log(`[Cron] Match ${match.matchId} not found yet — retrying in 30 min`)
      const retryTimeout = setTimeout(() => {
        syncResults().catch(console.error)
      }, 30 * 60 * 1000)
      scheduledTimeouts.push(retryTimeout)
    }
  }, delay)

  scheduledTimeouts.push(timeout)
}

export function startCronJobs() {
  if (typeof window !== "undefined") return // client-side guard
  if (!process.env.CRICAPI_KEY) {
    console.log("[Cron] CRICAPI_KEY not set — skipping auto-sync scheduling")
    return
  }

  console.log("[Cron] Starting match result sync scheduler")

  // Clear any previous schedules
  scheduledTimeouts.forEach(clearTimeout)
  scheduledTimeouts = []
  if (fallbackInterval) clearInterval(fallbackInterval)

  const now = Date.now()

  // Schedule syncs for each match that hasn't been resolved yet
  // Only schedule matches within the next 25 days (setTimeout limit)
  const maxFuture = now + 24 * 24 * 60 * 60 * 1000
  const relevantMatches = SCHEDULE.filter((m) => {
    const matchEnd = new Date(m.date).getTime() + MATCH_DURATION_MS
    return matchEnd > now - 60 * 60 * 1000 && new Date(m.date).getTime() < maxFuture
  })

  for (const match of relevantMatches) {
    scheduleMatchSync(match)
  }

  console.log(`[Cron] Scheduled syncs for ${relevantMatches.length} matches`)

  // Fallback: also run a general sync every 6 hours to catch anything missed
  fallbackInterval = setInterval(
    () => {
      console.log("[Cron] Fallback 6-hour sync running")
      syncResults().catch(console.error)
    },
    6 * 60 * 60 * 1000
  )
}
