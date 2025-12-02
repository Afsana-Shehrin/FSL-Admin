export interface Sport {
  id: string
  name: string
  icon: string
  displayOrder: number
  isActive: boolean
  createdAt: string
}

export interface League {
  id: string
  name: string
  sportId: string
  description: string
  isActive: boolean
  createdAt: string
}

export interface Season {
  id: string
  leagueId: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface Gameweek {
  id: string
  seasonId: string
  name: string
  number: number
  startDate: string
  endDate: string
  deadline: string
  status: "upcoming" | "live" | "completed"
  isLocked?: boolean
}

export interface Team {
  id: string
  name: string
  code: string
  sportId: string
  logo: string
  primaryColor: string
  secondaryColor: string
  isActive: boolean
}

export interface Player {
  id: string
  name: string
  teamId: string
  sportId: string
  position: string
  price: number
  availability: "available" | "injured" | "suspended" | "doubtful"
  news: string
  photo: string
  stats: Record<string, number>
}

export interface Fixture {
  id: string
  gameweekId: string
  homeTeamId: string
  awayTeamId: string
  kickoffTime: string
  venue: string
  status: "scheduled" | "live" | "completed" | "postponed"
  homeScore?: number
  awayScore?: number
}

export interface Rule {
  id: string
  name: string
  category: "team_composition" | "scoring" | "budget"
  description: string
  config: Record<string, any>
  isActive: boolean
  sportId: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  timestamp: string
  details: string
}

// Dummy Data
export const sports: Sport[] = [
  {
    id: "1",
    name: "Football",
    icon: "⚽",
    displayOrder: 1,
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Cricket",
    icon: "🏏",
    displayOrder: 2,
    isActive: true,
    createdAt: "2024-01-02",
  },
  {
    id: "3",
    name: "Kabaddi",
    icon: "🤼",
    displayOrder: 3,
    isActive: false,
    createdAt: "2024-01-03",
  },
]

export const leagues: League[] = [
  {
    id: "1",
    name: "Premier League",
    sportId: "1",
    description: "English Premier League",
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    name: "Indian Premier League",
    sportId: "2",
    description: "IPL Cricket",
    isActive: true,
    createdAt: "2024-01-11",
  },
  {
    id: "3",
    name: "Pro Kabaddi League",
    sportId: "3",
    description: "PKL Kabaddi",
    isActive: true,
    createdAt: "2024-01-12",
  },
]

export const seasons: Season[] = [
  {
    id: "1",
    leagueId: "1",
    name: "2024/25 Season",
    startDate: "2024-08-17",
    endDate: "2025-05-25",
    isActive: true,
  },
  {
    id: "2",
    leagueId: "2",
    name: "IPL 2024",
    startDate: "2024-03-22",
    endDate: "2024-05-26",
    isActive: false,
  },
]

export const gameweeks: Gameweek[] = [
  {
    id: "1",
    seasonId: "1",
    name: "Gameweek 1",
    number: 1,
    startDate: "2024-08-17",
    endDate: "2024-08-19",
    deadline: "2024-08-17T10:00:00Z",
    status: "completed",
    isLocked: true,
  },
  {
    id: "2",
    seasonId: "1",
    name: "Gameweek 2",
    number: 2,
    startDate: "2024-08-24",
    endDate: "2024-08-26",
    deadline: "2024-08-24T10:00:00Z",
    status: "live",
    isLocked: false,
  },
  {
    id: "3",
    seasonId: "1",
    name: "Gameweek 3",
    number: 3,
    startDate: "2024-08-31",
    endDate: "2024-09-02",
    deadline: "2024-08-31T10:00:00Z",
    status: "upcoming",
    isLocked: false,
  },
]

export const teams: Team[] = [
  {
    id: "1",
    name: "Manchester United",
    code: "MUN",
    sportId: "1",
    logo: "/manchester-united-crest.png",
    primaryColor: "#DA291C",
    secondaryColor: "#000000",
    isActive: true,
  },
  {
    id: "2",
    name: "Liverpool",
    code: "LIV",
    sportId: "1",
    logo: "/liverpool-crest.png",
    primaryColor: "#C8102E",
    secondaryColor: "#00B2A9",
    isActive: true,
  },
  {
    id: "3",
    name: "Mumbai Indians",
    code: "MI",
    sportId: "2",
    logo: "/mumbai-indians-logo.png",
    primaryColor: "#004BA0",
    secondaryColor: "#FFD700",
    isActive: true,
  },
]

export const players: Player[] = [
  {
    id: "1",
    name: "Bruno Fernandes",
    teamId: "1",
    sportId: "1",
    position: "Midfielder",
    price: 8.5,
    availability: "available",
    news: "",
    photo: "/player-portrait.jpg",
    stats: { goals: 5, assists: 3, cleanSheets: 0 },
  },
  {
    id: "2",
    name: "Mohamed Salah",
    teamId: "2",
    sportId: "1",
    position: "Forward",
    price: 13.0,
    availability: "available",
    news: "",
    photo: "/player-portrait.jpg",
    stats: { goals: 12, assists: 7, cleanSheets: 0 },
  },
  {
    id: "3",
    name: "Rohit Sharma",
    teamId: "3",
    sportId: "2",
    position: "Batsman",
    price: 11.0,
    availability: "doubtful",
    news: "Minor injury concern",
    photo: "/player-portrait.jpg",
    stats: { runs: 456, wickets: 0, catches: 5 },
  },
]

export const fixtures: Fixture[] = [
  {
    id: "1",
    gameweekId: "2",
    homeTeamId: "1",
    awayTeamId: "2",
    kickoffTime: "2024-08-24T15:00:00Z",
    venue: "Old Trafford",
    status: "live",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "2",
    gameweekId: "3",
    homeTeamId: "2",
    awayTeamId: "1",
    kickoffTime: "2024-09-01T12:30:00Z",
    venue: "Anfield",
    status: "scheduled",
  },
]

export const rules: Rule[] = [
  {
    id: "1",
    name: "Squad Size",
    category: "team_composition",
    description: "Maximum squad size allowed",
    config: { maxPlayers: 15 },
    isActive: true,
    sportId: "1",
  },
  {
    id: "2",
    name: "Goal Scoring",
    category: "scoring",
    description: "Points awarded for goals scored",
    config: {
      forward: 4,
      midfielder: 5,
      defender: 6,
      goalkeeper: 10,
    },
    isActive: true,
    sportId: "1",
  },
  {
    id: "3",
    name: "Budget Cap",
    category: "budget",
    description: "Total budget for squad",
    config: { totalBudget: 100.0, currency: "M" },
    isActive: true,
    sportId: "1",
  },
]

export const activityLogs: ActivityLog[] = [
  {
    id: "1",
    userId: "1",
    userName: "John Admin",
    action: "created",
    entity: "player",
    timestamp: "2024-11-30T10:30:00Z",
    details: "Created player: Mohamed Salah",
  },
  {
    id: "2",
    userId: "1",
    userName: "John Admin",
    action: "updated",
    entity: "fixture",
    timestamp: "2024-11-30T09:15:00Z",
    details: "Updated fixture: MUN vs LIV - Status changed to live",
  },
  {
    id: "3",
    userId: "2",
    userName: "Sarah Manager",
    action: "created",
    entity: "gameweek",
    timestamp: "2024-11-29T16:45:00Z",
    details: "Created Gameweek 3",
  },
]
