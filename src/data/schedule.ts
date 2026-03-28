export interface Team {
  code: string
  name: string
  primary: string
  secondary: string
}

export interface Match {
  matchId: number
  date: string // ISO 8601 UTC
  home: string // team code
  away: string // team code
  venue: string
}

export const TEAMS: Record<string, Team> = {
  RCB: { code: "RCB", name: "Royal Challengers Bengaluru", primary: "#EC1C24", secondary: "#000000" },
  SRH: { code: "SRH", name: "Sunrisers Hyderabad", primary: "#F7A721", secondary: "#E8461F" },
  MI:  { code: "MI",  name: "Mumbai Indians", primary: "#004BA0", secondary: "#D1AB3E" },
  KKR: { code: "KKR", name: "Kolkata Knight Riders", primary: "#2E0854", secondary: "#B3922E" },
  CSK: { code: "CSK", name: "Chennai Super Kings", primary: "#FDB913", secondary: "#0081C8" },
  PBKS:{ code: "PBKS",name: "Punjab Kings", primary: "#ED1B24", secondary: "#A9A9A9" },
  GT:  { code: "GT",  name: "Gujarat Titans", primary: "#1C1C1C", secondary: "#AEC6CF" },
  DC:  { code: "DC",  name: "Delhi Capitals", primary: "#0078BC", secondary: "#EF1B23" },
  RR:  { code: "RR",  name: "Rajasthan Royals", primary: "#2D74B3", secondary: "#EA1A85" },
  LSG: { code: "LSG", name: "Lucknow Super Giants", primary: "#A72056", secondary: "#FEBE10" },
}

// All times in UTC. 19:30 IST = 14:00 UTC. 15:30 IST = 10:00 UTC.
export const SCHEDULE: Match[] = [
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
  // Playoff matches (71-74) to be added when teams qualify
]

export function getMatchById(matchId: number): Match | undefined {
  return SCHEDULE.find((m) => m.matchId === matchId)
}

export function isMatchLocked(matchId: number): boolean {
  const match = getMatchById(matchId)
  if (!match) return true
  return new Date() >= new Date(match.date)
}

export function getTeamCodes(matchId: number): [string, string] | null {
  const match = getMatchById(matchId)
  if (!match) return null
  return [match.home, match.away]
}
