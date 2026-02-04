// app/results-board/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Trophy, AlertCircle, Plus, Search, X, User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from '@supabase/supabase-js'

// Fantasy Points Calculation Functions
type CricketStats = {
  runs: number
  wickets: number
  catches: number
  balls_faced: number
  runs_conceded: number
  maidens: number
  run_outs: number
  stumpings: number
  fours: number
  sixes: number
  yellow_cards: number
  red_cards: number
  overs: number
  economy_rate?: number | null
}

type FootballStats = {
  goals: number
  assists: number
  clean_sheets: number
  position: string
  tackles: number
  interceptions: number
  saves: number
  minutes_played: number
  blocks: number
  penalty_saves: number
  goals_conceded: number
  yellow_cards: number
  red_cards: number
}

function calculateCricketFantasyPoints(stats: CricketStats): number {
  let points = 0

  // --- BATTING POINTS ---
  points += stats.runs * 1
  points += stats.fours * 1
  points += stats.sixes * 2
  
  if (stats.runs >= 100) {
    points += 16
  } else if (stats.runs >= 50) {
    points += 8
  } else if (stats.runs >= 30) {
    points += 4
  }
  
  if (stats.balls_faced >= 10) {
    const strikeRate = (stats.runs / stats.balls_faced) * 100
    if (strikeRate > 170) points += 6
    else if (strikeRate > 150) points += 4
    else if (strikeRate > 130) points += 2
    else if (strikeRate < 50) points -= 6
    else if (strikeRate < 60) points -= 4
    else if (strikeRate < 70) points -= 2
  }

  // --- BOWLING POINTS ---
  points += stats.wickets * 25
  
  if (stats.wickets >= 5) {
    points += 16
  } else if (stats.wickets >= 4) {
    points += 8
  }
  
  points += stats.maidens * 12
  
  if (stats.runs_conceded > 0 && stats.balls_faced > 0) {
    const overs = stats.balls_faced / 6
    const economy = stats.runs_conceded / overs
    
    if (economy < 5) points += 6
    else if (economy < 6) points += 4
    else if (economy < 7) points += 2
    else if (economy > 11) points -= 6
    else if (economy > 10) points -= 4
    else if (economy > 9) points -= 2
  }
  
  if (stats.economy_rate && stats.economy_rate > 0) {
    const economy = stats.economy_rate
    if (economy < 5) points += 6
    else if (economy < 6) points += 4
    else if (economy < 7) points += 2
    else if (economy > 11) points -= 6
    else if (economy > 10) points -= 4
    else if (economy > 9) points -= 2
  }

  // --- FIELDING POINTS ---
  points += stats.catches * 8
  points += stats.run_outs * 12
  points += stats.stumpings * 12

  // --- DISCIPLINE POINTS ---
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3

  return Math.max(points, 0)
}

function calculateFootballFantasyPoints(stats: FootballStats): number {
  let points = 0

  const positionMultipliers = {
    'Goalkeeper': { goal: 6, assist: 3, clean_sheet: 4 },
    'Defender': { goal: 6, assist: 3, clean_sheet: 4 },
    'Midfielder': { goal: 5, assist: 3, clean_sheet: 1 },
    'Forward': { goal: 4, assist: 3, clean_sheet: 0 },
    'Striker': { goal: 4, assist: 3, clean_sheet: 0 },
    'Winger': { goal: 4, assist: 3, clean_sheet: 0 },
    'Center Back': { goal: 6, assist: 3, clean_sheet: 4 },
    'Full Back': { goal: 6, assist: 3, clean_sheet: 4 },
    'Defensive Midfielder': { goal: 5, assist: 3, clean_sheet: 1 },
    'Attacking Midfielder': { goal: 5, assist: 3, clean_sheet: 1 }
  }

  const positionKey = stats.position as keyof typeof positionMultipliers
  const multiplier = positionMultipliers[positionKey] || positionMultipliers['Forward']

  // --- ATTACKING POINTS ---
  points += stats.goals * multiplier.goal
  points += stats.assists * multiplier.assist

  // --- DEFENSIVE POINTS ---
  if (stats.clean_sheets > 0) {
    points += multiplier.clean_sheet
  }
  
  points += stats.tackles * 1
  points += stats.interceptions * 1
  points += stats.blocks * 1

  // --- GOALKEEPER SPECIFIC ---
  if (stats.position === 'Goalkeeper') {
    points += Math.floor(stats.saves / 3)
    points += stats.penalty_saves * 5
    
    if (stats.goals_conceded >= 4) points -= 3
    else if (stats.goals_conceded >= 3) points -= 2
    else if (stats.goals_conceded >= 2) points -= 1
  }

  // --- PLAYING TIME POINTS ---
  if (stats.minutes_played >= 60) {
    points += 2
  } else if (stats.minutes_played > 0) {
    points += 1
  }

  // --- DISCIPLINE POINTS ---
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3

  return Math.max(points, 0)
}

