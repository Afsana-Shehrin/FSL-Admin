"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar, TrendingUp, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import RecentActivity from "./recent-activity"
import QuickActions from "./quick-actions"
import DashboardDialogs from "./dialogs"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SportStat {
  sport_name: string
  player_count: number
  team_count: number
  league_count: number
}

export default function AdminDashboard() {
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false)
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [addActionDialogOpen, setAddActionDialogOpen] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSports: 0,
    activeSports: 0,
    totalPlayers: 0,
    playersBySport: [] as SportStat[],
    totalLeagues: 0,
    activeLeagues: 0,
    leaguesBySport: [] as {sport_name: string, count: number}[],
    totalTeams: 0,
    teamsBySport: [] as {sport_name: string, count: number}[]
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  async function fetchDashboardStats() {
    try {
      setIsLoading(true)
      
      // Fetch all data in parallel
      const [
        sportsResponse,
        playersResponse,
        leaguesResponse,
        teamsResponse
      ] = await Promise.all([
        supabase.from('sports').select('sport_id, sport_name, is_active'),
        supabase.from('players').select('sport_id, sports(sport_name), is_active'),
        supabase.from('leagues').select('sport_id, sports(sport_name), is_active'),
        supabase.from('teams').select('sport_id, sports(sport_name), is_active')
      ])

      const sports = sportsResponse.data || []
      const players = playersResponse.data || []
      const leagues = leaguesResponse.data || []
      const teams = teamsResponse.data || []

      // Process sports
      const totalSports = sports.length
      const activeSports = sports.filter((s: { is_active: any }) => s.is_active).length

      // Process players by sport
      const playerCounts = new Map<string, number>()
      const activePlayers = players.filter((p: { is_active: any }) => p.is_active)
      
      activePlayers.forEach((player: any) => {
        const sportName = player.sports?.sport_name || 'Unknown'
        playerCounts.set(sportName, (playerCounts.get(sportName) || 0) + 1)
      })

      const totalPlayers = activePlayers.length
      const playersBySport = Array.from(playerCounts.entries()).map(([sport_name, player_count]) => ({
        sport_name,
        player_count,
        team_count: 0,
        league_count: 0
      }))

      // Process leagues by sport
      const leagueCounts = new Map<string, {total: number, active: number}>()
      
      leagues.forEach((league: any) => {
        const sportName = league.sports?.sport_name || 'Unknown'
        const current = leagueCounts.get(sportName) || {total: 0, active: 0}
        current.total++
        if (league.is_active) current.active++
        leagueCounts.set(sportName, current)
      })

      const totalLeagues = leagues.length
      const activeLeagues = leagues.filter((l: { is_active: any }) => l.is_active).length
      const leaguesBySport = Array.from(leagueCounts.entries()).map(([sport_name, counts]) => ({
        sport_name,
        count: counts.total
      }))

      // Process teams by sport
      const teamCounts = new Map<string, number>()
      const activeTeams = teams.filter((t: { is_active: any }) => t.is_active)
      
      activeTeams.forEach((team: any) => {
        const sportName = team.sports?.sport_name || 'Unknown'
        teamCounts.set(sportName, (teamCounts.get(sportName) || 0) + 1)
      })

      const totalTeams = activeTeams.length
      const teamsBySport = Array.from(teamCounts.entries()).map(([sport_name, count]) => ({
        sport_name,
        count
      }))

      // Merge all sport data
      const allSportNames = new Set([
        ...playersBySport.map(p => p.sport_name),
        ...teamsBySport.map(t => t.sport_name),
        ...leaguesBySport.map(l => l.sport_name)
      ])

      const sportStats = Array.from(allSportNames).map(sport_name => {
        const playerStat = playersBySport.find(p => p.sport_name === sport_name)
        const teamStat = teamsBySport.find(t => t.sport_name === sport_name)
        const leagueStat = leaguesBySport.find(l => l.sport_name === sport_name)
        return {
          sport_name,
          player_count: playerStat?.player_count || 0,
          team_count: teamStat?.count || 0,
          league_count: leagueStat?.count || 0
        }
      }).filter(stat => stat.player_count > 0 || stat.team_count > 0 || stat.league_count > 0)

      setStats({
        totalSports,
        activeSports,
        totalPlayers,
        playersBySport: sportStats,
        totalLeagues,
        activeLeagues,
        leaguesBySport,
        totalTeams,
        teamsBySport
      })

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Active Sports",
      value: isLoading ? "..." : `${stats.activeSports}/${stats.totalSports}`,
      icon: Trophy,
      details: stats.playersBySport.map(sport => ({
        label: sport.sport_name,
        value: ` ${sport.league_count} leagues, ${sport.team_count} teams`
      }))
    },
    {
      title: "Total Players",
      value: isLoading ? "..." : stats.totalPlayers.toString(),
      icon: Users,
      details: stats.playersBySport.map(sport => ({
        label: sport.sport_name,
        value: `${sport.player_count} players`
      }))
    },
    {
      title: "Active Leagues",
      value: isLoading ? "..." : `${stats.activeLeagues}/${stats.totalLeagues}`,
      icon: TrendingUp,
      details: [
        { label: "Total Sports", value: stats.totalSports.toString() },
        { label: "Active Sports", value: stats.activeSports.toString() },
        { label: "Total Teams", value: stats.totalTeams.toString() }
      ]
    },
    {
      title: "Total Teams",
      value: isLoading ? "..." : stats.totalTeams.toString(),
      icon: Shield,
      details: stats.teamsBySport.map(sport => ({
        label: sport.sport_name,
        value: `${sport.count} teams`
      }))
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome to your fantasy sports admin panel</p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
               
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-2 space-y-1">
                  {stat.details.map((detail, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{detail.label}:</span>
                      <span className="font-medium">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity />
        <QuickActions
          onLock={() => setLockDialogOpen(true)}
          onScoring={() => setScoringDialogOpen(true)}
          onStats={() => setStatsDialogOpen(true)}
          onAddAction={() => setAddActionDialogOpen(true)}
        />
      </div>

      <DashboardDialogs
        lockDialogOpen={lockDialogOpen}
        setLockDialogOpen={setLockDialogOpen}
        scoringDialogOpen={scoringDialogOpen}
        setScoringDialogOpen={setScoringDialogOpen}
        statsDialogOpen={statsDialogOpen}
        setStatsDialogOpen={setStatsDialogOpen}
        addActionDialogOpen={addActionDialogOpen}
        setAddActionDialogOpen={setAddActionDialogOpen}
      />
    </div>
  )
}