"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Trophy } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Types
type Fixture = {
  fixture_id: number
  gameweek_id: number
  season_id: number
  sport_id: number
  home_team_id: number
  away_team_id: number
  venue: string
  kickoff_time: string
  home_score: number | null
  away_score: number | null
  fixture_status: 'scheduled' | 'live' | 'completed' | 'postponed'
  is_finished: boolean
  match_stats: any
  created_at: string
  home_team_name?: string
  away_team_name?: string
  sport_code?: string
  gameweek_name?: string
  gameweek_number?: number
  season_name?: string
  year_start?: number
  year_end?: number
}

type Team = {
  team_id: number
  team_name: string
  sport_id: number
  short_name: string
  logo_url: string
  home_ground: string
  is_active: boolean
  created_at: string
}

type Sport = {
  sport_id: number
  sport_name: string
  sport_code: string
  icon_url: string
  is_active: boolean
  display_order: number
  created_at: string
}

type Gameweek = {
  gameweek_id: number
  gameweek_name: string
  gameweek_number: number
}

type Season = {
  season_id: number
  sport_id: number
  league_id: number
  season_name: string
  year_start: number
  year_end: number
  start_date: string
  end_date: string
  status: 'upcoming' | 'active' | 'completed'
  season_config: any
  is_active: boolean
  created_at: string
  champion_team_id: number | null
  top_player_id: number | null
  season_logo_url: string | null
  notes: string | null
  league_name?: string
}

