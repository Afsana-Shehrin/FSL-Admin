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
import { 
  calculateCricketFantasyPoints, 
  calculateFootballFantasyPoints
} from "./lib/fantasyPoints"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

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
  fantasy_points: number
  maidens: number
  fours: number
  sixes: number
  runs_conceded: number
  minutes_played: number
  blocks: number
  penalty_saves: number
  goals_conceded: number
  overs: number | null
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
        { data: playersData, error: playersError }
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
        supabase.from('players').select('player_id, player_name, team_id, sport_id, jersey_number, is_active')
      ])

      if (resultsError) throw resultsError
      if (teamsError) throw teamsError
      if (sportsError) throw sportsError
      if (seasonsError) throw seasonsError
      if (playersError) throw playersError

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
    } catch (error) {
      console.error("Error fetching fixtures:", error)
      setValidationError("Failed to fetch fixtures")
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

  const calculateFantasyPoints = (playerStat: PlayerStat, sportName: string) => {
    if (sportName === "Cricket") {
      return calculateCricketFantasyPoints({
        runs: playerStat.runs || 0,
        wickets: playerStat.wickets || 0,
        balls_faced: playerStat.balls_faced || 0,
        maidens: playerStat.maidens || 0,
        fours: playerStat.fours || 0,
        sixes: playerStat.sixes || 0,
        runs_conceded: playerStat.runs_conceded || 0,
        overs: playerStat.overs || 0,
        yellow_cards: playerStat.yellow_cards || 0,
        red_cards: playerStat.red_cards || 0,
        catches: playerStat.fours || 0, // Using fours as catches since catches field removed
        stumpings: playerStat.sixes || 0, // Using sixes as stumpings
        run_outs: playerStat.runs_conceded || 0, // Using runs_conceded as run_outs
        economy_rate: playerStat.overs ? (playerStat.runs_conceded || 0) / playerStat.overs : null
      })
    } else {
      // Football
      return calculateFootballFantasyPoints({
        goals: playerStat.goals || 0,
        assists: playerStat.assists || 0,
        clean_sheets: playerStat.clean_sheets || 0,
        position: playerStat.position || 'Forward',
        minutes_played: playerStat.minutes_played || 0,
        goals_conceded: playerStat.goals_conceded || 0,
        yellow_cards: playerStat.yellow_cards || 0,
        red_cards: playerStat.red_cards || 0,
        tackles: playerStat.fours || 0, // Using fours as tackles
        interceptions: playerStat.sixes || 0, // Using sixes as interceptions
        saves: playerStat.maidens || 0, // Using maidens as saves
        blocks: playerStat.blocks || 0,
        penalty_saves: playerStat.penalty_saves || 0
      })
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

  const openEditResultDialog = (matchResult: MatchResult) => {
    setEditingMatchId(matchResult.result_id)
    setShowAddResultDialog(true)
    setFormStep("selectSport")
    setSelectedSportId(matchResult.sport_id.toString())
    setSelectedSeasonId(matchResult.season_id.toString())
    setSelectedFixtureId(null)
    setHomeScore(matchResult.home_score.toString())
    setAwayScore(matchResult.away_score.toString())

    // Pre-populate player stats
    const stats: Record<string, any> = {}
    const allPlayers = [...(matchResult.home_player_stats || []), ...(matchResult.away_player_stats || [])]
    
    // Convert database player stats to custom players
    const customPlayersData: CustomPlayer[] = allPlayers.map(ps => ({
      id: `custom_${ps.player_id}`,
      player_id: ps.player_id,
      name: ps.player_name,
      position: ps.position,
      team: ps.team_id === matchResult.home_team_id ? "home" as const : "away" as const
    }))

    allPlayers.forEach((ps) => {
      const playerId = `custom_${ps.player_id}`
      
      // For cricket
      if (ps.runs !== undefined && ps.runs !== null) stats[`${playerId}_runs`] = ps.runs.toString()
      if (ps.balls_faced !== undefined && ps.balls_faced !== null) stats[`${playerId}_balls_faced`] = ps.balls_faced.toString()
      if (ps.wickets !== undefined && ps.wickets !== null) stats[`${playerId}_wickets`] = ps.wickets.toString()
      if (ps.fours !== undefined && ps.fours !== null) stats[`${playerId}_fours`] = ps.fours.toString()
      if (ps.sixes !== undefined && ps.sixes !== null) stats[`${playerId}_sixes`] = ps.sixes.toString()
      if (ps.maidens !== undefined && ps.maidens !== null) stats[`${playerId}_maidens`] = ps.maidens.toString()
      if (ps.runs_conceded !== undefined && ps.runs_conceded !== null) stats[`${playerId}_runs_conceded`] = ps.runs_conceded.toString()
      if (ps.overs !== undefined && ps.overs !== null) stats[`${playerId}_overs`] = ps.overs.toString()
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
    
    // Fetch fixtures for this sport and season
    fetchFixtures(matchResult.sport_id.toString(), matchResult.season_id.toString())
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
    await fetchFixtures(selectedSportId, selectedSeasonId)
    
    // Check if there are fixtures
    if (fixtures.length === 0) {
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
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('result_id', editingMatchId)

        if (updateError) throw updateError
        resultId = editingMatchId

        // Delete existing player stats
        await supabase
          .from('player_match_stats')
          .delete()
          .eq('result_id', editingMatchId)
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
          fantasy_points: 0
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
            fantasy_points: calculateCricketFantasyPoints({
              runs,
              wickets,
              balls_faced,
              maidens,
              fours,
              sixes,
              runs_conceded,
              overs: overs || 0,
              yellow_cards: Number.parseInt(playerStats[`${player.id}_yellow_cards`] || "0"),
              red_cards: Number.parseInt(playerStats[`${player.id}_red_cards`] || "0"),
              catches: fours, // Using fours as catches
              stumpings: sixes, // Using sixes as stumpings
              run_outs: runs_conceded, // Using runs_conceded as run_outs
              economy_rate: overs ? runs_conceded / overs : null
            })
          }
        } else {
          // Football
          const goals = Number.parseInt(playerStats[`${player.id}_goals`] || "0")
          const assists = Number.parseInt(playerStats[`${player.id}_assists`] || "0")
          const clean_sheets = Number.parseInt(playerStats[`${player.id}_clean_sheets`] || "0")
          const minutes_played = Number.parseInt(playerStats[`${player.id}_minutes_played`] || "0")
          const goals_conceded = Number.parseInt(playerStats[`${player.id}_goals_conceded`] || "0")
          
          stats = {
            ...stats,
            goals,
            assists,
            clean_sheets,
            minutes_played,
            goals_conceded,
            yellow_cards: Number.parseInt(playerStats[`${player.id}_yellow_cards`] || "0"),
            red_cards: Number.parseInt(playerStats[`${player.id}_red_cards`] || "0"),
            blocks: Number.parseInt(playerStats[`${player.id}_blocks`] || "0"),
            penalty_saves: Number.parseInt(playerStats[`${player.id}_penalty_saves`] || "0"),
            fantasy_points: calculateFootballFantasyPoints({
              goals,
              assists,
              clean_sheets,
              position: player.position || 'Forward',
              minutes_played,
              goals_conceded,
              yellow_cards: Number.parseInt(playerStats[`${player.id}_yellow_cards`] || "0"),
              red_cards: Number.parseInt(playerStats[`${player.id}_red_cards`] || "0"),
              tackles: Number.parseInt(playerStats[`${player.id}_tackles`] || "0"),
              interceptions: Number.parseInt(playerStats[`${player.id}_interceptions`] || "0"),
              saves: Number.parseInt(playerStats[`${player.id}_saves`] || "0"),
              blocks: Number.parseInt(playerStats[`${player.id}_blocks`] || "0"),
              penalty_saves: Number.parseInt(playerStats[`${player.id}_penalty_saves`] || "0")
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
                    <TableHead className="text-right">Runs Con.</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">Goals</TableHead>
                    <TableHead className="text-right">Assists</TableHead>
                    <TableHead className="text-right">CS</TableHead>
                    <TableHead className="text-right">Mins</TableHead>
                    <TableHead className="text-right">YC</TableHead>
                    <TableHead className="text-right">RC</TableHead>
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
              {formStep === "selectSport" && "Select a sport type"}
              {formStep === "selectSeason" && "Select a season"}
              {formStep === "selectMatch" && "Select a completed match to add result"}
              {formStep === "enterScores" && "Enter the final scores for both teams"}
              {formStep === "enterPlayerStats" &&
                "Enter player statistics for both teams. Stats must match the final scores."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Select Sport */}
            {formStep === "selectSport" && (
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

            {/* Step 2: Select Season */}
            {formStep === "selectSeason" && (
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

            {/* Step 3: Select Match */}
            {formStep === "selectMatch" && selectedSportId && selectedSeasonId && (
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

            {/* Step 4: Enter Scores */}
            {formStep === "enterScores" && selectedFixture && (
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

            {/* Step 5: Enter Player Stats */}
            {formStep === "enterPlayerStats" && selectedFixture && (
              <div className="space-y-6">
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

                {/* Team Selector */}
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
                        <select
                          value={newPlayerPosition}
                          onChange={(e) => setNewPlayerPosition(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        >
                          <option value="">Select position</option>
                          {getSportPositions(sports.find(s => s.sport_id === selectedFixture?.sport_id)?.sport_name).map(pos => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                        </select>
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

                    return teamCustomPlayers.length > 0 ? (
                      teamCustomPlayers.map((player) => (
                        <div key={player.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{player.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {/* Position Selector */}
                                <div className="w-48">
                                  <select
                                    value={player.position}
                                    onChange={(e) => {
                                      const updatedPlayers = customPlayers.map(p =>
                                        p.id === player.id ? { ...p, position: e.target.value } : p
                                      )
                                      setCustomPlayers(updatedPlayers)
                                    }}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                  >
                                    {getSportPositions(sports.find(s => s.sport_id === selectedFixture?.sport_id)?.sport_name).map(pos => (
                                      <option key={pos} value={pos}>
                                        {pos}
                                      </option>
                                    ))}
                                  </select>
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
            {formStep !== "selectSport" && (
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
            {formStep === "selectSport" && (
              <Button onClick={proceedToSeasonSelect} disabled={!selectedSportId}>
                Next: Select Season
              </Button>
            )}
            {formStep === "selectSeason" && (
              <Button onClick={proceedToMatchSelect} disabled={!selectedSeasonId}>
                Next: Select Match
              </Button>
            )}
            {formStep === "selectMatch" && (
              <Button onClick={proceedToScoreEntry} disabled={!selectedFixtureId || fixtures.length === 0}>
                Next: Enter Scores
              </Button>
            )}
            {formStep === "enterScores" && (
              <Button onClick={proceedToPlayerStats}>
                Next: Enter Player Stats
              </Button>
            )}
            {formStep === "enterPlayerStats" && (
              <Button onClick={handleSaveMatchResult}>{editingMatchId ? "Update Result" : "Save Result"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}