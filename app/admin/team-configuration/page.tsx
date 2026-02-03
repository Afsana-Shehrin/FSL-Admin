"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'
import FormationsTab from "./tabs/formations-tab"
import PlayerPositionsTab from "./tabs/player-positions-tab"
import BudgetRulesTab from "./tabs/budget-rules-tab"
import ValidationRulesTab from "./tabs/validation-rules-tab"
import FormationLayoutsTab from "./tabs/formation-layouts-tab"
import OptionalRulesTab from "./tabs/optional-rules-tab"

// Initialize Supabase client
const supabase = getSupabase()

interface Sport {
  sport_id: number
  sport_name: string
  sport_code: string
  icon_url: string | null
  is_active: boolean
}

interface League {
  league_id: number
  league_name: string
  league_code: string
  sport_id: number
  is_active: boolean
  league_status: string
}

export default function TeamConfigurationPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedSport, setSelectedSport] = useState<number | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      fetchLeagues(selectedSport)
    }
  }, [selectedSport])

  const fetchSports = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error

      setSports(data || [])
      if (data && data.length > 0) {
        setSelectedSport(data[0].sport_id)
      }
    } catch (error: any) {
      console.error('Error fetching sports:', error)
      toast.error('Failed to load sports')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeagues = async (sportId: number) => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('sport_id', sportId)
        .eq('is_active', true)
        .order('league_name')

      if (error) throw error

      setLeagues(data || [])
      if (data && data.length > 0) {
        setSelectedLeague(data[0].league_id)
      } else {
        setSelectedLeague(null)
      }
    } catch (error: any) {
      console.error('Error fetching leagues:', error)
      toast.error('Failed to load leagues')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure formations, rules, and layouts for each league
        </p>
      </div>

      {/* Sport & League Selectors */}
      <Card>
        <CardHeader>
          <CardTitle>Select Sport & League</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sport</label>
              <Select
                value={selectedSport?.toString()}
                onValueChange={(value) => setSelectedSport(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.sport_id} value={sport.sport_id.toString()}>
                      {sport.sport_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">League</label>
              <Select
                value={selectedLeague?.toString()}
                onValueChange={(value) => setSelectedLeague(parseInt(value))}
                disabled={!selectedSport || leagues.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a league" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((league) => (
                    <SelectItem key={league.league_id} value={league.league_id.toString()}>
                      <div className="flex items-center gap-2">
                        {league.league_name}
                        <Badge variant="secondary" className="text-xs">
                          {league.league_status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {leagues.length === 0 && selectedSport && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                No leagues found for this sport. Please create a league first.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      {selectedLeague && selectedSport && (
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="positions">Player Positions</TabsTrigger>
            <TabsTrigger value="formations">Formations</TabsTrigger>
            <TabsTrigger value="layouts">Formation Layouts</TabsTrigger>
            <TabsTrigger value="budget">Budget Rules</TabsTrigger>
            <TabsTrigger value="validation">Validation Rules</TabsTrigger>
            <TabsTrigger value="optional">Optional Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <PlayerPositionsTab 
              sportId={selectedSport} 
              leagueId={selectedLeague} 
            />
          </TabsContent>

          <TabsContent value="formations">
            <FormationsTab 
              sportId={selectedSport} 
              leagueId={selectedLeague} 
            />
          </TabsContent>

          <TabsContent value="layouts">
            <FormationLayoutsTab 
              sportId={selectedSport} 
              leagueId={selectedLeague} 
            />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetRulesTab 
              sportId={selectedSport} 
              leagueId={selectedLeague} 
            />
          </TabsContent>

          <TabsContent value="validation">
            <ValidationRulesTab 
              sportId={selectedSport} 
              leagueId={selectedLeague} 
            />
          </TabsContent>

          <TabsContent value="optional">
            <OptionalRulesTab 
              sportId={selectedSport} 
              leagueId={selectedLeague} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
