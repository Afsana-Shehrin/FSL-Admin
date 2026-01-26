"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Trophy, 
  Users, 
  TrendingUp,
  Download,
  Clock,
  Crown,
  Star,
  Target,
  Shield,
  Sword,
  Zap,
  Calculator
} from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from "@/lib/supabase/working-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface PlayerStats {
  stat_id: number
  player_id: number
  player_name: string
  team_id: number
  team_name: string
  position: string
  runs: number
  balls_faced: number
  wickets: number
  maidens: number
  fours: number
  sixes: number
  runs_conceded: number
  overs: number
  economy_rate: number
  strike_rate: number
  catches: number
  stumpings: number
  run_outs: number
  assisted_run_outs: number
  duck: boolean
  bowled_lbw_wickets: number
  fantasy_points: number
  is_captain?: boolean
  is_vice_captain?: boolean
  player_of_match?: boolean
}

interface ScoringRule {
  id: string
  category: string
  action_type: string
  points: number
  points_per_run?: number
  points_per_wicket?: number
  points_per_four?: number
  points_per_six?: number
  thirty_bonus?: number
  seventyfive_bonus?: number
  century_bonus?: number
  half_century_bonus?: number
  five_wicket_bonus?: number
  four_wicket_bonus?: number
  duck_points?: number
  bowled_bonus?: number
  catch_points?: number
  stump_points?: number
  run_out_points?: number
  captain_multiplier?: number
  vice_captain_multiplier?: number
  player_of_match_points?: number
}

interface TeamPoints {
  team_id: number
  team_name: string
  team_logo?: string
  total_points: number
  players: PlayerStats[]
}

