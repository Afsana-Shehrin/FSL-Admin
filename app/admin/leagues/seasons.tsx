"use client"

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Edit, Trash2, Loader2, Plus, Upload, Trophy, User, Image, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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

interface Season {
  season_id: number;
  sport_id: number;
  league_id: number;
  season_name: string;
  year_start: number;
  year_end: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  season_config: any;
  is_active: boolean;
  created_at: string;
  champion_team_id: number | null;
  top_player_id: number | null;
  season_logo_url: string | null;
  notes: string | null;
}

interface League {
  league_id: number;
  league_name: string;
  league_code: string;
  sport_id: number;
  league_logo_url: string | null;
}

interface Team {
  team_id: number;
  team_name: string;
  team_code: string;
  team_logo_url: string | null;
}

interface Player {
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  team_id: number | null;
}

interface SeasonFormData {
  sport_id: number;
  league_id: number;
  season_name: string;
  year_start: number;
  year_end: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  is_active: boolean;
  season_logo_url: string;
  notes: string;
  champion_team_id: number | null;
  top_player_id: number | null;
}

interface SeasonWithLeague extends Season {
  league_name?: string;
  league_code?: string;
  league_logo_url?: string | null;
}

interface SeasonsTabProps {
  selectedSport: string
}

// Initialize Supabase client inside the component
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing!")
    throw new Error("Supabase configuration is missing")
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export default function SeasonsTab({ selectedSport }: SeasonsTabProps) {
  const [seasons, setSeasons] = useState<SeasonWithLeague[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<SeasonWithLeague | null>(null)
  const [supabaseClient, setSupabaseClient] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [seasonFormData, setSeasonFormData] = useState<SeasonFormData>({
    sport_id: 0,
    league_id: 0,
    season_name: "",
    year_start: new Date().getFullYear(),
    year_end: new Date().getFullYear() + 1,
    start_date: "",
    end_date: "",
    status: "upcoming",
    is_active: true,
    season_logo_url: "",
    notes: "",
    champion_team_id: null,
    top_player_id: null,
  })

  // Initialize Supabase client on component mount
  useEffect(() => {
    try {
      const client = getSupabaseClient()
      setSupabaseClient(client)
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      alert("Failed to connect to database. Please check your configuration.")
    }
  }, [])

  // Fetch data from Supabase
  useEffect(() => {
    if (supabaseClient) {
      fetchData()
    }
  }, [supabaseClient])

  const fetchData = async () => {
    if (!supabaseClient) return
    
    try {
      setLoading(true)
      
      // Fetch leagues
      const { data: leaguesData, error: leaguesError } = await supabaseClient
        .from('leagues')
        .select('league_id, league_name, league_code, sport_id, league_logo_url')
        .order('league_name')
      
      if (leaguesError) throw leaguesError
      setLeagues(leaguesData || [])
      
      // Fetch teams (for champion selection)
      const { data: teamsData, error: teamsError } = await supabaseClient
        .from('teams')
        .select('team_id, team_name, team_code, team_logo_url')
        .order('team_name')
      
      if (teamsError) {
        console.warn("Could not fetch teams:", teamsError.message)
        setTeams([])
      } else {
        setTeams(teamsData || [])
      }
      
      // Fetch players (for top player selection)
      const { data: playersData, error: playersError } = await supabaseClient
        .from('players')
        .select('player_id, player_name, jersey_number, team_id')
        .order('player_name')
      
      if (playersError) {
        console.warn("Could not fetch players:", playersError.message)
        setPlayers([])
      } else {
        setPlayers(playersData || [])
      }
      
      // Fetch seasons with league info
      const { data: seasonsData, error: seasonsError } = await supabaseClient
        .from('seasons')
        .select(`
          *,
          leagues (
            league_name,
            league_code,
            league_logo_url,
            sport_id
          )
        `)
        .order('created_at', { ascending: false })
      
      if (seasonsError) throw seasonsError
      
      // Transform data to include league info
      const transformedSeasons = (seasonsData || []).map((season: any) => ({
        ...season,
        league_name: season.leagues?.league_name,
        league_code: season.leagues?.league_code,
        league_logo_url: season.leagues?.league_logo_url,
        sport_id: season.leagues?.sport_id
      }))
      
      setSeasons(transformedSeasons)
      
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Failed to load data. Please check console for details.")
    } finally {
      setLoading(false)
    }
  }

  // Filter seasons based on selected sport and search query
  const filteredSeasons = seasons.filter((season) => {
    const matchesSearch = searchQuery === "" ||
      season.season_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      season.league_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      season.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSport = selectedSport === "all" || season.sport_id?.toString() === selectedSport
    return matchesSearch && matchesSport
  })

  const handleEditSeason = (season: SeasonWithLeague) => {
    setEditingSeason(season)
    setPreviewImage(season.season_logo_url || null)
    setSeasonFormData({
      sport_id: season.sport_id,
      league_id: season.league_id,
      season_name: season.season_name,
      year_start: season.year_start,
      year_end: season.year_end,
      start_date: season.start_date.split('T')[0],
      end_date: season.end_date.split('T')[0],
      status: season.status,
      is_active: season.is_active,
      season_logo_url: season.season_logo_url || "",
      notes: season.notes || "",
      champion_team_id: season.champion_team_id,
      top_player_id: season.top_player_id,
    })
    setIsSeasonDialogOpen(true)
  }

  const handleCreateSeason = () => {
    setEditingSeason(null)
    setPreviewImage(null)
    const currentYear = new Date().getFullYear()
    setSeasonFormData({
      sport_id: 0,
      league_id: 0,
      season_name: `${currentYear}/${currentYear + 1} Season`,
      year_start: currentYear,
      year_end: currentYear + 1,
      start_date: "",
      end_date: "",
      status: "upcoming",
      is_active: true,
      season_logo_url: "",
      notes: "",
      champion_team_id: null,
      top_player_id: null,
    })
    setIsSeasonDialogOpen(true)
  }

  const handleSaveSeason = async (seasonData: SeasonFormData) => {
    if (!supabaseClient) {
      alert("Database connection not available")
      return
    }
    
    try {
      // Validate required fields
      if (!seasonData.sport_id) {
        alert("Sport is required")
        return
      }
      if (!seasonData.league_id) {
        alert("Please select a league")
        return
      }
      if (!seasonData.season_name.trim()) {
        alert("Season name is required")
        return
      }
      if (!seasonData.start_date) {
        alert("Start date is required")
        return
      }
      if (!seasonData.end_date) {
        alert("End date is required")
        return
      }
      
      // Validate dates
      if (new Date(seasonData.end_date) <= new Date(seasonData.start_date)) {
        alert("End date must be after start date")
        return
      }

      // Validate years
      if (seasonData.year_end <= seasonData.year_start) {
        alert("End year must be after start year")
        return
      }

      const seasonPayload: any = {
        sport_id: seasonData.sport_id,
        league_id: seasonData.league_id,
        season_name: seasonData.season_name,
        year_start: seasonData.year_start,
        year_end: seasonData.year_end,
        start_date: seasonData.start_date,
        end_date: seasonData.end_date,
        status: seasonData.status,
        is_active: seasonData.is_active,
        season_logo_url: seasonData.season_logo_url || null,
        notes: seasonData.notes || null,
        season_config: {},
      }

      // Only include champion and top player if season is completed
      if (seasonData.status === "completed") {
        seasonPayload.champion_team_id = seasonData.champion_team_id
        seasonPayload.top_player_id = seasonData.top_player_id
      } else {
        seasonPayload.champion_team_id = null
        seasonPayload.top_player_id = null
      }

      if (editingSeason) {
        // Update existing season in Supabase
        const { data, error } = await supabaseClient
          .from('seasons')
          .update(seasonPayload)
          .eq('season_id', editingSeason.season_id)
          .select()
          .single()

        if (error) throw error

        alert("✅ Season updated successfully!")
      } else {
        // Create new season in Supabase
        const { data, error } = await supabaseClient
          .from('seasons')
          .insert([{
            ...seasonPayload,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error

        alert("✅ Season created successfully!")
      }
      
      // Refresh data
      await fetchData()
      
    } catch (error: any) {
      console.error("Error saving season:", error)
      alert(`❌ Failed to save season: ${error.message}`)
      throw error
    }
  }

  const handleDeleteSeason = async (seasonId: number) => {
    if (!supabaseClient) {
      alert("Database connection not available")
      return
    }
    
    if (!confirm("Are you sure you want to delete this season?")) return

    try {
      const { error } = await supabaseClient
        .from('seasons')
        .delete()
        .eq('season_id', seasonId)

      if (error) throw error

      // Remove from local state
      setSeasons(seasons.filter((s) => s.season_id !== seasonId))
      
      alert("✅ Season deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting season:", error)
      alert(`❌ Failed to delete season: ${error.message}`)
    }
  }

  const handleToggleStatus = async (season: SeasonWithLeague) => {
    if (!supabaseClient) {
      alert("Database connection not available")
      return
    }
    
    try {
      const { error } = await supabaseClient
        .from('seasons')
        .update({
          is_active: !season.is_active,
        })
        .eq('season_id', season.season_id)

      if (error) throw error

      // Update local state
      setSeasons(seasons.map(s => 
        s.season_id === season.season_id ? { ...s, is_active: !s.is_active } : s
      ))
      
    } catch (error: any) {
      console.error("Error toggling season status:", error)
      alert(`❌ Failed to update status: ${error.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: 'upcoming' | 'active' | 'completed') => {
    switch (status) {
      case 'upcoming': return "bg-blue-500 hover:bg-blue-600"
      case 'active': return "bg-green-500 hover:bg-green-600"
      case 'completed': return "bg-purple-500 hover:bg-purple-600"
      default: return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getTeamName = (teamId: number | null) => {
    if (!teamId) return null
    const team = teams.find((t) => t.team_id === teamId)
    return team ? team.team_name : "Unknown Team"
  }

  const getPlayerName = (playerId: number | null) => {
    if (!playerId) return null
    const player = players.find((p) => p.player_id === playerId)
    return player ? player.player_name : "Unknown Player"
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreviewImage(base64String)
      setSeasonFormData(prev => ({ 
        ...prev, 
        season_logo_url: base64String 
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    try {
      await handleSaveSeason(seasonFormData)
      setIsSeasonDialogOpen(false)
    } catch (error) {
      // Error is handled in handleSaveSeason
    }
  }

  if (!supabaseClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2">Initializing database connection...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading seasons...</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Desktop Search */}
        <div className="hidden lg:block relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search seasons..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Mobile Search */}
        <div className="lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search seasons..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Dialog open={isSeasonDialogOpen} onOpenChange={setIsSeasonDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateSeason} className="w-full lg:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Season
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSeason ? "Edit Season" : "Add New Season"}</DialogTitle>
              <DialogDescription>
                {editingSeason ? "Update the season details below." : "Add a new season to a league."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Season Logo */}
              <div className="space-y-2">
                <Label htmlFor="season-logo">Season Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {previewImage || seasonFormData.season_logo_url ? (
                      <img 
                        src={previewImage || seasonFormData.season_logo_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="season-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* League Selection */}
              <div className="space-y-2">
                <Label htmlFor="season-league">League *</Label>
                <Select
                  value={seasonFormData.league_id?.toString() || ""}
                  onValueChange={(value) => {
                    const leagueId = parseInt(value)
                    const selectedLeague = leagues.find(l => l.league_id === leagueId)
                    setSeasonFormData({ 
                      ...seasonFormData, 
                      league_id: leagueId,
                      sport_id: selectedLeague?.sport_id || 0
                    })
                  }}
                >
                  <SelectTrigger id="season-league">
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.league_id} value={league.league_id.toString()}>
                        <div className="flex items-center gap-2">
                          {league.league_logo_url && (
                            <img src={league.league_logo_url} alt={league.league_name} className="w-4 h-4 rounded" />
                          )}
                          <span>{league.league_name} ({league.league_code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Season Name */}
              <div className="space-y-2">
                <Label htmlFor="season-name">Season *</Label>
                <Input
                  id="season-name"
                  placeholder="e.g., 2024/25"
                  value={seasonFormData.season_name}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, season_name: e.target.value })}
                  required
                />
              </div>

              {/* Year Start/End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year-start">Year Start</Label>
                  <Input
                    id="year-start"
                    type="number"
                    min="2000"
                    max="2100"
                    value={seasonFormData.year_start}
                    onChange={(e) => setSeasonFormData({ 
                      ...seasonFormData, 
                      year_start: parseInt(e.target.value) || new Date().getFullYear() 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year-end">Year End</Label>
                  <Input
                    id="year-end"
                    type="number"
                    min="2000"
                    max="2100"
                    value={seasonFormData.year_end}
                    onChange={(e) => setSeasonFormData({ 
                      ...seasonFormData, 
                      year_end: parseInt(e.target.value) || new Date().getFullYear() + 1 
                    })}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={seasonFormData.start_date}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, start_date: e.target.value })}
                  required
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={seasonFormData.end_date}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, end_date: e.target.value })}
                  required
                />
              </div>

              {/* Season Status */}
              <div className="space-y-2">
                <Label htmlFor="season-status">Season Status</Label>
                <Select
                  value={seasonFormData.status}
                  onValueChange={(value: 'upcoming' | 'active' | 'completed') => 
                    setSeasonFormData({ ...seasonFormData, status: value })
                  }
                >
                  <SelectTrigger id="season-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Champion Selection (only shown when status is Completed) */}
              {seasonFormData.status === "completed" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="champion-team">Champion Team</Label>
                    <Select
                      value={seasonFormData.champion_team_id?.toString() || "none"}
                      onValueChange={(value) => 
                        setSeasonFormData({ 
                          ...seasonFormData, 
                          champion_team_id: value === "none" ? null : parseInt(value) 
                        })
                      }
                    >
                      <SelectTrigger id="champion-team">
                        <SelectValue placeholder="Select champion team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No champion selected</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.team_id} value={team.team_id.toString()}>
                            <div className="flex items-center gap-2">
                              {team.team_logo_url && (
                                <img src={team.team_logo_url} alt={team.team_name} className="w-4 h-4 rounded" />
                              )}
                              <span>{team.team_name} ({team.team_code})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Top Player Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="top-player">Top Player</Label>
                    <Select
                      value={seasonFormData.top_player_id?.toString() || "none"}
                      onValueChange={(value) => 
                        setSeasonFormData({ 
                          ...seasonFormData, 
                          top_player_id: value === "none" ? null : parseInt(value) 
                        })
                      }
                    >
                      <SelectTrigger id="top-player">
                        <SelectValue placeholder="Select top player" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No top player selected</SelectItem>
                        {players.map((player) => (
                          <SelectItem key={player.player_id} value={player.player_id.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{player.player_name} {player.jersey_number ? `(#${player.jersey_number})` : ''}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the season"
                  value={seasonFormData.notes}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="season-active">Active Status</Label>
                <Switch
                  id="season-active"
                  checked={seasonFormData.is_active}
                  onCheckedChange={(checked) => setSeasonFormData({ ...seasonFormData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSeasonDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingSeason ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Seasons ({filteredSeasons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>League</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Champion</TableHead>
                    <TableHead>Top Player</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeasons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        {seasons.length === 0 
                          ? "No seasons found. Create your first season!" 
                          : "No seasons match your sport filter."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSeasons.map((season) => (
                      <TableRow key={season.season_id}>
                        <TableCell>
                          {season.season_logo_url ? (
                            <img 
                              src={season.season_logo_url} 
                              alt={season.season_name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : season.league_logo_url ? (
                            <img 
                              src={season.league_logo_url} 
                              alt={season.league_name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Image className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{season.season_name}</span>
                            {season.notes && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {season.notes}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{season.league_name || "Unknown League"}</span>
                            <span className="text-xs text-muted-foreground">
                              {season.league_code || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{formatDate(season.start_date)}</span>
                            <span className="text-xs text-muted-foreground">to</span>
                            <span className="text-sm">{formatDate(season.end_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(season.status)} text-white`}>
                            {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {season.status === "completed" ? (
                            season.champion_team_id ? (
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span className="font-medium">
                                  {getTeamName(season.champion_team_id) || "Unknown Team"}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                No Champion
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {season.status === "completed" ? (
                            season.top_player_id ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {getPlayerName(season.top_player_id) || "Unknown Player"}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                No Top Player
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={season.is_active ? "default" : "secondary"}>
                              {season.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(season)}
                              className="h-6 px-2 text-xs"
                            >
                              {season.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(season.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditSeason(season)}
                              title="Edit season"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSeason(season.season_id)}
                              title="Delete season"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredSeasons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {seasons.length === 0 
                    ? "No seasons found. Create your first season!" 
                    : "No seasons match your sport filter."}
                </div>
              ) : (
                filteredSeasons.map((season) => (
                  <Card key={season.season_id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {season.season_logo_url ? (
                            <img 
                              src={season.season_logo_url} 
                              alt={season.season_name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : season.league_logo_url ? (
                            <img 
                              src={season.league_logo_url} 
                              alt={season.league_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{season.season_name}</h3>
                            <p className="text-sm text-muted-foreground">{season.league_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditSeason(season)}
                            title="Edit season"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSeason(season.season_id)}
                            title="Delete season"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {season.notes && (
                        <p className="text-sm text-muted-foreground mb-4">{season.notes}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Start Date</p>
                          <p className="text-sm font-medium">{formatDate(season.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p className="text-sm font-medium">{formatDate(season.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge className={`${getStatusColor(season.status)} text-white text-xs`}>
                            {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Active</p>
                          {season.is_active ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Champion</p>
                          {season.status === "completed" ? (
                            season.champion_team_id ? (
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm font-medium">
                                  {getTeamName(season.champion_team_id) || "Unknown Team"}
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No Champion</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">Pending</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Top Player</p>
                          {season.status === "completed" ? (
                            season.top_player_id ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-blue-500" />
                                <span className="text-sm font-medium">
                                  {getPlayerName(season.top_player_id) || "Unknown Player"}
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No Top Player</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">Pending</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm">{formatDate(season.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Years</p>
                          <p className="text-sm font-medium">{season.year_start} - {season.year_end}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(season)}
                          className="text-xs"
                        >
                          {season.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}