type League = {
  league_id: number
  league_name: string
  sport_id: number
  country: string
  level: number
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export default function FixturesTab() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [isFixtureDialogOpen, setIsFixtureDialogOpen] = useState(false)
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null)
  const [loading, setLoading] = useState(true)
  const [filteredSeasons, setFilteredSeasons] = useState<Season[]>([])

  const [fixtureFormData, setFixtureFormData] = useState({
    gameweek_id: "",
    season_id: "",
    sport_id: "",
    home_team_id: "",
    away_team_id: "",
    kickoff_time: "",
    venue: "",
    fixture_status: "scheduled" as Fixture["fixture_status"],
    home_score: undefined as number | undefined,
    away_score: undefined as number | undefined,
  })

  // Use useMemo to calculate filtered fixtures
  const filteredFixtures = useMemo(() => {
    return fixtures.filter((fixture) => {
      const matchesSearch =
        (fixture.home_team_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fixture.away_team_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fixture.venue || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fixture.season_name || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSport = selectedSport === "all" || 
        fixture.sport_code?.toLowerCase() === selectedSport.toLowerCase()

      return matchesSearch && matchesSport
    })
  }, [fixtures, searchQuery, selectedSport])

  // Calculate fixture counts using useMemo
  const { totalFixtures, sportCounts } = useMemo(() => {
    const totalFixtures = filteredFixtures.length
    const sportCounts: Record<string, number> = {}
    
    // Initialize all sports with 0
    sports.forEach(sport => {
      sportCounts[sport.sport_code] = 0
    })
    
    // Count fixtures for each sport from all fixtures (not just filtered)
    fixtures.forEach(fixture => {
      if (fixture.sport_code) {
        sportCounts[fixture.sport_code] = (sportCounts[fixture.sport_code] || 0) + 1
      }
    })
    
    return { totalFixtures, sportCounts }
  }, [filteredFixtures, fixtures, sports])

  // Fetch data from Supabase
  useEffect(() => {
    fetchData()
  }, [])

  // Filter seasons when sport changes
  useEffect(() => {
    if (fixtureFormData.sport_id && seasons.length > 0) {
      const filtered = seasons.filter(season => 
        season.sport_id.toString() === fixtureFormData.sport_id
      )
      setFilteredSeasons(filtered)
      
      // Auto-select first season if current season is not in filtered list
      if (fixtureFormData.season_id) {
        const currentSeasonExists = filtered.some(s => s.season_id.toString() === fixtureFormData.season_id)
        if (!currentSeasonExists && filtered.length > 0) {
          setFixtureFormData(prev => ({
            ...prev,
            season_id: filtered[0].season_id.toString()
          }))
        }
      } else if (filtered.length > 0) {
        // Set first season if none selected
        setFixtureFormData(prev => ({
          ...prev,
          season_id: filtered[0].season_id.toString()
        }))
      }
    } else {
      setFilteredSeasons([])
    }
  }, [fixtureFormData.sport_id, seasons])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch fixtures with related data
      const { data: fixturesData, error: fixturesError } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:home_team_id (team_name),
          away_team:away_team_id (team_name),
          sport:sport_id (sport_code),
          gameweek:gameweek_id (gameweek_name, gameweek_number),
          season:season_id (season_name, year_start, year_end)
        `)
      
      if (fixturesError) throw fixturesError
      
      // Transform the data to include nested fields
      const transformedFixtures: Fixture[] = (fixturesData || []).map((fixture: any) => ({
        ...fixture,
        home_team_name: fixture.home_team?.team_name,
        away_team_name: fixture.away_team?.team_name,
        sport_code: fixture.sport?.sport_code,
        gameweek_name: fixture.gameweek?.gameweek_name,
        gameweek_number: fixture.gameweek?.gameweek_number,
        season_name: fixture.season?.season_name,
        year_start: fixture.season?.year_start,
        year_end: fixture.season?.year_end
      }))
      
      // Calculate status based on kickoff time
      const fixturesWithStatus = transformedFixtures.map(fixture => {
        const kickoff = new Date(fixture.kickoff_time)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const kickoffDate = new Date(kickoff.getFullYear(), kickoff.getMonth(), kickoff.getDate())
        
        let status: Fixture["fixture_status"] = fixture.fixture_status
        
        // Auto-update status based on time if not postponed
        if (status !== 'postponed') {
          if (kickoff < now) {
            status = 'completed'
          } else if (kickoffDate.getTime() === today.getTime()) {
            status = 'live'
          } else {
            status = 'scheduled'
          }
        }
        
        // Update in database if status changed
        if (status !== fixture.fixture_status) {
  supabase
    .from('fixtures')
    .update({ fixture_status: status })
    .eq('fixture_id', fixture.fixture_id)
    .then((result: { error: any }) => {
      const { error } = result
      if (error) console.error('Error updating fixture status:', error)
    })
}
        
        return { ...fixture, fixture_status: status }
      })
      
      setFixtures(fixturesWithStatus)

      // Fetch other data including seasons and leagues
      const [
        gameweeksData, 
        teamsData, 
        sportsData, 
        seasonsData,
        leaguesData
      ] = await Promise.all([
        supabase.from('gameweeks').select('gameweek_id, gameweek_name, gameweek_number').order('gameweek_number'),
        supabase.from('teams').select('*').order('team_name'),
        supabase.from('sports').select('*').order('display_order'),
        supabase.from('seasons')
          .select(`
            *,
            league:league_id (league_name)
          `)
          .order('year_start', { ascending: false }),
        supabase.from('leagues').select('*').order('league_name')
      ])

      if (gameweeksData.error) throw gameweeksData.error
      if (teamsData.error) throw teamsData.error
      if (sportsData.error) throw sportsData.error
      if (seasonsData.error) throw seasonsData.error
      if (leaguesData.error) throw leaguesData.error

      // Add league_name to seasons
      const seasonsWithLeagueName = (seasonsData.data || []).map((season: any) => ({
        ...season,
        league_name: season.league?.league_name
      }))

      setGameweeks(gameweeksData.data || [])
      setTeams(teamsData.data || [])
      setSports(sportsData.data || [])
      setSeasons(seasonsWithLeagueName || [])
      setLeagues(leaguesData.data || [])

      // Set default sport and season (active season or first one)
      const activeSport = sportsData.data?.[0]
      if (activeSport) {
        const activeSeason = seasonsWithLeagueName?.find((s: { is_active: any; sport_id: any }) => s.is_active && s.sport_id === activeSport.sport_id) 
          || seasonsWithLeagueName?.find((s: { sport_id: any }) => s.sport_id === activeSport.sport_id)
          || seasonsWithLeagueName?.[0]
        
        if (activeSeason) {
          setFixtureFormData(prev => ({
            ...prev,
            sport_id: activeSport.sport_id.toString(),
            season_id: activeSeason.season_id.toString()
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditFixture = (fixture: Fixture) => {
    setEditingFixture(fixture)
    
    const kickoffDate = new Date(fixture.kickoff_time);
    const localDateTime = new Date(kickoffDate.getTime() - kickoffDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setFixtureFormData({
      gameweek_id: fixture.gameweek_id.toString(),
      season_id: fixture.season_id.toString(),
      sport_id: fixture.sport_id.toString(),
      home_team_id: fixture.home_team_id.toString(),
      away_team_id: fixture.away_team_id.toString(),
      kickoff_time: localDateTime,
      venue: fixture.venue || "",
      fixture_status: fixture.fixture_status,
      home_score: fixture.home_score || undefined,
      away_score: fixture.away_score || undefined,
    })
    setIsFixtureDialogOpen(true)
  }

  const handleCreateFixture = () => {
    setEditingFixture(null)
    
    // Get default active sport and season
    const activeSport = sports[0]
    const activeSeason = activeSport 
      ? seasons.find(s => s.is_active && s.sport_id === activeSport.sport_id) 
      || seasons.find(s => s.sport_id === activeSport.sport_id)
      || seasons[0]
      : seasons[0]
    
    setFixtureFormData({
      gameweek_id: "",
      season_id: activeSeason ? activeSeason.season_id.toString() : "",
      sport_id: activeSport ? activeSport.sport_id.toString() : "",
      home_team_id: "",
      away_team_id: "",
      kickoff_time: "",
      venue: "",
      fixture_status: "scheduled",
      home_score: undefined,
      away_score: undefined,
    })
    setIsFixtureDialogOpen(true)
  }

  const handleSaveFixture = async () => {
    try {
      // Validate required fields
      if (!fixtureFormData.gameweek_id || !fixtureFormData.season_id || !fixtureFormData.sport_id || 
          !fixtureFormData.home_team_id || !fixtureFormData.away_team_id ||
          !fixtureFormData.kickoff_time) {
        alert('Please fill all required fields (*)')
        return
      }

      // Validate date
      const kickoffTime = fixtureFormData.kickoff_time;
      if (!kickoffTime || !kickoffTime.includes('T')) {
        alert('Please enter a valid date and time')
        return
      }

      const kickoffDate = new Date(kickoffTime)
      if (isNaN(kickoffDate.getTime())) {
        alert('Please enter a valid date and time')
        return
      }

      // Validate teams are not the same
      if (fixtureFormData.home_team_id === fixtureFormData.away_team_id) {
        alert('Home and away teams cannot be the same')
        return
      }

      // Properly handle null/empty scores
      const homeScore = fixtureFormData.home_score === undefined || fixtureFormData.home_score === null 
        ? null 
        : Number(fixtureFormData.home_score)
      
      const awayScore = fixtureFormData.away_score === undefined || fixtureFormData.away_score === null 
        ? null 
        : Number(fixtureFormData.away_score)

      const fixtureData = {
        gameweek_id: parseInt(fixtureFormData.gameweek_id),
        season_id: parseInt(fixtureFormData.season_id),
        sport_id: parseInt(fixtureFormData.sport_id),
        home_team_id: parseInt(fixtureFormData.home_team_id),
        away_team_id: parseInt(fixtureFormData.away_team_id),
        kickoff_time: kickoffDate.toISOString(),
        venue: fixtureFormData.venue,
        fixture_status: fixtureFormData.fixture_status,
        home_score: homeScore,
        away_score: awayScore,
        is_finished: fixtureFormData.fixture_status === 'completed'
      }

      console.log('Saving fixture data:', fixtureData);

      if (editingFixture) {
        const { error } = await supabase
          .from('fixtures')
          .update(fixtureData)
          .eq('fixture_id', editingFixture.fixture_id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('fixtures')
          .insert([fixtureData])
        
        if (error) throw error
      }

      setIsFixtureDialogOpen(false)
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error saving fixture:', error)
      alert('Error saving fixture. Please try again.')
    }
  }

  const getWinningTeam = (fixture: Fixture) => {
    if (fixture.fixture_status !== 'completed' || fixture.home_score === null || fixture.away_score === null) {
      return "-"
    }
    
    if (fixture.home_score > fixture.away_score) {
      return fixture.home_team_name
    } else if (fixture.home_score < fixture.away_score) {
      return fixture.away_team_name
    } else {
      return "Draw"
    }
  }

  const getStatusBadge = (status: Fixture["fixture_status"]) => {
    const variants = {
      scheduled: "secondary",
      live: "default",
      completed: "outline",
      postponed: "destructive",
    } as const
    return variants[status] || "secondary"
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format season display name
  const formatSeasonName = (season: Season) => {
    return `${season.season_name} (${season.year_start}-${season.year_end})${season.league_name ? ` - ${season.league_name}` : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading fixtures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fixtures..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isFixtureDialogOpen} onOpenChange={setIsFixtureDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateFixture} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Fixture
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFixture ? "Edit Fixture" : "Add New Fixture"}</DialogTitle>
              <DialogDescription>
                {editingFixture ? "Update the fixture details below." : "Add a new fixture to a gameweek."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fixture-sport">Sport *</Label>
                <Select
                  value={fixtureFormData.sport_id}
                  onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, sport_id: value })}
                  required
                >
                  <SelectTrigger id="fixture-sport">
                    <SelectValue placeholder="Select sport" />
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

              <div className="space-y-2">
                <Label htmlFor="fixture-season">Season *</Label>
                <Select
                  value={fixtureFormData.season_id}
                  onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, season_id: value })}
                  required
                  disabled={!fixtureFormData.sport_id}
                >
                  <SelectTrigger id="fixture-season">
                    <SelectValue 
                      placeholder={fixtureFormData.sport_id ? "Select season" : "Select sport first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSeasons.map((season) => (
                      <SelectItem key={season.season_id} value={season.season_id.toString()}>
                        {formatSeasonName(season)}
                      </SelectItem>
                    ))}
                    {filteredSeasons.length === 0 && fixtureFormData.sport_id && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No seasons found for this sport
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixture-gameweek">Gameweek *</Label>
                <Select
                  value={fixtureFormData.gameweek_id}
                  onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, gameweek_id: value })}
                  required
                >
                  <SelectTrigger id="fixture-gameweek">
                    <SelectValue placeholder="Select gameweek" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameweeks.map((gameweek) => (
                      <SelectItem key={gameweek.gameweek_id} value={gameweek.gameweek_id.toString()}>
                        GW{gameweek.gameweek_number}: {gameweek.gameweek_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="home-team">Home Team *</Label>
                <Select
                  value={fixtureFormData.home_team_id}
                  onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, home_team_id: value })}
                  required
                >
                  <SelectTrigger id="home-team">
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => 
                        !fixtureFormData.sport_id || 
                        team.sport_id.toString() === fixtureFormData.sport_id
                      )
                      .map((team) => (
                        <SelectItem key={team.team_id} value={team.team_id.toString()}>
                          {team.team_name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="away-team">Away Team *</Label>
                <Select
                  value={fixtureFormData.away_team_id}
                  onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, away_team_id: value })}
                  required
                >
                  <SelectTrigger id="away-team">
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => 
                        !fixtureFormData.sport_id || 
                        team.sport_id.toString() === fixtureFormData.sport_id
                      )
                      .map((team) => (
                        <SelectItem key={team.team_id} value={team.team_id.toString()}>
                          {team.team_name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kickoff-time">Kickoff Time *</Label>
                <Input
                  id="kickoff-time"
                  type="datetime-local"
                  value={fixtureFormData.kickoff_time}
                  onChange={(e) => setFixtureFormData({ ...fixtureFormData, kickoff_time: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixture-status">Status</Label>
                <Select
                  value={fixtureFormData.fixture_status}
                  onValueChange={(value: Fixture["fixture_status"]) =>
                    setFixtureFormData({ ...fixtureFormData, fixture_status: value })
                  }
                >
                  <SelectTrigger id="fixture-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label htmlFor="home-score">Home Score</Label>
                <Input
                  id="home-score"
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={fixtureFormData.home_score ?? ""}
                  onChange={(e) =>
                    setFixtureFormData({
                      ...fixtureFormData,
                      home_score: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="away-score">Away Score</Label>
                <Input
                  id="away-score"
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={fixtureFormData.away_score ?? ""}
                  onChange={(e) =>
                    setFixtureFormData({
                      ...fixtureFormData,
                      away_score: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsFixtureDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSaveFixture} className="w-full sm:w-auto">
                {editingFixture ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Fixtures</CardTitle>
          <div className="flex gap-2 mt-4 border-b overflow-x-auto">
            <button
              onClick={() => setSelectedSport("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                selectedSport === "all"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Sports ({totalFixtures})
            </button>
            {sports.map((sport) => (
              <button
                key={sport.sport_id}
                onClick={() => setSelectedSport(sport.sport_code)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  selectedSport === sport.sport_code
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sport.sport_name} ({sportCounts[sport.sport_code] || 0})
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredFixtures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fixtures found {searchQuery ? `for "${searchQuery}"` : ""}
              {selectedSport !== "all" && ` in ${sports.find(s => s.sport_code === selectedSport)?.sport_name || selectedSport}`}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead>
                  <TableHead>GW</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Kickoff</TableHead>
                  <TableHead>Home Team</TableHead>
                  <TableHead>Away Team</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Winning Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFixtures.map((fixture) => (
                  <TableRow key={fixture.fixture_id}>
                    <TableCell>
                      <div className="font-medium">
                        {fixture.season_name || `Season ${fixture.season_id}`}
                      </div>
                      {fixture.year_start && fixture.year_end && (
                        <div className="text-xs text-muted-foreground">
                          {fixture.year_start}-{fixture.year_end}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">GW{fixture.gameweek_number}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {fixture.sport_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {fixture.home_team_name} vs {fixture.away_team_name}
                    </TableCell>
                    <TableCell>{formatDateTime(fixture.kickoff_time)}</TableCell>
                    <TableCell>{fixture.home_team_name}</TableCell>
                    <TableCell>{fixture.away_team_name}</TableCell>
                    <TableCell>
                      {fixture.home_score !== null && fixture.away_score !== null
                        ? `${fixture.home_score} - ${fixture.away_score}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {getWinningTeam(fixture) !== "-" && (
                        <div className="flex items-center gap-1">
                          <span>{getWinningTeam(fixture)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(fixture.fixture_status)}>
                        {fixture.fixture_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditFixture(fixture)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this fixture?')) {
                              const { error } = await supabase
                                .from('fixtures')
                                .delete()
                                .eq('fixture_id', fixture.fixture_id)
                              
                              if (error) {
                                console.error('Error deleting fixture:', error)
                                alert('Error deleting fixture')
                              } else {
                                fetchData()
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}