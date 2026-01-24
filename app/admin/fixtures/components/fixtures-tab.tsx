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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Types
type Fixture = {
  fixture_id: number
  gameweek_id: number | null
  season_id: number
  sport_id: number
  home_team_id: number
  away_team_id: number
  kickoff_time: string
  home_score: number | null
  away_score: number | null
  fixture_status: 'scheduled' | 'live' | 'completed' | 'postponed'
  is_finished: boolean
  match_stats: any
  venue: string | null  // Add this
  created_at: string
  home_team_name?: string
  away_team_name?: string
  sport_code?: string
  sport_name?: string
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
  season_id:number
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

// Gameweek type options
type GameweekType = 'Matchday' | 'Matchweek' | 'Gameday' | 'Gameweek';
const GAMEWEEK_TYPES: GameweekType[] = ['Matchday', 'Matchweek', 'Gameday', 'Gameweek'];
const GAMEWEEK_SHORT_FORMS: Record<GameweekType, string> = {
  'Matchday': 'MD',
  'Matchweek': 'MW',
  'Gameday': 'GD',
  'Gameweek': 'GW'
};

export default function FixturesTab() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLeague, setSelectedLeague] = useState<string>("all")
  const [isFixtureDialogOpen, setIsFixtureDialogOpen] = useState(false)
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null)
  const [loading, setLoading] = useState(true)
  const [filteredSeasons, setFilteredSeasons] = useState<Season[]>([])
  const [activeSportTab, setActiveSportTab] = useState<string>("") // Start with no tab selected

  const [fixtureFormData, setFixtureFormData] = useState({
    gameweek_id: "",
    season_id: "",
    sport_id: "",
    home_team_id: "",
    away_team_id: "",
    kickoff_time: "",
    fixture_status: "scheduled" as Fixture["fixture_status"],
    home_score: undefined as number | undefined,
    away_score: undefined as number | undefined,
    is_finished: false,
    gameweek_type: "Gameweek" as GameweekType,
    gameweek_number: undefined as number | undefined,
    venue: "",
  })

  // Set default active sport tab when sports are loaded
  useEffect(() => {
    if (sports.length > 0 && !activeSportTab) {
      setActiveSportTab(sports[0]?.sport_code || "");
    }
  }, [sports, activeSportTab]);

  // Get gameweek naming convention for a sport
  const getGameweekNaming = (sportName: string): { label: string; shortForm: string } => {
    const name = sportName.toLowerCase();
    
    if (name.includes("cricket")) {
      return { label: "Matchday", shortForm: "MD" };
    } else if (name.includes("basketball")) {
      return { label: "Gameweek", shortForm: "GW" };
    } else if (name.includes("football") || name.includes("soccer")) {
      return { label: "Gameweek", shortForm: "GW" };
    } else if (name.includes("rugby")) {
      return { label: "Matchweek", shortForm: "MW" };
    } else if (name.includes("hockey") || name.includes("field hockey")) {
      return { label: "Matchday", shortForm: "MD" };
    } else if (name.includes("baseball")) {
      return { label: "Gameday", shortForm: "GD" };
    } else if (name.includes("tennis") || name.includes("badminton")) {
      return { label: "Matchday", shortForm: "MD" };
    } else {
      // Default for other sports
      return { label: "Gameweek", shortForm: "GW" };
    }
  }

  // Get current gameweek naming based on selected sport
  const getCurrentGameweekNaming = () => {
    if (!fixtureFormData.sport_id) {
      return { label: "Gameweek", shortForm: "GW" };
    }
    
    const sport = sports.find(s => s.sport_id.toString() === fixtureFormData.sport_id);
    if (!sport) {
      return { label: "Gameweek", shortForm: "GW" };
    }
    
    return getGameweekNaming(sport.sport_name);
  }

  // Use useMemo to calculate filtered fixtures based on active sport tab
  const filteredFixtures = useMemo(() => {
  if (!activeSportTab) return [];
  
  let filtered = fixtures.filter((fixture: Fixture) => 
    fixture.sport_code?.toLowerCase() === activeSportTab.toLowerCase()
  );
  
  // Then filter by search query
  const searchFiltered = filtered.filter((fixture: Fixture) => {
    const matchesSearch =
      (fixture.home_team_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fixture.away_team_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fixture.season_name || "").toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  });
  
  // Sort by kickoff_time in descending order (newest first)
  return searchFiltered.sort((a: Fixture, b: Fixture) => {
    const dateA = new Date(a.kickoff_time).getTime();
    const dateB = new Date(b.kickoff_time).getTime();
    return dateB - dateA; // For descending order (newest first)
  });
}, [fixtures, searchQuery, activeSportTab])

  // Calculate fixture counts using useMemo
  const sportCounts = useMemo(() => {
    const sportCounts: Record<string, number> = {}
    
    // Count fixtures for each sport from all fixtures
    fixtures.forEach(fixture => {
      if (fixture.sport_code) {
        sportCounts[fixture.sport_code] = (sportCounts[fixture.sport_code] || 0) + 1
      }
    })
    
    return sportCounts
  }, [fixtures])

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

  // Auto-set gameweek type based on sport when sport changes
  useEffect(() => {
    if (fixtureFormData.sport_id) {
      const sport = sports.find(s => s.sport_id.toString() === fixtureFormData.sport_id);
      if (sport) {
        const naming = getGameweekNaming(sport.sport_name);
        setFixtureFormData(prev => ({
          ...prev,
          gameweek_type: naming.label as GameweekType
        }));
      }
    }
  }, [fixtureFormData.sport_id, sports]);

  // Update form when fixture status changes
  useEffect(() => {
    if (fixtureFormData.fixture_status === 'completed') {
      setFixtureFormData(prev => ({
        ...prev,
        is_finished: true
      }));
    } else if (fixtureFormData.fixture_status === 'scheduled' && fixtureFormData.is_finished) {
      setFixtureFormData(prev => ({
        ...prev,
        fixture_status: 'completed'
      }));
    }
  }, [fixtureFormData.fixture_status]);

  // Update status when is_finished changes
  useEffect(() => {
    if (fixtureFormData.is_finished && fixtureFormData.fixture_status !== 'completed') {
      setFixtureFormData(prev => ({
        ...prev,
        fixture_status: 'completed'
      }));
    } else if (!fixtureFormData.is_finished && fixtureFormData.fixture_status === 'completed') {
      setFixtureFormData(prev => ({
        ...prev,
        fixture_status: 'scheduled'
      }));
    }
  }, [fixtureFormData.is_finished]);

  // Fallback function for manual ID insertion
  const insertWithManualId = async (data: any) => {
    try {
      // Get max ID from database
      const { data: maxIdData, error: maxIdError } = await supabase
        .from('fixtures')
        .select('fixture_id')
        .order('fixture_id', { ascending: false })
        .limit(1);
      
      if (maxIdError) throw maxIdError;
      
      // Calculate next ID
      let nextId = 1;
      if (maxIdData && maxIdData.length > 0 && maxIdData[0].fixture_id) {
        nextId = maxIdData[0].fixture_id + 1;
      }
      
      // Add manual ID to data
      const fixtureDataWithId = {
        ...data,
        fixture_id: nextId
      };
      
      console.log('Inserting with manual ID:', nextId);
      
      const { error } = await supabase
        .from('fixtures')
        .insert([fixtureDataWithId]);
      
      if (error) throw error;
      
    } catch (innerError) {
      console.error('Manual ID insertion failed:', innerError);
      throw innerError;
    }
  }

  
