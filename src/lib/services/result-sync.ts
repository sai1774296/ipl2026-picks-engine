import { prisma } from "@/lib/db"
import { SCHEDULE, getTeamCodes } from "@/data/schedule"
import { findIPLSeriesId, fetchMatchResults } from "./cricapi"

// Match completed IPL matches from CricAPI to our schedule
function matchToSchedule(
  apiResult: { teams: string[]; winner: string | null; status: string; name: string },
  unresolvedMatchIds: number[]
): number | null {
  // Try to match by teams
  for (const matchId of unresolvedMatchIds) {
    const teams = getTeamCodes(matchId)
    if (!teams) continue
    const [home, away] = teams
    // Both teams must appear in the API result
    if (
      apiResult.teams.includes(home) &&
      apiResult.teams.includes(away)
    ) {
      return matchId
    }
  }
  return null
}

export async function syncResults(): Promise<{
  synced: number
  errors: string[]
}> {
  const apiKey = process.env.CRICAPI_KEY?.trim()
  if (!apiKey) {
    return { synced: 0, errors: ["CRICAPI_KEY not configured — set it in Railway → Variables"] }
  }

  const errors: string[] = []
  let synced = 0

  try {
    // Find unresolved matches that should have finished (started > 4 hours ago)
    const now = new Date()
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    const existingResults = await prisma.matchResult.findMany({
      where: { status: "completed" },
      select: { matchId: true },
    })
    const completedIds = new Set(existingResults.map((r) => r.matchId))

    // Matches that started but haven't been resolved
    const unresolvedMatches = SCHEDULE.filter(
      (m) =>
        new Date(m.date) <= fourHoursAgo && !completedIds.has(m.matchId)
    )

    if (unresolvedMatches.length === 0) {
      return { synced: 0, errors: [] }
    }

    const unresolvedIds = unresolvedMatches.map((m) => m.matchId)

    // Find IPL 2026 series
    const seriesId = await findIPLSeriesId(apiKey)
    if (!seriesId) {
      return { synced: 0, errors: ["Could not find IPL 2026 series on CricAPI"] }
    }

    // Fetch all completed match results from the series
    const apiResults = await fetchMatchResults(apiKey, seriesId)

    for (const apiResult of apiResults) {
      const matchId = matchToSchedule(apiResult, unresolvedIds)
      if (matchId === null) continue

      const winner = apiResult.winner
      const status = apiResult.status

      try {
        // Upsert match result
        await prisma.matchResult.upsert({
          where: { matchId },
          update: { winner, status },
          create: { matchId, winner, status },
        })

        // Update picks
        if (status === "completed" && winner) {
          await prisma.pick.updateMany({
            where: { matchId, teamPick: winner },
            data: { isCorrect: true },
          })
          await prisma.pick.updateMany({
            where: { matchId, teamPick: { not: winner } },
            data: { isCorrect: false },
          })
        } else if (status === "no_result") {
          await prisma.pick.updateMany({
            where: { matchId },
            data: { isCorrect: null },
          })
        }

        synced++
        // Remove from unresolved so we don't double-match
        const idx = unresolvedIds.indexOf(matchId)
        if (idx > -1) unresolvedIds.splice(idx, 1)

        console.log(
          `[ResultSync] Match ${matchId}: ${winner ? winner + " won" : status}`
        )
      } catch (e) {
        errors.push(`Failed to update match ${matchId}: ${e}`)
      }
    }
  } catch (e) {
    errors.push(`Sync failed: ${e}`)
  }

  console.log(`[ResultSync] Synced ${synced} results, ${errors.length} errors`)
  return { synced, errors }
}
