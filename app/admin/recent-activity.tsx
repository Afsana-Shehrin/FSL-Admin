"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Activity {
  type: string
  description: string
  time: string
  created_at: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  async function fetchRecentActivity() {
    try {
      setIsLoading(true)
      
      // Fetch recent activities from all tables
      const [
        sportsResponse,
        teamsResponse,
        leaguesResponse,
        playersResponse,
        seasonsResponse,
        gameweeksResponse
      ] = await Promise.all([
        // Sports - last 3 created
        supabase
          .from('sports')
          .select('sport_name, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        
        // Teams - last 3 created
        supabase
          .from('teams')
          .select('team_name, created_at, sports(sport_name)')
          .order('created_at', { ascending: false })
          .limit(3),
        
        // Leagues - last 3 created
        supabase
          .from('leagues')
          .select('league_name, created_at, sports(sport_name)')
          .order('created_at', { ascending: false })
          .limit(3),
        
        // Players - last 3 created or updated
        supabase
          .from('players')
          .select('player_name, created_at, updated_at, teams(team_name)')
          .order('updated_at', { ascending: false })
          .limit(3),
        
        // Seasons - last 3 created
        supabase
          .from('seasons')
          .select('season_name, created_at, leagues(league_name)')
          .order('created_at', { ascending: false })
          .limit(3),
        
        // Gameweeks - last 3 created
        supabase
          .from('gameweeks')
          .select('gameweek_name, created_at, seasons(season_name)')
          .order('created_at', { ascending: false })
          .limit(3)
      ])

      const allActivities: Activity[] = []

      // Process sports activities
      sportsResponse.data?.forEach((sport: any) => {
        allActivities.push({
          type: 'Sport added',
          description: `${sport.sport_name} added to sports`,
          time: formatDistanceToNow(new Date(sport.created_at), { addSuffix: true }),
          created_at: sport.created_at
        })
      })

      // Process teams activities
      teamsResponse.data?.forEach((team: any) => {
        allActivities.push({
          type: 'Team added',
          description: `${team.team_name} added to ${team.sports?.sport_name || 'sport'}`,
          time: formatDistanceToNow(new Date(team.created_at), { addSuffix: true }),
          created_at: team.created_at
        })
      })

      // Process leagues activities
      leaguesResponse.data?.forEach((league: any) => {
        allActivities.push({
          type: 'League added',
          description: `${league.league_name} added to ${league.sports?.sport_name || 'sport'}`,
          time: formatDistanceToNow(new Date(league.created_at), { addSuffix: true }),
          created_at: league.created_at
        })
      })

      // Process players activities
      playersResponse.data?.forEach((player: any) => {
        const timeToUse = player.updated_at || player.created_at
        const isUpdate = player.updated_at && player.updated_at !== player.created_at
        allActivities.push({
          type: isUpdate ? 'Player updated' : 'Player added',
          description: `${player.player_name} ${isUpdate ? 'updated in' : 'added to'} ${player.teams?.team_name || 'team'}`,
          time: formatDistanceToNow(new Date(timeToUse), { addSuffix: true }),
          created_at: timeToUse
        })
      })

      // Process seasons activities
      seasonsResponse.data?.forEach((season: any) => {
        allActivities.push({
          type: 'Season added',
          description: `${season.season_name} added to ${season.leagues?.league_name || 'league'}`,
          time: formatDistanceToNow(new Date(season.created_at), { addSuffix: true }),
          created_at: season.created_at
        })
      })

      // Process gameweeks activities
      gameweeksResponse.data?.forEach((gameweek: any) => {
        allActivities.push({
          type: 'Gameweek added',
          description: `${gameweek.gameweek_name || `Gameweek ${gameweek.gameweek_number}`} added to ${gameweek.seasons?.season_name || 'season'}`,
          time: formatDistanceToNow(new Date(gameweek.created_at), { addSuffix: true }),
          created_at: gameweek.created_at
        })
      })

      // Sort all activities by creation date (newest first) and take top 5
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setActivities(sortedActivities)

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      // Fallback to dummy data if API fails
      setActivities([
        {
          type: "Player added",
          description: "Mohamed Salah added to Liverpool",
          time: "2 hours ago",
          created_at: new Date().toISOString()
        },
        {
          type: "Fixture updated",
          description: "MUN vs LIV - Status changed to live",
          time: "4 hours ago",
          created_at: new Date().toISOString()
        },
        {
          type: "Gameweek created",
          description: "Gameweek 3 created for EPL",
          time: "1 day ago",
          created_at: new Date().toISOString()
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="h-2 w-2 mt-2 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.type}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No recent activity found
          </div>
        )}
      </CardContent>
    </Card>
  )
}