function calculateFantasyPoints(playerStat: any, sportName: string): number {
  if (sportName === "Cricket") {
    return calculateCricketFantasyPoints({
      runs: playerStat.runs || 0,
      wickets: playerStat.wickets || 0,
      catches: playerStat.catches || playerStat.fours || 0,
      balls_faced: playerStat.balls_faced || 0,
      runs_conceded: playerStat.runs_conceded || 0,
      maidens: playerStat.maidens || 0,
      run_outs: playerStat.run_outs || playerStat.runs_conceded || 0,
      stumpings: playerStat.stumpings || playerStat.sixes || 0,
      fours: playerStat.fours || 0,
      sixes: playerStat.sixes || 0,
      yellow_cards: playerStat.yellow_cards || 0,
      red_cards: playerStat.red_cards || 0,
      overs: playerStat.overs || 0,
      economy_rate: playerStat.economy_rate || (playerStat.overs ? (playerStat.runs_conceded || 0) / playerStat.overs : null)
    })
  } else {
    return calculateFootballFantasyPoints({
      goals: playerStat.goals || 0,
      assists: playerStat.assists || 0,
      clean_sheets: playerStat.clean_sheets || 0,
      position: playerStat.position || 'Forward',
      tackles: playerStat.tackles || playerStat.fours || 0,
      interceptions: playerStat.interceptions || playerStat.sixes || 0,
      saves: playerStat.saves || playerStat.maidens || 0,
      minutes_played: playerStat.minutes_played || 0,
      blocks: playerStat.blocks || 0,
      penalty_saves: playerStat.penalty_saves || 0,
      goals_conceded: playerStat.goals_conceded || 0,
      yellow_cards: playerStat.yellow_cards || 0,
      red_cards: playerStat.red_cards || 0
    })
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type PlayerStat = {
  stat_id: number
  result_id: number
  player_id: number
  player_name: string
  team_id: number
  position: string
  sport_id: number
  goals: number
  assists: number
  clean_sheets: number
  yellow_cards: number
  red_cards: number
  runs: number
  balls_faced: number
  wickets: number
  maidens: number
  fours: number
  sixes: number
  runs_conceded: number
  minutes_played: number
  blocks: number
  penalty_saves: number
  goals_conceded: number
  overs: number | null
  economy_rate: number | null
  strike_rate: number | null
  catches: number
  stumpings: number
  run_outs: number
  assisted_run_outs: number
  role: number | null
  fantasy_points: number
}

type MatchResult = {
  result_id: number
  fixture_id: number
  home_team_id: number
  away_team_id: number
  home_score: number
  away_score: number
  sport_id: number
  league_id: number
  season_id: number
  gameweek_id: number
  kickoff_time: string
  status: string
  created_at: string
  updated_at: string
  home_team?: {
    team_id: number
    team_name: string
    sport_id: number
    league_id: number
  }
  away_team?: {
    team_id: number
    team_name: string
    sport_id: number
    league_id: number
  }
  sport?: {
    sport_id: number
    sport_name: string
    sport_code: string
    icon_url: string
  }
  home_player_stats?: PlayerStat[]
  away_player_stats?: PlayerStat[]
}

type Team = {
  team_id: number
  team_name: string
  sport_id: number
  league_id: number
  team_short_name: string
  team_code: string
}

type Sport = {
  sport_id: number
  sport_name: string
  sport_code: string
  icon_url: string
}

type Player = {
  player_id: number
  player_name: string
  team_id: number
  sport_id: number
  jersey_number: number | null
  is_active: boolean
}

type Fixture = {
  fixture_id: number
  home_team_id: number
  away_team_id: number
  sport_id: number
  season_id: number
  gameweek_id: number | null
  kickoff_time: string
  fixture_status: string
  is_finished: boolean
  home_score?: number
  away_score?: number
  winningteam_id?: number
  home_team_name?: string
  away_team_name?: string
  sport_name?: string
  sport_icon?: string
  gameweek_name?: string
  gameweek_number?: number
  season_name?: string
}

type Season = {
  season_id: number
  season_name: string
  sport_id: number
  year_start: number
  year_end: number
  is_active: boolean
}

type CustomPlayer = {
  id: string
  player_id: number | null
  name: string
  position: string
  team: "home" | "away"
  jersey_number?: number
}

export default function ResultsPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
  const [showAddResultDialog, setShowAddResultDialog] = useState(false)
  const [formStep, setFormStep] = useState<"selectSport" | "selectSeason" | "selectMatch" | "enterScores" | "enterPlayerStats">("selectSport")
  const [selectedSportId, setSelectedSportId] = useState<string>("")
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null)
  const [homeScore, setHomeScore] = useState<string>("")
  const [awayScore, setAwayScore] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home")
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({})
  const [validationError, setValidationError] = useState<string>("")
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [customPlayers, setCustomPlayers] = useState<CustomPlayer[]>([])
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPosition, setNewPlayerPosition] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<{position_id: number, sport_id: number, position_name: string, position_code: string}[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch all data in parallel
      const [
        { data: results, error: resultsError },
        { data: teamsData, error: teamsError },
        { data: sportsData, error: sportsError },
        { data: seasonsData, error: seasonsError },
        { data: playersData, error: playersError },
        { data: rolesData, error: rolesError }
      ] = await Promise.all([
        supabase
          .from('resultboard')
          .select(`
            *,
            home_team:teams!resultboard_home_team_id_fkey(team_id, team_name, sport_id, league_id),
            away_team:teams!resultboard_away_team_id_fkey(team_id, team_name, sport_id, league_id),
            sport:sports!resultboard_sport_id_fkey(sport_id, sport_name, sport_code, icon_url)
          `)
          .order('kickoff_time', { ascending: false }),
        supabase.from('teams').select('team_id, team_name, sport_id, league_id, team_short_name, team_code'),
        supabase.from('sports').select('sport_id, sport_name, sport_code, icon_url, is_active, display_order'),
        supabase.from('seasons').select('season_id, season_name, sport_id, year_start, year_end, is_active'),
        supabase.from('players').select('player_id, player_name, team_id, sport_id, jersey_number, is_active'),
        supabase.from('player_positions').select('position_id, sport_id, position_name, position_code').eq('is_active', true)
      ])

      if (resultsError) throw resultsError
      if (teamsError) throw teamsError
      if (sportsError) throw sportsError
      if (seasonsError) throw seasonsError
      if (playersError) throw playersError
      if (rolesError) throw rolesError

      // Fetch player stats for all results
      const resultsWithStats = await Promise.all(
        (results || []).map(async (result: any) => {
          const { data: playerStatsData, error: statsError } = await supabase
            .from('player_match_stats')
            .select('*')
            .eq('result_id', result.result_id)

          if (statsError) throw statsError

          const homePlayerStats = playerStatsData?.filter((stat: { team_id: any }) => stat.team_id === result.home_team_id) || []
          const awayPlayerStats = playerStatsData?.filter((stat: { team_id: any }) => stat.team_id === result.away_team_id) || []

          return {
            ...result,
            home_player_stats: homePlayerStats,
            away_player_stats: awayPlayerStats
          }
        })
      )

      setMatchResults(resultsWithStats || [])
      setTeams(teamsData || [])
      setSports(sportsData || [])
      setSeasons(seasonsData || [])
      setPlayers(playersData || [])
      setRoles(rolesData || [])
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message || "Failed to fetch data from database")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get sport-specific position options
  const getSportPositions = (sportName: string | undefined) => {
    if (!sportName) return []
    
    const sportNameLower = sportName.toLowerCase()
    
    if (sportNameLower.includes('cricket')) {
      return [
        'Batsman',
        'Bowler',
        'All-rounder',
        'Wicket-keeper',
        'Batter',
        'Bowler (Fast)',
        'Bowler (Spin)'
      ]
    } else if (sportNameLower.includes('football') || sportNameLower.includes('soccer')) {
      return [
        'Goalkeeper',
        'Defender',
        'Midfielder',
        'Forward',
        'Striker',
        'Center-back',
        'Full-back',
        'Winger',
        'Attacking Midfielder',
        'Defensive Midfielder'
      ]
    } else if (sportNameLower.includes('basketball')) {
      return [
        'Point Guard',
        'Shooting Guard',
        'Small Forward',
        'Power Forward',
        'Center'
      ]
    } else {
      return [
        'Player',
        'Captain',
        'Vice-captain'
      ]
    }
  }

  // Get roles for selected sport
  const getSportRoles = () => {
    if (!selectedSportId) return []
    return roles.filter(role => role.sport_id.toString() === selectedSportId)
  }

  // Fetch fixtures when sport and season are selected
  const fetchFixtures = async (sportId: string, seasonId: string) => {
    try {
      // Fetch fixtures that are completed and don't have results yet
      const { data: fixturesData, error: fixturesError } = await supabase
        .from('fixtures')
        .select(`
          fixture_id,
          gameweek_id,
          season_id,
          sport_id,
          home_team_id,
          away_team_id,
          kickoff_time,
          home_score,
          away_score,
          fixture_status,
          is_finished,
          winningteam_id,
          home_team:home_team_id(team_name),
          away_team:away_team_id(team_name),
          sport:sport_id(sport_name, sport_code, icon_url),
          gameweek:gameweek_id(gameweek_name, gameweek_number),
          season:season_id(season_name)
        `)
        .eq('sport_id', sportId)
        .eq('season_id', seasonId)
        .eq('fixture_status', 'completed')
        .eq('is_finished', true)
        .order('kickoff_time', { ascending: true })

      if (fixturesError) throw fixturesError

      // Get fixtures that already have results
      const { data: existingResults, error: resultsError } = await supabase
        .from('resultboard')
        .select('fixture_id')
        .eq('sport_id', sportId)
        .eq('season_id', seasonId)

      if (resultsError) throw resultsError

      const existingFixtureIds = existingResults?.map((r: any) => r.fixture_id) || []

      // Filter out fixtures that already have results
      const availableFixtures = (fixturesData || []).filter(
        (fixture: any) => !existingFixtureIds.includes(fixture.fixture_id)
      )

      // Transform fixtures data
      const transformedFixtures: Fixture[] = availableFixtures.map((fixture: any) => ({
        fixture_id: fixture.fixture_id,
        gameweek_id: fixture.gameweek_id,
        season_id: fixture.season_id,
        sport_id: fixture.sport_id,
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        kickoff_time: fixture.kickoff_time,
        home_score: fixture.home_score,
        away_score: fixture.away_score,
        fixture_status: fixture.fixture_status,
        is_finished: fixture.is_finished,
        winningteam_id: fixture.winningteam_id,
        home_team_name: fixture.home_team?.team_name,
        away_team_name: fixture.away_team?.team_name,
        sport_name: fixture.sport?.sport_name,
        sport_icon: fixture.sport?.icon_url,
        gameweek_name: fixture.gameweek?.gameweek_name,
        gameweek_number: fixture.gameweek?.gameweek_number,
        season_name: fixture.season?.season_name
      }))

      setFixtures(transformedFixtures || [])
      return transformedFixtures || []
    } catch (error) {
      console.error("Error fetching fixtures:", error)
      setValidationError("Failed to fetch fixtures")
      return []
    }
  }

  // Filter seasons by sport
  const getFilteredSeasons = () => {
    if (!selectedSportId) return []
    return seasons.filter(season => season.sport_id.toString() === selectedSportId)
  }

  // Get players for the selected team and sport
  const getFilteredPlayers = () => {
    if (!selectedFixtureId || !selectedSportId) return []
    
    const fixture = fixtures.find(f => f.fixture_id === selectedFixtureId)
    if (!fixture) return []
    
    const teamId = selectedTeam === "home" ? fixture.home_team_id : fixture.away_team_id
    
    return players.filter(player => 
      player.team_id === teamId && 
      player.sport_id.toString() === selectedSportId &&
      player.is_active
    )
  }

  const filteredResults = matchResults
    .filter((result) => {
      if (selectedSport !== "all" && result.sport_id.toString() !== selectedSport) return false

      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase()
        return (
          result.home_team?.team_name.toLowerCase().includes(searchLower) ||
          result.away_team?.team_name.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .filter(result => {
    return true // Remove this line after adding proper check
  })
    .sort((a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime())

  const getTeam = (teamId: number) => teams.find((t) => t.team_id === teamId)

  const getSportById = (sportId: number) => sports.find((s) => s.sport_id === sportId)

  const getMatchResult = (result: MatchResult) => {
    const sport = getSportById(result.sport_id)

    if (!result.home_team || !result.away_team) {
      return { summary: "Result unavailable", winner: null }
    }

    if (sport?.sport_name === "Cricket") {
      const margin = Math.abs(result.home_score - result.away_score)
      const winner = result.home_score > result.away_score ? result.home_team.team_name : result.away_team.team_name
      return {
        summary: `${winner} won by ${margin} runs`,
        winner: result.home_score > result.away_score ? "home" : "away",
      }
    } else {
      // Football or other sports
      const goalDiff = Math.abs(result.home_score - result.away_score)
      if (result.home_score === result.away_score) {
        return { summary: "Match drawn", winner: "draw" }
      }
      const winner = result.home_score > result.away_score ? result.home_team.team_name : result.away_team.team_name
      return {
        summary: `${winner} won by ${goalDiff} ${goalDiff === 1 ? "goal" : "goals"}`,
        winner: result.home_score > result.away_score ? "home" : "away",
      }
    }
  }

  const toggleMatchDetails = (resultId: number) => {
    setExpandedMatch(expandedMatch === resultId ? null : resultId)
  }

  const selectedFixture = fixtures.find((f) => f.fixture_id === selectedFixtureId)

  const openAddResultDialog = () => {
    setShowAddResultDialog(true)
    setFormStep("selectSport")
    setSelectedSportId("")
    setSelectedSeasonId("")
    setSelectedFixtureId(null)
    setHomeScore("")
    setAwayScore("")
    setPlayerStats({})
    setValidationError("")
    setSelectedTeam("home")
    setEditingMatchId(null)
    setCustomPlayers([])
    setShowAddPlayerForm(false)
    setNewPlayerName("")
    setNewPlayerPosition("")
    setFixtures([])
  }

  const openEditResultDialog = async (matchResult: MatchResult) => {
    setEditingMatchId(matchResult.result_id)
    setShowAddResultDialog(true)
    
    // Start directly at player stats entry for editing
    setFormStep("enterPlayerStats")
    
    // Set basic info
    setSelectedSportId(matchResult.sport_id.toString())
    setSelectedSeasonId(matchResult.season_id.toString())
    setSelectedFixtureId(matchResult.fixture_id)
    
    // Get fixture info
    try {
      const { data: fixtureData, error } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:home_team_id(team_name),
          away_team:away_team_id(team_name)
        `)
        .eq('fixture_id', matchResult.fixture_id)
        .single()
        
      if (error) throw error
      
      // Create fixture object
      const fixture: Fixture = {
        fixture_id: fixtureData.fixture_id,
        gameweek_id: fixtureData.gameweek_id,
        season_id: fixtureData.season_id,
        sport_id: fixtureData.sport_id,
        home_team_id: fixtureData.home_team_id,
        away_team_id: fixtureData.away_team_id,
        kickoff_time: fixtureData.kickoff_time,
        home_score: fixtureData.home_score,
        away_score: fixtureData.away_score,
        fixture_status: fixtureData.fixture_status,
        is_finished: fixtureData.is_finished,
        winningteam_id: fixtureData.winningteam_id,
        home_team_name: fixtureData.home_team?.team_name || matchResult.home_team?.team_name,
        away_team_name: fixtureData.away_team?.team_name || matchResult.away_team?.team_name,
        sport_name: sports.find(s => s.sport_id === fixtureData.sport_id)?.sport_name,
        sport_icon: sports.find(s => s.sport_id === fixtureData.sport_id)?.icon_url,
        gameweek_name: '', // Add if you have gameweek data
        gameweek_number: 0,
        season_name: seasons.find(s => s.season_id === fixtureData.season_id)?.season_name
      }
      
      // Store in fixtures array
      setFixtures([fixture])
      
      // Set scores
      setHomeScore(matchResult.home_score.toString())
      setAwayScore(matchResult.away_score.toString())
      
      // Pre-populate player stats
      const stats: Record<string, any> = {}
      const allPlayers = [...(matchResult.home_player_stats || []), ...(matchResult.away_player_stats || [])]
      
      // Convert database player stats to custom players
      const customPlayersData: CustomPlayer[] = allPlayers.map(ps => ({
        id: `existing_${ps.player_id}`,
        player_id: ps.player_id,
        name: ps.player_name,
        position: ps.position,
        team: ps.team_id === matchResult.home_team_id ? "home" as const : "away" as const
      }))

      // Set player stats
      allPlayers.forEach((ps) => {
        const playerId = `existing_${ps.player_id}`
        
        // For cricket
        if (ps.runs !== undefined && ps.runs !== null) stats[`${playerId}_runs`] = ps.runs.toString()
        if (ps.balls_faced !== undefined && ps.balls_faced !== null) stats[`${playerId}_balls_faced`] = ps.balls_faced.toString()
        if (ps.wickets !== undefined && ps.wickets !== null) stats[`${playerId}_wickets`] = ps.wickets.toString()
        if (ps.fours !== undefined && ps.fours !== null) stats[`${playerId}_fours`] = ps.fours.toString()
        if (ps.sixes !== undefined && ps.sixes !== null) stats[`${playerId}_sixes`] = ps.sixes.toString()
        if (ps.maidens !== undefined && ps.maidens !== null) stats[`${playerId}_maidens`] = ps.maidens.toString()
        if (ps.runs_conceded !== undefined && ps.runs_conceded !== null) stats[`${playerId}_runs_conceded`] = ps.runs_conceded.toString()
        if (ps.overs !== undefined && ps.overs !== null) stats[`${playerId}_overs`] = ps.overs.toString()
        if (ps.catches !== undefined && ps.catches !== null) stats[`${playerId}_catches`] = ps.catches.toString()
        if (ps.stumpings !== undefined && ps.stumpings !== null) stats[`${playerId}_stumpings`] = ps.stumpings.toString()
        if (ps.run_outs !== undefined && ps.run_outs !== null) stats[`${playerId}_run_outs`] = ps.run_outs.toString()
        if (ps.assisted_run_outs !== undefined && ps.assisted_run_outs !== null) stats[`${playerId}_assisted_run_outs`] = ps.assisted_run_outs.toString()
        if (ps.economy_rate !== undefined && ps.economy_rate !== null) stats[`${playerId}_economy_rate`] = ps.economy_rate.toString()
        if (ps.strike_rate !== undefined && ps.strike_rate !== null) stats[`${playerId}_strike_rate`] = ps.strike_rate.toString()
        if (ps.role !== undefined && ps.role !== null) stats[`${playerId}_role`] = ps.role.toString()
        if (ps.fantasy_points !== undefined && ps.fantasy_points !== null) stats[`${playerId}_fantasy_points`] = ps.fantasy_points.toString()
        
        // For football
        if (ps.goals !== undefined && ps.goals !== null) stats[`${playerId}_goals`] = ps.goals.toString()
        if (ps.assists !== undefined && ps.assists !== null) stats[`${playerId}_assists`] = ps.assists.toString()
        if (ps.clean_sheets !== undefined && ps.clean_sheets !== null) stats[`${playerId}_clean_sheets`] = ps.clean_sheets.toString()
        if (ps.yellow_cards !== undefined && ps.yellow_cards !== null) stats[`${playerId}_yellow_cards`] = ps.yellow_cards.toString()
        if (ps.red_cards !== undefined && ps.red_cards !== null) stats[`${playerId}_red_cards`] = ps.red_cards.toString()
        if (ps.minutes_played !== undefined && ps.minutes_played !== null) stats[`${playerId}_minutes_played`] = ps.minutes_played.toString()
        if (ps.goals_conceded !== undefined && ps.goals_conceded !== null) stats[`${playerId}_goals_conceded`] = ps.goals_conceded.toString()
        if (ps.blocks !== undefined && ps.blocks !== null) stats[`${playerId}_blocks`] = ps.blocks.toString()
        if (ps.penalty_saves !== undefined && ps.penalty_saves !== null) stats[`${playerId}_penalty_saves`] = ps.penalty_saves.toString()
      })

      setCustomPlayers(customPlayersData)
      setPlayerStats(stats)
      setValidationError("")
      setSelectedTeam("home")
      
    } catch (error: any) {
      console.error("Error loading fixture data:", error)
      setValidationError("Failed to load match data")
    }
  }

  const proceedToSeasonSelect = () => {
    if (!selectedSportId) {
      setValidationError("Please select a sport first")
      return
    }
    setValidationError("")
    setFormStep("selectSeason")
  }

  const proceedToMatchSelect = async () => {
    if (!selectedSeasonId) {
      setValidationError("Please select a season")
      return
    }
    
    setValidationError("")
    setFormStep("selectMatch")
    
    // Fetch fixtures for selected sport and season
    const fetchedFixtures = await fetchFixtures(selectedSportId, selectedSeasonId)
    
    // Check if there are fixtures
    if (fetchedFixtures.length === 0) {
      setValidationError("No completed fixtures found for the selected season. Please complete matches in the Fixtures section first.")
    }
  }

  const proceedToScoreEntry = () => {
    if (!selectedFixtureId) {
      setValidationError("Please select a match first")
      return
    }
    setValidationError("")
    setFormStep("enterScores")
    
    // Pre-populate scores if available
    if (selectedFixture) {
      setHomeScore(selectedFixture.home_score?.toString() || "")
      setAwayScore(selectedFixture.away_score?.toString() || "")
    }
  }

  const proceedToPlayerStats = () => {
    const home = Number.parseInt(homeScore)
    const away = Number.parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setValidationError("Please enter valid scores for both teams")
      return
    }

    setValidationError("")
    setFormStep("enterPlayerStats")
  }

  const addCustomPlayer = () => {
    if (!newPlayerName.trim()) {
      setValidationError("Please enter player name")
      return
    }
    if (!newPlayerPosition.trim()) {
      setValidationError("Please select player position")
      return
    }

    const newPlayer: CustomPlayer = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player_id: null,
      name: newPlayerName.trim(),
      position: newPlayerPosition,
      team: selectedTeam,
    }

    setCustomPlayers([...customPlayers, newPlayer])
    setNewPlayerName("")
    setNewPlayerPosition("")
    setShowAddPlayerForm(false)
    setValidationError("")
  }

  const addExistingPlayer = (player: Player) => {
    // Check if player already exists
    const existingPlayer = customPlayers.find(p => p.player_id === player.player_id)
    if (existingPlayer) {
      setValidationError("Player already added")
      return
    }

    // Get sport for position options
    const sport = sports.find(s => s.sport_id === selectedFixture?.sport_id)
    const sportPositions = getSportPositions(sport?.sport_name)

    const newPlayer: CustomPlayer = {
      id: `existing_${player.player_id}`,
      player_id: player.player_id,
      name: player.player_name,
      position: sportPositions[0] || 'Player', // Default position (first in the list)
      team: selectedTeam,
      jersey_number: player.jersey_number || undefined
    }

    setCustomPlayers([...customPlayers, newPlayer])
    setValidationError("")
  }

  const removeCustomPlayer = (playerId: string) => {
    setCustomPlayers(customPlayers.filter((p) => p.id !== playerId))
    // Remove stats for this player
    const updatedStats = { ...playerStats }
    Object.keys(updatedStats).forEach((key) => {
      if (key.startsWith(`${playerId}_`)) {
        delete updatedStats[key]
      }
    })
    setPlayerStats(updatedStats)
  }

  const handleSaveMatchResult = async () => {
    if (!selectedFixture) {
      setValidationError("Please select a valid fixture")
      return
    }

    const fixture = fixtures.find((f) => f.fixture_id === selectedFixtureId)
    if (!fixture) {
      setValidationError("Fixture not found")
      return
    }

    const homeTeam = getTeam(fixture.home_team_id)
    const awayTeam = getTeam(fixture.away_team_id)
    const sport = getSportById(fixture.sport_id)

    if (!homeTeam || !awayTeam || !sport) {
      setValidationError("Invalid fixture data - missing team or sport information")
      return
    }

    const homeTeamScore = Number.parseInt(homeScore)
    const awayTeamScore = Number.parseInt(awayScore)

    if (isNaN(homeTeamScore) || isNaN(awayTeamScore)) {
      setValidationError("Please enter valid scores")
      return
    }

    const homePlayers = customPlayers.filter((p) => p.team === "home")
    const awayPlayers = customPlayers.filter((p) => p.team === "away")

    // Validate cricket team size
    if (sport?.sport_name === "Cricket") {
      if (homePlayers.length > 11) {
        setValidationError(
          `Home team has ${homePlayers.length} players. Cricket teams can have a maximum of 11 players.`
        )
        return
      }
      if (awayPlayers.length > 11) {
        setValidationError(
          `Away team has ${awayPlayers.length} players. Cricket teams can have a maximum of 11 players.`
        )
        return
      }
    }

    // Validate player stats
    let homeTotalWickets = 0
    let awayTotalWickets = 0

    for (const player of homePlayers) {
      if (sport?.sport_name === "Cricket") {
        const wickets = Number.parseInt(playerStats[`${player.id}_wickets`] || "0")
        homeTotalWickets += wickets
      }
    }

    for (const player of awayPlayers) {
      if (sport?.sport_name === "Cricket") {
        const wickets = Number.parseInt(playerStats[`${player.id}_wickets`] || "0")
        awayTotalWickets += wickets
      }
    }

    // Only validate maximum wickets for cricket
    if (sport?.sport_name === "Cricket") {
      if (homeTotalWickets > 10) {
        setValidationError(`Home team wickets (${homeTotalWickets}) cannot exceed 10`)
        return
      }
      if (awayTotalWickets > 10) {
        setValidationError(`Away team wickets (${awayTotalWickets}) cannot exceed 10`)
        return
      }
    }

    try {
      let resultId: number
      
      if (editingMatchId) {
        // Update existing result
        const { error: updateError } = await supabase
          .from('resultboard')
          .update({
            home_score: homeTeamScore,
            away_score: awayTeamScore,
            updated_at: new Date().toISOString()
          })
          .eq('result_id', editingMatchId)

        if (updateError) throw updateError
        resultId = editingMatchId

        // Delete existing player stats
        const { error: deleteError } = await supabase
          .from('player_match_stats')
          .delete()
          .eq('result_id', editingMatchId)

        if (deleteError) throw deleteError
      } else {
        // Check if result already exists for this fixture
        const { data: existingResult, error: checkError } = await supabase
          .from('resultboard')
          .select('result_id')
          .eq('fixture_id', fixture.fixture_id)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingResult) {
          setValidationError("A result already exists for this fixture")
          return
        }

        // Insert new result
        const { data: newResult, error: insertError } = await supabase
          .from('resultboard')
          .insert({
            fixture_id: fixture.fixture_id,
            home_team_id: fixture.home_team_id,
            away_team_id: fixture.away_team_id,
            home_score: homeTeamScore,
            away_score: awayTeamScore,
            sport_id: fixture.sport_id,
            league_id: homeTeam.league_id,
            season_id: fixture.season_id,
            gameweek_id: fixture.gameweek_id || 0,
            kickoff_time: fixture.kickoff_time,
            status: 'completed'
          })
          .select('result_id')
          .single()

        if (insertError) throw insertError
        if (!newResult) throw new Error("Failed to create result")
        resultId = newResult.result_id
      }

      // Prepare player stats for insertion
      const playerStatsToInsert = customPlayers.map(player => {
        const baseStats = {
          result_id: resultId,
          player_id: player.player_id || Date.now() + Math.floor(Math.random() * 1000),
          player_name: player.name,
          team_id: player.team === 'home' ? fixture.home_team_id : fixture.away_team_id,
          position: player.position, // This comes from the form dropdown
          sport_id: fixture.sport_id,
          role: playerStats[`${player.id}_role`] ? Number.parseInt(playerStats[`${player.id}_role`]) : null
        }

        let stats: any = { ...baseStats }

        if (sport.sport_name === "Cricket") {
          const runs = Number.parseInt(playerStats[`${player.id}_runs`] || "0")
          const balls_faced = Number.parseInt(playerStats[`${player.id}_balls_faced`] || "0")
          const wickets = Number.parseInt(playerStats[`${player.id}_wickets`] || "0")
          const fours = Number.parseInt(playerStats[`${player.id}_fours`] || "0")
          const sixes = Number.parseInt(playerStats[`${player.id}_sixes`] || "0")
          const maidens = Number.parseInt(playerStats[`${player.id}_maidens`] || "0")
          const runs_conceded = Number.parseInt(playerStats[`${player.id}_runs_conceded`] || "0")
          const overs = playerStats[`${player.id}_overs`] ? 
            Number.parseFloat(playerStats[`${player.id}_overs`]) : null
          const catches = Number.parseInt(playerStats[`${player.id}_catches`] || "0")
          const stumpings = Number.parseInt(playerStats[`${player.id}_stumpings`] || "0")
          const run_outs = Number.parseInt(playerStats[`${player.id}_run_outs`] || "0")
          const assisted_run_outs = Number.parseInt(playerStats[`${player.id}_assisted_run_outs`] || "0")          
          const economy_rate = playerStats[`${player.id}_economy_rate`] ? 
            Number.parseFloat(playerStats[`${player.id}_economy_rate`]) : null
          const strike_rate = playerStats[`${player.id}_strike_rate`] ? 
            Number.parseFloat(playerStats[`${player.id}_strike_rate`]) : null
          
          stats = {
            ...stats,
            runs,
            balls_faced,
            wickets,
            fours,
            sixes,
            maidens,
            runs_conceded,
            overs,
            catches,
            stumpings,
            run_outs,
            assisted_run_outs,
            economy_rate,
            strike_rate,
            fantasy_points: calculateCricketFantasyPoints({
              runs,
              wickets,
              catches,
              balls_faced,
              runs_conceded,
              maidens,
              run_outs,
              stumpings,
              fours,
              sixes,
              yellow_cards: Number.parseInt(playerStats[`${player.id}_yellow_cards`] || "0"),
              red_cards: Number.parseInt(playerStats[`${player.id}_red_cards`] || "0"),
              overs: overs || 0,
              economy_rate
            })
          }
        } else {
          // Football
          const goals = Number.parseInt(playerStats[`${player.id}_goals`] || "0")
          const assists = Number.parseInt(playerStats[`${player.id}_assists`] || "0")
          const clean_sheets = Number.parseInt(playerStats[`${player.id}_clean_sheets`] || "0")
          const minutes_played = Number.parseInt(playerStats[`${player.id}_minutes_played`] || "0")
          const goals_conceded = Number.parseInt(playerStats[`${player.id}_goals_conceded`] || "0")
          const blocks = Number.parseInt(playerStats[`${player.id}_blocks`] || "0")
          const penalty_saves = Number.parseInt(playerStats[`${player.id}_penalty_saves`] || "0")
          const catches = Number.parseInt(playerStats[`${player.id}_catches`] || "0")
          const stumpings = Number.parseInt(playerStats[`${player.id}_stumpings`] || "0")
          const run_outs = Number.parseInt(playerStats[`${player.id}_run_outs`] || "0")
          const assisted_run_outs = Number.parseInt(playerStats[`${player.id}_assisted_run_outs`] || "0")
          
          stats = {
            ...stats,
            goals,
            assists,
            clean_sheets,
            minutes_played,
            goals_conceded,
            yellow_cards: Number.parseInt(playerStats[`${player.id}_yellow_cards`] || "0"),
            red_cards: Number.parseInt(playerStats[`${player.id}_red_cards`] || "0"),
            blocks,
            penalty_saves,
            catches,
            stumpings,
            run_outs,
            assisted_run_outs,
            fantasy_points: calculateFootballFantasyPoints({
              goals,
              assists,
              clean_sheets,
              position: player.position || 'Forward',
              tackles: Number.parseInt(playerStats[`${player.id}_tackles`] || "0"),
              interceptions: Number.parseInt(playerStats[`${player.id}_interceptions`] || "0"),
              saves: Number.parseInt(playerStats[`${player.id}_saves`] || "0"),
              minutes_played,
              blocks,
              penalty_saves,
              goals_conceded,
              yellow_cards: Number.parseInt(playerStats[`${player.id}_yellow_cards`] || "0"),
              red_cards: Number.parseInt(playerStats[`${player.id}_red_cards`] || "0")
            })
          }
        }

        return stats
      })

      // Insert all player stats
      if (playerStatsToInsert.length > 0) {
        const { error: statsError } = await supabase
          .from('player_match_stats')
          .insert(playerStatsToInsert)

        if (statsError) throw statsError
      }

      // Refresh data
      await fetchData()

      // Reset form
      setValidationError("")
      setShowAddResultDialog(false)
      setFormStep("selectSport")
      setSelectedSportId("")
      setSelectedSeasonId("")
      setSelectedFixtureId(null)
      setHomeScore("")
      setAwayScore("")
      setPlayerStats({})
      setCustomPlayers([])
      setEditingMatchId(null)
      setShowAddPlayerForm(false)
      setNewPlayerName("")
      setNewPlayerPosition("")
    } catch (error: any) {
      console.error("Error saving match result:", error)
      setValidationError(error.message || "Failed to save match result. Please try again.")
    }
  }

  const renderPlayerStatsTable = (result: MatchResult, teamType: "home" | "away") => {
    const sport = getSportById(result.sport_id)
    const team = teamType === "home" ? result.home_team : result.away_team
    const teamPlayerStats = teamType === "home" ? result.home_player_stats : result.away_player_stats
    const matchResult = getMatchResult(result)
    const isWinner =
      (teamType === "home" && matchResult.winner === "home") || (teamType === "away" && matchResult.winner === "away")

    if (!teamPlayerStats || teamPlayerStats.length === 0) {
      return (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>{team?.team_name}</span>
            {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
          </h4>
          <div className="text-center py-4 text-muted-foreground">
            No player statistics recorded
          </div>
        </div>
      )
    }

    return (
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <span>{team?.team_name}</span>
          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
        </h4>
        <div className="rounded-lg border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                {sport?.sport_name === "Cricket" ? (
                  <>
                    <TableHead className="text-right">Runs</TableHead>
                    <TableHead className="text-right">Balls</TableHead>
                    <TableHead className="text-right">Wickets</TableHead>
                    <TableHead className="text-right">4s</TableHead>
                    <TableHead className="text-right">6s</TableHead>
                    <TableHead className="text-right">Overs</TableHead>
                    <TableHead className="text-right">Maiden</TableHead>
                    <TableHead className="text-right">Runs.Con</TableHead>
                    <TableHead className="text-right">Catch</TableHead>
                    <TableHead className="text-right">Stumping</TableHead>
                    <TableHead className="text-right">Direct.RO</TableHead>
                    <TableHead className="text-right">Assisted.RO</TableHead>
                    <TableHead className="text-right">Econ.Rate</TableHead>
                    <TableHead className="text-right">S.Rate</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">Goals</TableHead>
                    <TableHead className="text-right">Assists</TableHead>
                    <TableHead className="text-right">CS</TableHead>
                    <TableHead className="text-right">Mins</TableHead>
                    <TableHead className="text-right">YC</TableHead>
                    <TableHead className="text-right">RC</TableHead>
                    <TableHead className="text-right">Catch</TableHead>
                    <TableHead className="text-right">Stumping</TableHead>
                    <TableHead className="text-right">D. Run-out</TableHead>
                    <TableHead className="text-right">A. Run-out</TableHead>
                    <TableHead className="text-right">Blocks</TableHead>
                    <TableHead className="text-right">Pen. Saves</TableHead>
                  </>
                )}
                <TableHead className="text-right font-semibold">Fantasy Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamPlayerStats.map((playerStat) => (
                <TableRow key={playerStat.stat_id}>
                  <TableCell className="font-medium">{playerStat.player_name}</TableCell>
                  <TableCell>{playerStat.position}</TableCell>
                  {sport?.sport_name === "Cricket" ? (
                    <>
                      <TableCell className="text-right">{playerStat.runs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.balls_faced || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.wickets || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.fours || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.sixes || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.overs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.maidens || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.runs_conceded || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.catches || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stumpings || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.run_outs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.assisted_run_outs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.economy_rate?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right">{playerStat.strike_rate?.toFixed(2) || '0.00'}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right">{playerStat.goals || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.assists || 0}</TableCell>
                      <TableCell className="text-right">
                        {(playerStat.position === "Goalkeeper" || playerStat.position === "Defender") &&
                        playerStat.clean_sheets
                          ? "Yes"
                          : "No"}
                      </TableCell>
                      <TableCell className="text-right">{playerStat.minutes_played || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.yellow_cards || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.red_cards || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.catches || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stumpings || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.run_outs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.assisted_run_outs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.blocks || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.penalty_saves || 0}</TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-semibold">
                    {calculateFantasyPoints(playerStat, sport?.sport_name || "")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const handleEditStats = (matchResult: MatchResult) => {
    openEditResultDialog(matchResult)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Results</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results Board</h1>
          <p className="text-muted-foreground">View completed match results and player performances</p>
        </div>
        <Button onClick={openAddResultDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Match Result
        </Button>
      </div>

      {/* Sport Filter and Search */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2">
          <Button variant={selectedSport === "all" ? "default" : "outline"} onClick={() => setSelectedSport("all")}>
            All Sports
          </Button>
          {sports.map((sport) => (
            <Button
              key={sport.sport_id}
              variant={selectedSport === sport.sport_id.toString() ? "default" : "outline"}
              onClick={() => setSelectedSport(sport.sport_id.toString())}
            >
              {sport.sport_name}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Match Results */}
      <Card>
        <CardHeader>
          <CardTitle>Match Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No matches found for your search"
                : "No completed matches found. Add match results to get started."}
            </div>
          ) : (
            filteredResults.map((result) => {
              const sport = getSportById(result.sport_id)
              const matchResult = getMatchResult(result)
              const isExpanded = expandedMatch === result.result_id

              if (!result.home_team || !result.away_team) return null

              return (
                <div key={result.result_id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Match Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          {sport?.sport_name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(result.kickoff_time)}
                          {" · "}
                          {formatTime(result.kickoff_time)}
                        </span>
                      </div>
                    </div>

                    {/* Match Title */}
                    <h3 className="text-lg font-semibold">
                      {result.home_team.team_name} vs {result.away_team.team_name}
                    </h3>

                    {/* Result Summary */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">{matchResult.summary}</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {result.home_score} - {result.away_score}
                      </div>
                    </div>

                    {/* View Details and Edit Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => toggleMatchDetails(result.result_id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View Details
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => handleEditStats(result)}>
                        Edit Stats
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-6">
                      {renderPlayerStatsTable(result, "home")}
                      {renderPlayerStatsTable(result, "away")}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddResultDialog} onOpenChange={setShowAddResultDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMatchId ? "Edit Match Result" : "Add Match Result"}</DialogTitle>
            <DialogDescription>
              {editingMatchId 
                ? "Edit the match result and player statistics" 
                : (formStep === "selectSport" && "Select a sport type") ||
                  (formStep === "selectSeason" && "Select a season") ||
                  (formStep === "selectMatch" && "Select a completed match to add result") ||
                  (formStep === "enterScores" && "Enter the final scores for both teams") ||
                  (formStep === "enterPlayerStats" && "Enter player statistics for both teams. Stats must match the final scores.")
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* EDIT MODE - Show simplified match info */}
            {editingMatchId && formStep === "enterPlayerStats" && selectedFixture && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedFixture.home_team_name} vs {selectedFixture.away_team_name}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="secondary">
                        {sports.find(s => s.sport_id.toString() === selectedSportId)?.sport_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(selectedFixture.kickoff_time)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Final Score</p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          value={homeScore}
                          onChange={(e) => setHomeScore(e.target.value)}
                          className="w-20 text-center"
                        />
                        <Label className="text-xs absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                          {selectedFixture.home_team_name}
                        </Label>
                      </div>
                      <span className="font-bold text-xl">-</span>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          value={awayScore}
                          onChange={(e) => setAwayScore(e.target.value)}
                          className="w-20 text-center"
                        />
                        <Label className="text-xs absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                          {selectedFixture.away_team_name}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 1: Select Sport (Only for ADD mode) */}
            {!editingMatchId && formStep === "selectSport" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Sport *</Label>
                  <Select 
                    value={selectedSportId} 
                    onValueChange={(value) => {
                      setSelectedSportId(value)
                      setSelectedSeasonId("")
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a sport type" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((sport) => (
                        <SelectItem key={sport.sport_id} value={sport.sport_id.toString()}>
                          {sport.sport_name} ({sport.sport_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 2: Select Season (Only for ADD mode) */}
            {!editingMatchId && formStep === "selectSeason" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Season *</Label>
                  <Select 
                    value={selectedSeasonId} 
                    onValueChange={(value) => setSelectedSeasonId(value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a season" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredSeasons().map((season) => (
                        <SelectItem key={season.season_id} value={season.season_id.toString()}>
                          {season.season_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">Selected Sport</p>
                  <p className="text-muted-foreground">
                    {sports.find(s => s.sport_id.toString() === selectedSportId)?.sport_name}
                  </p>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 3: Select Match (Only for ADD mode) */}
            {!editingMatchId && formStep === "selectMatch" && selectedSportId && selectedSeasonId && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Selected Sport & Season</p>
                      <p className="text-muted-foreground">
                        {sports.find(s => s.sport_id.toString() === selectedSportId)?.sport_name} - {
                          seasons.find(s => s.season_id.toString() === selectedSeasonId)?.season_name
                        } ({seasons.find(s => s.season_id.toString() === selectedSeasonId)?.year_start}-{
                          seasons.find(s => s.season_id.toString() === selectedSeasonId)?.year_end
                        })
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {fixtures.length} completed match{fixtures.length !== 1 ? 'es' : ''} available
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Completed Match *</Label>
                    <Select 
                      value={selectedFixtureId?.toString() || ""} 
                      onValueChange={(value) => setSelectedFixtureId(value ? Number.parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a completed match" />
                      </SelectTrigger>
                      <SelectContent>
                        {fixtures.map((fixture) => {
                          const sport = sports.find(s => s.sport_id === fixture.sport_id)
                          return (
                            <SelectItem key={fixture.fixture_id} value={fixture.fixture_id.toString()}>
                              {fixture.home_team_name} vs {fixture.away_team_name} - {formatDate(fixture.kickoff_time)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>

                </div>

                {selectedFixture && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {selectedFixture.home_team_name} vs {selectedFixture.away_team_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedFixture.kickoff_time)} at {formatTime(selectedFixture.kickoff_time)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {sports.find(s => s.sport_id === selectedFixture.sport_id)?.sport_name}
                      </Badge>
                    </div>
                    {selectedFixture.home_score !== null && selectedFixture.away_score !== null && (
                      <div className="mt-2">
                        <p className="text-sm">Current Score:</p>
                        <p className="text-lg font-bold">
                          {selectedFixture.home_score} - {selectedFixture.away_score}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 4: Enter Scores (Only for ADD mode) */}
            {!editingMatchId && formStep === "enterScores" && selectedFixture && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">
                    {selectedFixture.home_team_name} vs {selectedFixture.away_team_name}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {sports.find(s => s.sport_id === selectedFixture.sport_id)?.sport_name}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{selectedFixture.home_team_name} Score *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{selectedFixture.away_team_name} Score *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Player Stats Section (Shows for both edit and add modes) */}
            {(formStep === "enterPlayerStats" || editingMatchId) && selectedFixture && (
              <div className="space-y-6">
                {/* Only show this section header in ADD mode, EDIT mode shows it above */}
                {!editingMatchId && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {selectedFixture.home_team_name} vs {selectedFixture.away_team_name}
                      </p>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Final Score</p>
                        <p className="text-2xl font-bold">
                          {homeScore} - {awayScore}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Selector - Show for both modes */}
                <div className="flex gap-2 border-b">
                  <Button
                    variant={selectedTeam === "home" ? "default" : "ghost"}
                    onClick={() => setSelectedTeam("home")}
                    className="flex-1"
                  >
                    {selectedFixture.home_team_name}
                  </Button>
                  <Button
                    variant={selectedTeam === "away" ? "default" : "ghost"}
                    onClick={() => setSelectedTeam("away")}
                    className="flex-1"
                  >
                    {selectedFixture.away_team_name}
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Enter stats for{" "}
                    {selectedTeam === "home"
                      ? selectedFixture.home_team_name
                      : selectedFixture.away_team_name}
                  </p>
                  <div className="flex gap-2">
                    {/* Add Existing Player Dropdown */}
                    {getFilteredPlayers().length > 0 && (
                      <Select onValueChange={(value) => {
                        const player = players.find(p => p.player_id.toString() === value)
                        if (player) addExistingPlayer(player)
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredPlayers().map((player) => (
                            <SelectItem key={player.player_id} value={player.player_id.toString()}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{player.player_name}</span>
                                {player.jersey_number && (
                                  <Badge variant="outline" className="ml-auto">#{player.jersey_number}</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddPlayerForm(!showAddPlayerForm)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Custom Player
                    </Button>
                  </div>
                </div>

                {showAddPlayerForm && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                    <p className="font-semibold text-sm">Add Custom Player</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Player Name *</Label>
                        <Input
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Enter player name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Position/Role *</Label>
                        <Select
                          value={newPlayerPosition}
                          onValueChange={setNewPlayerPosition}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSportPositions(sports.find(s => s.sport_id === selectedFixture?.sport_id)?.sport_name).map(pos => (
                              <SelectItem key={pos} value={pos}>
                                {pos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={addCustomPlayer}>
                        Add Player
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddPlayerForm(false)
                          setNewPlayerName("")
                          setNewPlayerPosition("")
                          setValidationError("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Player Stats Form */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {(() => {
                    const sport = sports.find(s => s.sport_id === selectedFixture.sport_id)
                    const teamCustomPlayers = customPlayers.filter((cp) => cp.team === selectedTeam)
                    const sportRoles = getSportRoles()

                    return teamCustomPlayers.length > 0 ? (
                      teamCustomPlayers.map((player) => (
                        <div key={player.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{player.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {/* Position Selector */}
                                <div className="w-48">
                                  <Select
                                    value={player.position}
                                    onValueChange={(value) => {
                                      const updatedPlayers = customPlayers.map(p =>
                                        p.id === player.id ? { ...p, position: value } : p
                                      )
                                      setCustomPlayers(updatedPlayers)
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getSportPositions(sports.find(s => s.sport_id === selectedFixture?.sport_id)?.sport_name).map(pos => (
                                        <SelectItem key={pos} value={pos}>
                                          {pos}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {/* Role Selector */}
                                <div className="w-48">
                                  <Select
                                    value={playerStats[`${player.id}_role`] || ""}
                                    onValueChange={(value) =>
                                      setPlayerStats({ ...playerStats, [`${player.id}_role`]: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sportRoles.map(role => (
                                        <SelectItem key={role.position_id} value={role.position_id.toString()}>
                                          {role.position_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {player.jersey_number && (
                                  <Badge variant="secondary">#{player.jersey_number}</Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomPlayer(player.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {sport?.sport_name === "Cricket" ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Runs</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_runs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_runs`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Balls Faced</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_balls_faced`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_balls_faced`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Wickets</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={playerStats[`${player.id}_wickets`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_wickets`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Fours</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_fours`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_fours`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Sixes</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_sixes`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_sixes`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Overs</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={playerStats[`${player.id}_overs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_overs`]: e.target.value })
                                  }
                                  placeholder="0.0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Maidens</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_maidens`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_maidens`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Runs Conceded</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_runs_conceded`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_runs_conceded`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Catch</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_catches`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_catches`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Stumping</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_stumpings`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_stumpings`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Direct Run-out</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_run_outs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_run_outs`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Assisted Run-out</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_assisted_run_outs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_assisted_run_outs`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Economy Rate</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={playerStats[`${player.id}_economy_rate`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_economy_rate`]: e.target.value })
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Strike Rate</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={playerStats[`${player.id}_strike_rate`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_strike_rate`]: e.target.value })
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Fantasy Points</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_fantasy_points`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_fantasy_points`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Goals</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_goals`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_goals`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Assists</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_assists`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_assists`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Clean Sheets</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  value={playerStats[`${player.id}_clean_sheets`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_clean_sheets`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Minutes Played</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={playerStats[`${player.id}_minutes_played`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_minutes_played`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Yellow Cards</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_yellow_cards`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_yellow_cards`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Red Cards</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  value={playerStats[`${player.id}_red_cards`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_red_cards`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Goals Conceded</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_goals_conceded`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_goals_conceded`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Blocks</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_blocks`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_blocks`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Penalty Saves</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_penalty_saves`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_penalty_saves`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Catch</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_catches`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_catches`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Stumping</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_stumpings`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_stumpings`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Direct Run-out</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_run_outs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_run_outs`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Assisted Run-out</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_assisted_run_outs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_assisted_run_outs`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Fantasy Points</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_fantasy_points`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_fantasy_points`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No players added yet.</p>
                        <p className="text-sm mt-1">Select players from the dropdown or add custom players.</p>
                      </div>
                    )
                  })()}
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {/* Back button - only show in ADD mode */}
            {formStep !== "selectSport" && !editingMatchId && (
              <Button
                variant="outline"
                onClick={() => {
                  if (formStep === "enterScores") setFormStep("selectMatch")
                  else if (formStep === "enterPlayerStats") setFormStep("enterScores")
                  else if (formStep === "selectMatch") setFormStep("selectSeason")
                  else if (formStep === "selectSeason") setFormStep("selectSport")
                  setValidationError("")
                }}
              >
                Back
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setShowAddResultDialog(false)}>
              Cancel
            </Button>
            
            {/* Next/Save buttons */}
            {formStep === "selectSport" && !editingMatchId && (
              <Button onClick={proceedToSeasonSelect} disabled={!selectedSportId}>
                Next: Select Season
              </Button>
            )}
            {formStep === "selectSeason" && !editingMatchId && (
              <Button onClick={proceedToMatchSelect} disabled={!selectedSeasonId}>
                Next: Select Match
              </Button>
            )}
            {formStep === "selectMatch" && !editingMatchId && (
              <Button onClick={proceedToScoreEntry} disabled={!selectedFixtureId || fixtures.length === 0}>
                Next: Enter Scores
              </Button>
            )}
            {formStep === "enterScores" && !editingMatchId && (
              <Button onClick={proceedToPlayerStats}>
                Next: Enter Player Stats
              </Button>
            )}
            {(formStep === "enterPlayerStats" || editingMatchId) && (
              <Button onClick={handleSaveMatchResult}>
                {editingMatchId ? "Update Result" : "Save Result"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}