export default function FantasyPointsPage() {
  const [teams, setTeams] = useState<TeamPoints[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerStats[]>([])
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [viewMode, setViewMode] = useState<"teams" | "players" | "rules">("teams")
  const [selectedPlayerBreakdown, setSelectedPlayerBreakdown] = useState<PlayerStats | null>(null)

  // Fetch all data
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchScoringRules(),
        fetchPlayerStats()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchScoringRules = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('scoring_rules')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      
      if (error) throw error
      setScoringRules(data || [])
      console.log("Scoring rules loaded:", data?.length)
    } catch (error) {
      console.error("Error fetching scoring rules:", error)
    }
  }

  const fetchPlayerStats = async () => {
    try {
      const supabase = getSupabase()
      
      // Fetch player stats with team info
      const { data: statsData, error: statsError } = await supabase
        .from('player_match_stats')
        .select(`
          *,
          teams!player_match_stats_team_id_fkey(team_name, team_logo_url)
        `)
        .order('fantasy_points', { ascending: false })
      
      if (statsError) throw statsError

      if (statsData) {
        const players = statsData.map((stat: { teams: { team_name: any; team_logo_url: any }; team_id: any }) => ({
          ...stat,
          team_name: stat.teams?.team_name || `Team ${stat.team_id}`,
          team_logo: stat.teams?.team_logo_url
        })) as PlayerStats[]
        
        setAllPlayers(players)
        
        // Group by team
        const teamsMap = new Map<number, TeamPoints>()
        
        players.forEach((player: PlayerStats) => {
          const teamId = player.team_id
          if (!teamsMap.has(teamId)) {
            teamsMap.set(teamId, {
              team_id: teamId,
              team_name: player.team_name,
              total_points: 0,
              players: []
            })
          }
          
          const team = teamsMap.get(teamId)!
          team.players.push(player)
          team.total_points += player.fantasy_points || 0
        })
        
        const teamsArray = Array.from(teamsMap.values())
        teamsArray.sort((a, b) => b.total_points - a.total_points)
        setTeams(teamsArray)
      }
    } catch (error) {
      console.error("Error fetching player stats:", error)
      toast.error("Failed to fetch player statistics")
    }
  }

  // Calculate fantasy points based on scoring rules
  const calculatePointsForPlayer = (player: PlayerStats): { total: number; breakdown: any } => {
    let total = 0
    const breakdown: any = {
      batting: 0,
      bowling: 0,
      fielding: 0,
      bonuses: 0,
      penalties: 0
    }

    // Get rule values with defaults
    const pointsPerRun = scoringRules.find(r => r.action_type === 'run')?.points || 1
    const pointsPerWicket = scoringRules.find(r => r.action_type === 'wicket')?.points || 25
    const pointsPerFour = scoringRules.find(r => r.action_type === 'four')?.points || 1
    const pointsPerSix = scoringRules.find(r => r.action_type === 'six')?.points || 2
    const pointsPerCatch = scoringRules.find(r => r.action_type === 'catch')?.points || 10
    const pointsPerStumping = scoringRules.find(r => r.action_type === 'stumping')?.points || 15
    const pointsPerRunOut = scoringRules.find(r => r.action_type === 'run_out')?.points || 15
    const centuryBonus = scoringRules.find(r => r.action_type === 'century')?.points || 25
    const fiftyBonus = scoringRules.find(r => r.action_type === 'half_century')?.points || 10
    const thirtyBonus = scoringRules.find(r => r.action_type === 'thirty')?.points || 4
    const fiveWicketBonus = scoringRules.find(r => r.action_type === 'five_wicket')?.points || 25
    const fourWicketBonus = scoringRules.find(r => r.action_type === 'four_wicket')?.points || 10
    const duckPenalty = scoringRules.find(r => r.action_type === 'duck')?.points || -5
    const captainMultiplier = scoringRules.find(r => r.action_type === 'captain_multiplier')?.points || 1.5
    const viceCaptainMultiplier = scoringRules.find(r => r.action_type === 'vice_captain_multiplier')?.points || 1.25
    const playerOfMatchBonus = scoringRules.find(r => r.action_type === 'player_of_match')?.points || 50

    // Batting points
    const runsPoints = player.runs * pointsPerRun
    const foursPoints = player.fours * pointsPerFour
    const sixesPoints = player.sixes * pointsPerSix
    const battingTotal = runsPoints + foursPoints + sixesPoints
    breakdown.batting = battingTotal
    total += battingTotal

    // Batting milestones
    if (player.runs >= 100) {
      total += centuryBonus
      breakdown.bonuses += centuryBonus
    } else if (player.runs >= 50) {
      total += fiftyBonus
      breakdown.bonuses += fiftyBonus
    } else if (player.runs >= 30) {
      total += thirtyBonus
      breakdown.bonuses += thirtyBonus
    }

    // Duck penalty
    if (player.duck && player.runs === 0) {
      total += duckPenalty
      breakdown.penalties += duckPenalty
    }

    // Bowling points
    const wicketsPoints = player.wickets * pointsPerWicket
    breakdown.bowling = wicketsPoints
    total += wicketsPoints

    // Bowling milestones
    if (player.wickets >= 5) {
      total += fiveWicketBonus
      breakdown.bonuses += fiveWicketBonus
    } else if (player.wickets >= 4) {
      total += fourWicketBonus
      breakdown.bonuses += fourWicketBonus
    }

    // Fielding points
    const catchesPoints = player.catches * pointsPerCatch
    const stumpingsPoints = player.stumpings * pointsPerStumping
    const runoutsPoints = (player.run_outs + player.assisted_run_outs) * pointsPerRunOut
    const fieldingTotal = catchesPoints + stumpingsPoints + runoutsPoints
    breakdown.fielding = fieldingTotal
    total += fieldingTotal

    // Captain/Vice-captain multipliers
    if (player.is_captain) {
      total *= captainMultiplier
    } else if (player.is_vice_captain) {
      total *= viceCaptainMultiplier
    }

    // Player of match bonus
    if (player.player_of_match) {
      total += playerOfMatchBonus
      breakdown.bonuses += playerOfMatchBonus
    }

    return { total: Number(total.toFixed(2)), breakdown }
  }

  // Recalculate all players' points
  const recalculateAllPoints = async () => {
    if (!confirm("This will recalculate fantasy points for all players based on current scoring rules. Continue?")) return
    
    setIsCalculating(true)
    try {
      const supabase = getSupabase()
      
      let updatedCount = 0
      let failedCount = 0
      
      for (const player of allPlayers) {
        try {
          const { total, breakdown } = calculatePointsForPlayer(player)
          
          const { error } = await supabase
            .from('player_match_stats')
            .update({ 
              fantasy_points: total,
              last_calculated_at: new Date().toISOString()
            })
            .eq('stat_id', player.stat_id)
          
          if (error) {
            console.error(`Error updating player ${player.player_id}:`, error)
            failedCount++
          } else {
            updatedCount++
          }
        } catch (error) {
          console.error(`Error calculating for player ${player.player_id}:`, error)
          failedCount++
        }
      }
      
      toast.success(`Updated ${updatedCount} players. Failed: ${failedCount}`)
      await fetchPlayerStats() // Refresh data
      
    } catch (error) {
      console.error("Error recalculating points:", error)
      toast.error("Failed to recalculate points")
    } finally {
      setIsCalculating(false)
    }
  }

  // Update single player's points
  const updatePlayerPoints = async (player: PlayerStats) => {
    try {
      const { total, breakdown } = calculatePointsForPlayer(player)
      
      const supabase = getSupabase()
      const { error } = await supabase
        .from('player_match_stats')
        .update({ 
          fantasy_points: total,
          last_calculated_at: new Date().toISOString()
        })
        .eq('stat_id', player.stat_id)
      
      if (error) throw error
      
      toast.success(`Updated ${player.player_name}'s points to ${total}`)
      await fetchPlayerStats() // Refresh
      
    } catch (error) {
      console.error("Error updating player points:", error)
      toast.error("Failed to update points")
    }
  }

  // Export data as CSV
  const exportToCSV = () => {
    const headers = ["Player Name", "Team", "Position", "Runs", "Wickets", "Catches", "Total Points"]
    const data = allPlayers.map(player => [
      player.player_name,
      player.team_name,
      player.position,
      player.runs,
      player.wickets,
      player.catches,
      player.fantasy_points
    ])
    
    const csvContent = [
      headers.join(","),
      ...data.map(row => row.join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fantasy_points_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success("Data exported successfully")
  }

  // Filter players
  const filteredPlayers = allPlayers
    .filter(player => {
      if (searchQuery) {
        return player.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               player.team_name.toLowerCase().includes(searchQuery.toLowerCase())
      }
      if (selectedTeam !== "all") {
        return player.team_id.toString() === selectedTeam
      }
      if (selectedPosition !== "all") {
        return player.position.toLowerCase() === selectedPosition.toLowerCase()
      }
      return true
    })
    .sort((a, b) => (b.fantasy_points || 0) - (a.fantasy_points || 0))

  // Filter teams
  const filteredTeams = teams.filter(team => {
    if (searchQuery) {
      return team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             team.players.some(p => p.player_name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return true
  })

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'batsman': return 'bg-blue-100 text-blue-800'
      case 'bowler': return 'bg-green-100 text-green-800'
      case 'all-rounder': return 'bg-purple-100 text-purple-800'
      case 'wicket-keeper': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const PlayerBreakdownModal = ({ player }: { player: PlayerStats }) => {
    const { total, breakdown } = calculatePointsForPlayer(player)
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Points Breakdown: {player.player_name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPlayerBreakdown(null)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{breakdown.batting.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Batting</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{breakdown.bowling.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Bowling</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{breakdown.fielding.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Fielding</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{total.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3">Player Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{player.runs}</div>
                      <div className="text-sm text-muted-foreground">Runs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{player.wickets}</div>
                      <div className="text-sm text-muted-foreground">Wickets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{player.catches}</div>
                      <div className="text-sm text-muted-foreground">Catches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{player.strike_rate.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Strike Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                onClick={() => {
                  updatePlayerPoints(player)
                  setSelectedPlayerBreakdown(null)
                }}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Update Points to {total.toFixed(1)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fantasy Points Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and calculate fantasy points for cricket players
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          
          <Button
            onClick={recalculateAllPoints}
            disabled={isCalculating}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Calculating...' : 'Recalculate All Points'}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{teams.length}</div>
                <div className="text-sm text-muted-foreground">Total Teams</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{allPlayers.length}</div>
                <div className="text-sm text-muted-foreground">Total Players</div>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {allPlayers.reduce((sum, player) => sum + (player.fantasy_points || 0), 0).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {allPlayers.length > 0 
                    ? Math.max(...allPlayers.map(p => p.fantasy_points || 0)).toFixed(1)
                    : "0"
                  }
                </div>
                <div className="text-sm text-muted-foreground">Top Score</div>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>Fantasy Points Management</CardTitle>
            
            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Team filter */}
              <div className="w-full md:w-48">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Position filter */}
              <div className="w-full md:w-48">
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="all-rounder">All-Rounder</SelectItem>
                    <SelectItem value="wicket-keeper">Wicket-Keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search players or teams..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mt-4">
            <TabsList>
              <TabsTrigger value="teams">Team View</TabsTrigger>
              <TabsTrigger value="players">Player Leaderboard</TabsTrigger>
              <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading fantasy points...</p>
            </div>
          ) : (
            <>
              {viewMode === "teams" ? (
                <div className="space-y-6">
                  {filteredTeams.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No teams found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filteredTeams.map(team => (
                      <Card key={team.team_id} className="overflow-hidden">
                        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={team.team_logo} />
                                <AvatarFallback>
                                  {team.team_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle>{team.team_name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">
                                    <Users className="h-3 w-3 mr-1" />
                                    {team.players.length} players
                                  </Badge>
                                  <Badge className="bg-primary">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    {team.total_points.toFixed(1)} total points
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Recalculate team points
                                toast.info(`Recalculating points for ${team.team_name}...`)
                              }}
                            >
                              Update Team
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Player</TableHead>
                                  <TableHead>Position</TableHead>
                                  <TableHead>Runs</TableHead>
                                  <TableHead>Wickets</TableHead>
                                  <TableHead>Catches</TableHead>
                                  <TableHead>Points</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {team.players.map(player => (
                                  <TableRow key={player.stat_id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        {player.is_captain && <Crown className="h-4 w-4 text-yellow-600" />}
                                        {player.is_vice_captain && <Star className="h-4 w-4 text-gray-400" />}
                                        {player.player_name}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={getPositionColor(player.position)}>
                                        {player.position}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{player.runs}</TableCell>
                                    <TableCell>{player.wickets}</TableCell>
                                    <TableCell>{player.catches}</TableCell>
                                    <TableCell>
                                      <span className="font-bold text-primary">
                                        {player.fantasy_points?.toFixed(1) || 0}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setSelectedPlayerBreakdown(player)}
                                        >
                                          View
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updatePlayerPoints(player)}
                                        >
                                          Update
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : viewMode === "players" ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Runs</TableHead>
                        <TableHead>Wickets</TableHead>
                        <TableHead>Catches</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player, index) => (
                        <TableRow key={player.stat_id}>
                          <TableCell>
                            <Badge variant={index < 3 ? "default" : "outline"}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {player.player_name}
                              {player.is_captain && <Crown className="h-4 w-4 text-yellow-600" />}
                              {player.is_vice_captain && <Star className="h-4 w-4 text-gray-400" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{player.team_name}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getPositionColor(player.position)}>
                              {player.position}
                            </Badge>
                          </TableCell>
                          <TableCell>{player.runs}</TableCell>
                          <TableCell>{player.wickets}</TableCell>
                          <TableCell>{player.catches}</TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">
                              {player.fantasy_points?.toFixed(1) || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPlayerBreakdown(player)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updatePlayerPoints(player)}
                              >
                                Update
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredPlayers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No players found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              ) : (
                // Scoring Rules View
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Active Scoring Rules ({scoringRules.length})</h3>
                    <Button variant="outline" onClick={fetchScoringRules}>
                      Refresh Rules
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scoringRules.map(rule => (
                      <Card key={rule.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold">{rule.action_type.replace('_', ' ').toUpperCase()}</div>
                              <div className="text-sm text-muted-foreground">{rule.category}</div>
                            </div>
                            <Badge className="font-bold">
                              {rule.points > 0 ? '+' : ''}{rule.points}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Applied to: {rule.category === 'batting' ? 'Batsmen' : 
                                       rule.category === 'bowling' ? 'Bowlers' : 
                                       rule.category === 'fielding' ? 'Fielders' : 'All'}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {scoringRules.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No scoring rules found</p>
                      <p className="text-sm">Configure scoring rules in the admin panel</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Player Breakdown Modal */}
      {selectedPlayerBreakdown && (
        <PlayerBreakdownModal player={selectedPlayerBreakdown} />
      )}
    </div>
  )
}