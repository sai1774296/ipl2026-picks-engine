import { TEAMS } from "@/data/schedule"

const BASE_URL = "https://api.cricapi.com/v1"

interface CricApiMatch {
  id: string
  name: string
  status: string
  matchType: string
  venue: string
  date: string
  teams: string[]
  score?: { r: number; w: number; o: number; inning: string }[]
  matchWinner?: string
  matchEnded?: boolean
}

interface CricApiResponse {
  status: string
  data: CricApiMatch[] | CricApiMatch | { matchList?: CricApiMatch[] }
  info?: { hitsToday: number; hitsLimit: number }
}

// Map CricAPI team names to our team codes
const TEAM_NAME_MAP: Record<string, string> = {
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Sunrisers Hyderabad": "SRH",
  "Mumbai Indians": "MI",
  "Kolkata Knight Riders": "KKR",
  "Chennai Super Kings": "CSK",
  "Punjab Kings": "PBKS",
  "Kings XI Punjab": "PBKS",
  "Gujarat Titans": "GT",
  "Delhi Capitals": "DC",
  "Delhi Daredevils": "DC",
  "Rajasthan Royals": "RR",
  "Lucknow Super Giants": "LSG",
}

function mapTeamName(name: string): string | null {
  // Direct match
  if (TEAM_NAME_MAP[name]) return TEAM_NAME_MAP[name]
  // Partial match
  for (const [fullName, code] of Object.entries(TEAM_NAME_MAP)) {
    if (name.includes(fullName) || fullName.includes(name)) return code
  }
  // Check if it's already a code
  if (TEAMS[name]) return name
  return null
}

export async function findIPLSeriesId(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/series?apikey=${apiKey}&offset=0&search=IPL%202026`
    )
    const data: CricApiResponse = await res.json()
    if (data.status !== "success" || !Array.isArray(data.data)) return null

    // Find the IPL 2026 series
    const series = (data.data as { id: string; name: string }[]).find(
      (s) =>
        s.name.toLowerCase().includes("ipl") &&
        s.name.includes("2026")
    )
    return series?.id || null
  } catch (e) {
    console.error("[CricAPI] Failed to find IPL series:", e)
    return null
  }
}

export async function fetchMatchResults(
  apiKey: string,
  seriesId: string
): Promise<
  { teams: string[]; winner: string | null; status: string; name: string }[]
> {
  try {
    const res = await fetch(
      `${BASE_URL}/series_info?apikey=${apiKey}&id=${seriesId}`
    )
    const data: CricApiResponse = await res.json()
    if (data.status !== "success") return []

    const seriesData = data.data as { matchList?: CricApiMatch[] }
    const matches = seriesData.matchList || []

    return matches
      .filter(
        (m) =>
          m.matchEnded ||
          m.status?.toLowerCase().includes("won") ||
          m.status?.toLowerCase().includes("no result") ||
          m.status?.toLowerCase().includes("tied")
      )
      .map((m) => {
        let winner: string | null = null

        // Try matchWinner field first
        if (m.matchWinner) {
          winner = mapTeamName(m.matchWinner)
        }

        // Parse from status string: "Team Name won by X runs/wickets"
        if (!winner && m.status) {
          const wonMatch = m.status.match(/^(.+?)\s+won\s+by/i)
          if (wonMatch) {
            winner = mapTeamName(wonMatch[1].trim())
          }
        }

        const status = m.status?.toLowerCase().includes("no result")
          ? "no_result"
          : winner
          ? "completed"
          : "completed"

        return {
          teams: m.teams?.map((t) => mapTeamName(t) || t) || [],
          winner,
          status,
          name: m.name || "",
        }
      })
  } catch (e) {
    console.error("[CricAPI] Failed to fetch match results:", e)
    return []
  }
}

// Fetch a single match by CricAPI match ID
export async function fetchSingleMatch(
  apiKey: string,
  cricApiMatchId: string
): Promise<{ winner: string | null; status: string } | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/match_info?apikey=${apiKey}&id=${cricApiMatchId}`
    )
    const data: CricApiResponse = await res.json()
    if (data.status !== "success") return null

    const match = data.data as CricApiMatch
    let winner: string | null = null

    if (match.matchWinner) {
      winner = mapTeamName(match.matchWinner)
    }

    if (!winner && match.status) {
      const wonMatch = match.status.match(/^(.+?)\s+won\s+by/i)
      if (wonMatch) {
        winner = mapTeamName(wonMatch[1].trim())
      }
    }

    const status = match.status?.toLowerCase().includes("no result")
      ? "no_result"
      : match.matchEnded
      ? "completed"
      : "upcoming"

    return { winner, status }
  } catch (e) {
    console.error("[CricAPI] Failed to fetch single match:", e)
    return null
  }
}
