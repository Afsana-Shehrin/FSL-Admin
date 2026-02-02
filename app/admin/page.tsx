"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, TrendingUp, Shield, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { getSupabase } from '@/lib/supabase/working-client'
import RecentActivity from "./recent-activity"
import DashboardDialogs from "./dialogs"
import QuickActions from "./quick-actions"

// Initialize Supabase client
const supabase = getSupabase()

interface SportStat {
  sport_name: string
  player_count: { active: number; total: number }
  team_count: { active: number; total: number }
  league_count: { active: number; total: number }
  is_active: boolean
}

export default function AdminDashboard() {
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false)
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [addActionDialogOpen, setAddActionDialogOpen] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalSports: 0,
    activeSports: 0,
    activeSportNames: [] as string[],
    totalPlayers: { active: 0, total: 0 },
    playersBySport: [] as SportStat[],
    totalLeagues: { active: 0, total: 0 },
    activeLeagues: 0,
    leaguesBySport: [] as {sport_name: string, active: number, total: number, is_active: boolean}[],
    leaguesByActiveSport: [] as {sport_name: string, active: number, total: number}[],
    totalTeams: { active: 0, total: 0 },
    teamsBySport: [] as {sport_name: string, active: number, total: number}[]
  })

  useEffect(() => {
    // Initial fetch
    fetchDashboardStats()
    
    // Set up real-time subscriptions for all tables
    const teamsChannel = supabase
      .channel('teams-realtime')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'teams' 
        }, 
        () => {
          fetchDashboardStats()
        }
      )
      .subscribe()

    const playersChannel = supabase
      .channel('players-realtime')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'players' 
        }, 
        () => {
          fetchDashboardStats()
        }
      )
      .subscribe()

    const sportsChannel = supabase
      .channel('sports-realtime')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'sports' 
        }, 
        () => {
          fetchDashboardStats()
        }
      )
      .subscribe()

    const leaguesChannel = supabase
      .channel('leagues-realtime')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'leagues' 
        }, 
        () => {
          fetchDashboardStats()
        }
      )
      .subscribe()

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      supabase.removeChannel(teamsChannel)
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(sportsChannel)
      supabase.removeChannel(leaguesChannel)
    }
  }, [])

  async function fetchDashboardStats() {
    try {
      setIsLoading(true)
      setIsRefreshing(true)
      
      // Fetch all data in parallel
      const [
        sportsResponse,
        playersResponse,
        leaguesResponse,
        teamsResponse
      ] = await Promise.all([
        supabase.from('sports').select('sport_id, sport_name, is_active'),
        supabase.from('players').select('sport_id, sports(sport_name), is_active'),
        supabase.from('leagues').select('sport_id, sports(sport_name, is_active), is_active'),
        supabase.from('teams').select('sport_id, sports(sport_name), is_active')
      ])

      const sports = sportsResponse.data || []
      const players = playersResponse.data || []
      const leagues = leaguesResponse.data || []
      const teams = teamsResponse.data || []

      // Process sports - get active sport names
      const totalSports = sports.length
      const activeSports = sports.filter((s: { is_active: any }) => s.is_active).length
      const activeSportNames = sports
        .filter((s: { is_active: any }) => s.is_active)
        .map((s: { sport_name: string }) => s.sport_name)

      // Process players by sport - count both active and total
      const playerCounts = new Map<string, {active: number, total: number}>()
      const activePlayers = players.filter((p: { is_active: any }) => p.is_active)
      const totalPlayers = players.length
      
      players.forEach((player: any) => {
        const sportName = player.sports?.sport_name || 'Unknown'
        const current = playerCounts.get(sportName) || {active: 0, total: 0}
        current.total++
        if (player.is_active) current.active++
        playerCounts.set(sportName, current)
      })

      const playersBySport = Array.from(playerCounts.entries()).map(([sport_name, counts]) => ({
        sport_name,
        player_count: counts,
        team_count: { active: 0, total: 0 },
        league_count: { active: 0, total: 0 },
        is_active: activeSportNames.includes(sport_name)
      }))

      // Process leagues by sport - count both active and total
      const leagueCounts = new Map<string, {active: number, total: number, sport_active: boolean}>()
      const leagueCountsByActiveSport = new Map<string, {active: number, total: number}>() // Only for active sports
      
      leagues.forEach((league: any) => {
        const sportName = league.sports?.sport_name || 'Unknown'
        const isSportActive = league.sports?.is_active || false
        const current = leagueCounts.get(sportName) || {active: 0, total: 0, sport_active: isSportActive}
        current.total++
        if (league.is_active) current.active++
        leagueCounts.set(sportName, current)
        
        // Only count leagues for active sports
        if (isSportActive) {
          const activeSportCount = leagueCountsByActiveSport.get(sportName) || {active: 0, total: 0}
          activeSportCount.total++
          if (league.is_active) activeSportCount.active++
          leagueCountsByActiveSport.set(sportName, activeSportCount)
        }
      })

      const totalLeagues = leagues.length
      const activeLeagues = leagues.filter((l: { is_active: any }) => l.is_active).length
      const leaguesBySport = Array.from(leagueCounts.entries()).map(([sport_name, data]) => ({
        sport_name,
        active: data.active,
        total: data.total,
        is_active: data.sport_active
      }))
      
      // Leagues only for active sports
      const leaguesByActiveSport = Array.from(leagueCountsByActiveSport.entries()).map(([sport_name, counts]) => ({
        sport_name,
        active: counts.active,
        total: counts.total
      }))

      // Process teams by sport - count both active and total
      const teamCounts = new Map<string, {active: number, total: number}>()
      const activeTeams = teams.filter((t: { is_active: any }) => t.is_active)
      const totalTeams = teams.length
      
      teams.forEach((team: any) => {
        const sportName = team.sports?.sport_name || 'Unknown'
        const current = teamCounts.get(sportName) || {active: 0, total: 0}
        current.total++
        if (team.is_active) current.active++
        teamCounts.set(sportName, current)
      })

      const teamsBySport = Array.from(teamCounts.entries()).map(([sport_name, counts]) => ({
        sport_name,
        active: counts.active,
        total: counts.total
      }))

      // Merge all sport data
      const allSportNames = new Set([
        ...Array.from(playerCounts.keys()),
        ...Array.from(teamCounts.keys()),
        ...Array.from(leagueCounts.keys())
      ])

      const sportStats = Array.from(allSportNames).map(sport_name => {
        const playerStat = playersBySport.find(p => p.sport_name === sport_name)
        const teamStat = teamsBySport.find(t => t.sport_name === sport_name)
        const leagueStat = leaguesBySport.find(l => l.sport_name === sport_name)
        return {
          sport_name,
          player_count: playerStat?.player_count || { active: 0, total: 0 },
          team_count: teamStat ? { active: teamStat.active, total: teamStat.total } : { active: 0, total: 0 },
          league_count: leagueStat ? { active: leagueStat.active, total: leagueStat.total } : { active: 0, total: 0 },
          is_active: activeSportNames.includes(sport_name)
        }
      }).filter(stat => stat.player_count.total > 0 || stat.team_count.total > 0 || stat.league_count.total > 0)

      setStats({
        totalSports,
        activeSports,
        activeSportNames,
        totalPlayers: { active: activePlayers.length, total: totalPlayers },
        playersBySport: sportStats,
        totalLeagues: { active: activeLeagues, total: totalLeagues },
        activeLeagues,
        leaguesBySport,
        leaguesByActiveSport,
        totalTeams: { active: activeTeams.length, total: totalTeams },
        teamsBySport
      })

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const statsCards = [
    {
      title: "Active Sports",
      value: isLoading ? "..." : `${stats.activeSports}/${stats.totalSports}`,
      icon: Trophy,
      details: stats.activeSportNames.map(sportName => ({
        label: sportName,
        value: "✓ Active"
      }))
    },
    {
      title: "Total Players",
      value: isLoading ? "..." : `${stats.totalPlayers.active}/${stats.totalPlayers.total}`,
      icon: Users,
      details: stats.playersBySport.map(sport => ({
        label: sport.sport_name,
        value: `${sport.player_count.active}/${sport.player_count.total} players`
      }))
    },
    {
      title: "Total Leagues",
      value: isLoading ? "..." : `${stats.totalLeagues.active}/${stats.totalLeagues.total}`,
      icon: TrendingUp,
      details: stats.leaguesByActiveSport.map(sport => ({
        label: sport.sport_name,
        value: `${sport.active}/${sport.total} leagues`
      }))
    },
    {
      title: "Total Teams",
      value: isLoading ? "..." : `${stats.totalTeams.active}/${stats.totalTeams.total}`,
      icon: Shield,
      details: stats.teamsBySport.map(sport => ({
        label: sport.sport_name,
        value: `${sport.active}/${sport.total} teams`
      }))
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Welcome to your fantasy sports admin panel</p>
          </div>
          <button
            onClick={fetchDashboardStats}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          return (
            <Card key={stat.title}>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-2 space-y-1">
                  {stat.details.map((detail, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{detail.label}</span>
                      <span className={`font-medium ${
                        detail.value === "✓ Active" ? "text-green-600" : ""
                      }`}>
                        {detail.value}
                      </span>
                    </div>
                  ))}
                  {stat.details.length === 0 && !isLoading && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      {stat.title === "Active Sports" ? "No active sports" : 
                       stat.title === "Total Leagues" ? "No leagues in active sports" :
                       stat.title === "Total Players" ? "No players" : "No teams"}
                    </div>
                  )}
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
          onSetCurrent={() => setLockDialogOpen(true)} 
        />
      </div>

      <DashboardDialogs
        lockDialogOpen={lockDialogOpen}
        setLockDialogOpen={setLockDialogOpen}
      />
    </div>
  )
}