// Update fetchData to include season_id when fetching gameweeks
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
        sport:sport_id (sport_code, sport_name),
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
      sport_name: fixture.sport?.sport_name,
      gameweek_name: fixture.gameweek?.gameweek_name,
      gameweek_number: fixture.gameweek?.gameweek_number,
      season_name: fixture.season?.season_name,
      year_start: fixture.season?.year_start,
      year_end: fixture.season?.year_end
    }))
    
    setFixtures(transformedFixtures)

    // Fetch other data including seasons and leagues
    const [
      gameweeksData, 
      teamsData, 
      sportsData, 
      seasonsData,
      leaguesData
    ] = await Promise.all([
      supabase.from('gameweeks').select('gameweek_id, gameweek_name, gameweek_number, season_id').order('gameweek_number'), // Include season_id
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
        const naming = getGameweekNaming(activeSport.sport_name);
        setFixtureFormData(prev => ({
          ...prev,
          sport_id: activeSport.sport_id.toString(),
          season_id: activeSeason.season_id.toString(),
          gameweek_type: naming.label as GameweekType
        }))
      }
      
      // Set first sport as active tab
      setActiveSportTab(activeSport.sport_code)
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    setLoading(false)
  }
}

const getGameweeksForSeason = (seasonId: string) => {
  return gameweeks.filter(gw => gw.season_id.toString() === seasonId);
}


  
// Update the handleSaveFixture function to use existing gameweeks
const handleSaveFixture = async () => {
  try {
    // Validate required fields
    if (!fixtureFormData.season_id || !fixtureFormData.sport_id || 
        !fixtureFormData.home_team_id || !fixtureFormData.away_team_id ||
        !fixtureFormData.kickoff_time || !fixtureFormData.gameweek_id) {
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

    // Auto-determine if finished based on status or scores
    const isFinished = fixtureFormData.fixture_status === 'completed' || 
      (homeScore !== null && awayScore !== null && fixtureFormData.is_finished)

    // Auto-update status if finished but status is scheduled
    const finalStatus = isFinished ? 'completed' : fixtureFormData.fixture_status

    // Prepare fixture data - use selected gameweek_id
    const fixtureData: any = {
      season_id: parseInt(fixtureFormData.season_id),
      sport_id: parseInt(fixtureFormData.sport_id),
      home_team_id: parseInt(fixtureFormData.home_team_id),
      away_team_id: parseInt(fixtureFormData.away_team_id),
      kickoff_time: kickoffDate.toISOString(),
      fixture_status: finalStatus,
      home_score: homeScore,
      away_score: awayScore,
      is_finished: isFinished,
      gameweek_id: parseInt(fixtureFormData.gameweek_id),
      venue: fixtureFormData.venue || null,
    }

    console.log('Saving fixture data:', fixtureData);

    if (editingFixture) {
      const { error } = await supabase
        .from('fixtures')
        .update(fixtureData)
        .eq('fixture_id', editingFixture.fixture_id)
      
      if (error) throw error
    } else {
      // For new fixtures, let database handle auto-increment
      const { error } = await supabase
        .from('fixtures')
        .insert([fixtureData])
      
      if (error) {
        // If duplicate key error, try to fix sequence
        if (error.code === '23505') {
          console.log('Duplicate key error, trying to fix sequence...');
          // Try to insert with manual ID calculation as fallback
          await insertWithManualId(fixtureData);
        } else {
          throw error;
        }
      }
    }

    setIsFixtureDialogOpen(false)
    fetchData() // Refresh data
  } catch (error) {
    console.error('Error saving fixture:', error)
    alert('Error saving fixture. Please try again.')
  }
}

const handleEditFixture = (fixture: Fixture) => {
  setEditingFixture(fixture)
  
  const kickoffDate = new Date(fixture.kickoff_time)
  const localDateTime = new Date(kickoffDate.getTime() - kickoffDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  // Determine if match should be marked as finished
  const isFinished = fixture.is_finished || 
    (fixture.home_score !== null && fixture.away_score !== null && fixture.fixture_status === 'completed')

  setFixtureFormData({
    gameweek_id: fixture.gameweek_id ? fixture.gameweek_id.toString() : "",
    season_id: fixture.season_id.toString(),
    sport_id: fixture.sport_id.toString(),
    home_team_id: fixture.home_team_id.toString(),
    away_team_id: fixture.away_team_id.toString(),
    kickoff_time: localDateTime,
    fixture_status: fixture.fixture_status,
    home_score: fixture.home_score || undefined,
    away_score: fixture.away_score || undefined,
    is_finished: isFinished,
    gameweek_type: "Gameweek", 
    gameweek_number: undefined,
    venue: fixture.venue || "",
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
  
  const naming = activeSport ? getGameweekNaming(activeSport.sport_name) : { label: 'Gameweek', shortForm: 'GW' };
  
  setFixtureFormData({
    gameweek_id: "",
    season_id: activeSeason ? activeSeason.season_id.toString() : "",
    sport_id: activeSport ? activeSport.sport_id.toString() : "",
    home_team_id: "",
    away_team_id: "",
    kickoff_time: "",
    fixture_status: "scheduled",
    home_score: undefined,
    away_score: undefined,
    is_finished: false,
    gameweek_type: naming.label as GameweekType,
    gameweek_number: undefined,
    venue: "" 
  })
  setIsFixtureDialogOpen(true)
}
   

  const handleCancelDialog = () => {
    setIsFixtureDialogOpen(false);
    setEditingFixture(null);
    
    // Reset form to default values
    const activeSport = sports[0];
    const activeSeason = activeSport 
      ? seasons.find(s => s.is_active && s.sport_id === activeSport.sport_id) 
      || seasons.find(s => s.sport_id === activeSport.sport_id)
      || seasons[0]
      : seasons[0];
    
    const naming = activeSport ? getGameweekNaming(activeSport.sport_name) : { label: 'Gameweek', shortForm: 'GW' };
    
    setFixtureFormData({
      gameweek_id: "",
      season_id: activeSeason ? activeSeason.season_id.toString() : "",
      sport_id: activeSport ? activeSport.sport_id.toString() : "",
      home_team_id: "",
      away_team_id: "",
      kickoff_time: "",
      fixture_status: "scheduled",
      home_score: undefined,
      away_score: undefined,
      is_finished: false,
      gameweek_type: naming.label as GameweekType,
      gameweek_number: undefined,
      venue: "" 
    });
  }

  // Calculate winning team from form data
  const calculateWinningTeam = () => {
    const homeScore = fixtureFormData.home_score;
    const awayScore = fixtureFormData.away_score;
    
    if (homeScore === undefined || awayScore === undefined || 
        homeScore === null || awayScore === null) {
      return null;
    }
    
    if (homeScore > awayScore) {
      return fixtureFormData.home_team_id;
    } else if (awayScore > homeScore) {
      return fixtureFormData.away_team_id;
    } else {
      return 'draw';
    }
  }

  const getWinningTeam = (fixture: Fixture) => {
    // If match is not finished or no scores, return "-"
    if (!fixture.is_finished || fixture.home_score === null || fixture.away_score === null) {
      return "-"
    }
    
    // Calculate winner based on scores
    if (fixture.home_score > fixture.away_score) {
      return fixture.home_team_name || "Home Team"
    } else if (fixture.home_score < fixture.away_score) {
      return fixture.away_team_name || "Away Team"
    } else {
      return "Draw"
    }
  }

  // Get gameweek display for a fixture
  const getGameweekDisplay = (fixture: Fixture): { type: string; number: number | undefined } => {
    if (!fixture.gameweek_name) return { type: "GW", number: fixture.gameweek_number };
    
    const name = fixture.gameweek_name.toLowerCase();
    let type = "GW";
    
    if (name.includes('matchday')) type = "MD";
    else if (name.includes('matchweek')) type = "MW";
    else if (name.includes('gameday')) type = "GD";
    else if (name.includes('gameweek')) type = "GW";
    
    return { type, number: fixture.gameweek_number };
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

  // Get team name by ID
  const getTeamNameById = (teamId: string) => {
    const team = teams.find(t => t.team_id.toString() === teamId);
    return team ? team.team_name : 'Unknown Team';
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
        <div className="w-full sm:w-48">
        <Select 
          value={selectedLeague} 
          onValueChange={(value) => {
            setSelectedLeague(value)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Leagues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leagues</SelectItem>
            {leagues
              .filter(league => league.is_active)
              .map((league) => (
                <SelectItem 
                  key={league.league_id} 
                  value={league.league_id.toString()}
                >
                  {league.league_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {season.season_name} {/* Show only season_name */}
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
            </div>

              {/* Teams in the same row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kickoff-time">Kickoff Time *</Label>
                <Input
                  id="kickoff-time"
                  type="datetime-local"
                  value={fixtureFormData.kickoff_time}
                  onChange={(e) => setFixtureFormData({ ...fixtureFormData, kickoff_time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                placeholder="Enter match venue (e.g., Wembley Stadium, Lord's Cricket Ground)"
                value={fixtureFormData.venue || ""}
                onChange={(e) => setFixtureFormData({ ...fixtureFormData, venue: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter the stadium or ground where the match will be played
              </p>
            </div>
            </div>

              {/* Gameweek type and number in the same row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="fixture-gameweek">Round *</Label>
                <Select
                  value={fixtureFormData.gameweek_id}
                  onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, gameweek_id: value })}
                  required
                  disabled={!fixtureFormData.season_id}
                >
                  <SelectTrigger id="fixture-gameweek">
                    <SelectValue 
                      placeholder={fixtureFormData.season_id ? "Select round" : "Select season first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getGameweeksForSeason(fixtureFormData.season_id).map((gameweek) => (
                      <SelectItem key={gameweek.gameweek_id} value={gameweek.gameweek_id.toString()}>
                        {gameweek.gameweek_name}
                      </SelectItem>
                    ))}
                    {getGameweeksForSeason(fixtureFormData.season_id).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No rounds found for this season. Please create rounds first in the Gameweeks tab.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a round from the gameweeks created for this season
                </p>
              </div>
              

              {/* Status field */}
              <div className="space-y-2">
                <Label htmlFor="fixture-status">Status *</Label>
                <Select
                  value={fixtureFormData.fixture_status}
                  onValueChange={(value: Fixture["fixture_status"]) =>
                    setFixtureFormData({ ...fixtureFormData, fixture_status: value })
                  }
                  required
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
              </div>

              {/* Results Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-1">Match Results</h3>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <Label htmlFor="home-score" className="mb-2">Home Score</Label>
                    <Input
                      id="home-score"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={fixtureFormData.home_score ?? ""}
                      onChange={(e) =>
                        setFixtureFormData({
                          ...fixtureFormData,
                          home_score: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      className="text-center"
                    />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">VS</div>
                    <div className="text-sm text-muted-foreground">Final Score</div>
                  </div>
                  
                  <div className="text-center">
                    <Label htmlFor="away-score" className="mb-2">Away Score</Label>
                    <Input
                      id="away-score"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={fixtureFormData.away_score ?? ""}
                      onChange={(e) =>
                        setFixtureFormData({
                          ...fixtureFormData,
                          away_score: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      className="text-center"
                    />
                  </div>
                </div>
                
                {/* Winning Team Display */}
                {fixtureFormData.home_score !== undefined && 
                 fixtureFormData.away_score !== undefined &&
                 fixtureFormData.home_score !== null && 
                 fixtureFormData.away_score !== null && 
                 fixtureFormData.home_team_id && 
                 fixtureFormData.away_team_id && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Result</div>
                        <div className="text-lg font-bold">
                          {fixtureFormData.home_score} - {fixtureFormData.away_score}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Winning Team</div>
                        <div className="text-lg font-bold">
                          {calculateWinningTeam() === 'draw' ? (
                            <span className="text-yellow-600">Draw</span>
                          ) : calculateWinningTeam() === fixtureFormData.home_team_id ? (
                            <span className="text-green-600">{getTeamNameById(fixtureFormData.home_team_id)}</span>
                          ) : calculateWinningTeam() === fixtureFormData.away_team_id ? (
                            <span className="text-green-600">{getTeamNameById(fixtureFormData.away_team_id)}</span>
                          ) : (
                            <span className="text-muted-foreground">No result yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-finished"
                    checked={fixtureFormData.is_finished}
                    onCheckedChange={(checked) => 
                      setFixtureFormData({ 
                        ...fixtureFormData, 
                        is_finished: checked,
                        fixture_status: checked ? 'completed' : 'scheduled'
                      })
                    }
                  />
                  <Label htmlFor="is-finished">Match Finished</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mark as finished to complete the match
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleCancelDialog} className="w-full sm:w-auto">
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
          <CardTitle>Fixtures</CardTitle>
          {sports.length > 0 && (
            <Tabs value={activeSportTab} onValueChange={setActiveSportTab} className="mt-4">
              <TabsList className="border-b overflow-x-auto">
                {sports.map((sport) => (
                  <TabsTrigger 
                    key={sport.sport_id} 
                    value={sport.sport_code}
                    className="whitespace-nowrap"
                  >
                    {sport.sport_name} ({sportCounts[sport.sport_code] || 0})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!activeSportTab ? (
            <div className="text-center py-8 text-muted-foreground">
              Select a sport to view fixtures
            </div>
          ) : filteredFixtures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fixtures found {searchQuery ? `for "${searchQuery}"` : ""}
              {activeSportTab && ` in ${sports.find(s => s.sport_code === activeSportTab)?.sport_name || activeSportTab}`}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Kickoff</TableHead>
                  <TableHead>Venue</TableHead> 
                  <TableHead>Home Team</TableHead>
                  <TableHead>Away Team</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Finished</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFixtures.map((fixture) => {
                  const winningTeam = getWinningTeam(fixture);
                  const shouldShowWinningTeam = winningTeam !== "-";
                  const gameweekDisplay = getGameweekDisplay(fixture);
                  
                  return (
                    <TableRow key={fixture.fixture_id}>
                      <TableCell>
                        <div className="font-medium">
                          {fixture.season_name || `Season ${fixture.season_id}`}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {fixture.gameweek_number ? (
                          <Badge variant="outline">
                            {gameweekDisplay.type}{fixture.gameweek_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>{formatDateTime(fixture.kickoff_time)}</TableCell>
                       <TableCell>
                        {fixture.venue ? (
                          <div className="max-w-[200px] truncate" title={fixture.venue}>
                            {fixture.venue}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{fixture.home_team_name}</TableCell>
                      <TableCell>{fixture.away_team_name}</TableCell>
                      <TableCell>
                        {fixture.home_score !== null && fixture.away_score !== null
                          ? `${fixture.home_score} - ${fixture.away_score}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {shouldShowWinningTeam && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            <span className="font-medium">{winningTeam}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(fixture.fixture_status)}>
                          {fixture.fixture_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={fixture.is_finished ? "default" : "outline"}>
                          {fixture.is_finished ? "Yes" : "No"}
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}