"use client"

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, Loader2, Image, Plus, Upload, Calendar, PlayCircle, CheckCircle, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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

interface League {
  league_id: number;
  sport_id: number;
  league_name: string;
  league_code: string;
  league_logo_url: string | null;
  country_code: string | null;
  is_active: boolean;
  created_at: string;
  number_of_clubs: number;
  league_cup: string | null;
  league_description: string | null;
  league_status: 'Coming soon' | 'Live' | 'Completed';
  winner_team_id: number | null;
}

interface Sport {
  sport_id: number;
  sport_name: string;
  sport_code: string;
  sport_icon: string | null;
  is_active: boolean;
}

interface Team {
  team_id: number;
  team_name: string;
  team_code: string;
  team_logo_url: string | null;
}

interface LeagueFormData {
  league_name: string;
  sport_id: number;
  league_logo_url: string;
  country_code: string;
  is_active: boolean;
  number_of_clubs: number;
  league_cup: string;
  league_description: string;
  league_status: 'Coming soon' | 'Live' | 'Completed';
  winner_team_id: number | null;
}

interface LeaguesTabProps {
  selectedSport: string
}

// Countries data
const countriesData = [
  { code: "GB", name: "United Kingdom" },
  { code: "ES", name: "Spain" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "FR", name: "France" },
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
]

// League status options
const leagueStatusOptions = [
  { value: "Coming soon", label: "Coming soon", icon: Calendar },
  { value: "Live", label: "Live", icon: PlayCircle },
  { value: "Completed", label: "Completed", icon: CheckCircle },
]

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

export default function LeaguesTab({ selectedSport }: LeaguesTabProps) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [teams, setTeams] = useState<Team[]>([]) // New state for teams
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLeagueDialogOpen, setIsLeagueDialogOpen] = useState(false)
  const [editingLeague, setEditingLeague] = useState<League | null>(null)
  const [supabaseClient, setSupabaseClient] = useState<any>(null)

  const [leagueFormData, setLeagueFormData] = useState<LeagueFormData>({
    league_name: "",
    sport_id: 0,
    league_logo_url: "",
    country_code: "",
    is_active: true,
    number_of_clubs: 0,
    league_cup: "",
    league_description: "",
    league_status: "Coming soon",
    winner_team_id: null,
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
      
      // Fetch sports
      const { data: sportsData, error: sportsError } = await supabaseClient
        .from('sports')
        .select('*')
        .order('sport_name')
      
      if (sportsError) throw sportsError
      setSports(sportsData || [])
      
      // Fetch teams (for winner selection)
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
      
      // Fetch leagues
      const { data: leaguesData, error: leaguesError } = await supabaseClient
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (leaguesError) throw leaguesError
      setLeagues(leaguesData || [])
      
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Failed to load data. Please check console for details.")
    } finally {
      setLoading(false)
    }
  }

  const filteredLeagues = leagues.filter((league) => {
    const matchesSearch = league.league_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         league.league_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = selectedSport === "all" || league.sport_id.toString() === selectedSport
    return matchesSearch && matchesSport
  })

  const handleEditLeague = (league: League) => {
    setEditingLeague(league)
    setLeagueFormData({
      league_name: league.league_name,
      sport_id: league.sport_id,
      league_logo_url: league.league_logo_url || "",
      country_code: league.country_code || "",
      is_active: league.is_active,
      number_of_clubs: league.number_of_clubs,
      league_cup: league.league_cup || "",
      league_description: league.league_description || "",
      league_status: league.league_status || "Coming soon",
      winner_team_id: league.winner_team_id || null,
    })
    setIsLeagueDialogOpen(true)
  }

  const handleCreateLeague = () => {
    setEditingLeague(null)
    setLeagueFormData({
      league_name: "",
      sport_id: sports[0]?.sport_id || 0,
      league_logo_url: "",
      country_code: "",
      is_active: true,
      number_of_clubs: 0,
      league_cup: "",
      league_description: "",
      league_status: "Coming soon",
      winner_team_id: null,
    })
    setIsLeagueDialogOpen(true)
  }

  const handleSaveLeague = async (leagueData: LeagueFormData) => {
    if (!supabaseClient) {
      alert("Database connection not available")
      return
    }
    
    try {
      // Validate required fields
      if (!leagueData.league_name.trim()) {
        alert("League name is required")
        return
      }

      // Generate league code from league name (first 6 characters uppercase)
      const leagueCode = leagueData.league_name
        .replace(/\s+/g, '')
        .slice(0, 6)
        .toUpperCase()

      if (editingLeague) {
        // Update existing league in Supabase
        const { data, error } = await supabaseClient
          .from('leagues')
          .update({
            sport_id: leagueData.sport_id,
            league_name: leagueData.league_name,
            league_logo_url: leagueData.league_logo_url || null,
            country_code: leagueData.country_code || null,
            is_active: leagueData.is_active,
            number_of_clubs: leagueData.number_of_clubs || 0,
            league_cup: leagueData.league_cup || null,
            league_description: leagueData.league_description || null,
            league_status: leagueData.league_status || "Coming soon",
            winner_team_id: leagueData.league_status === "Completed" ? leagueData.winner_team_id : null,
          })
          .eq('league_id', editingLeague.league_id)
          .select()
          .single()

        if (error) throw error

        // Update local state
        setLeagues(leagues.map(l => 
          l.league_id === editingLeague.league_id ? data : l
        ))
        
        alert("✅ League updated successfully!")
      } else {
        // Create new league in Supabase
        const { data, error } = await supabaseClient
          .from('leagues')
          .insert([{
            sport_id: leagueData.sport_id,
            league_name: leagueData.league_name,
            league_code: leagueCode,
            league_logo_url: leagueData.league_logo_url || null,
            country_code: leagueData.country_code || null,
            is_active: leagueData.is_active,
            number_of_clubs: leagueData.number_of_clubs || 0,
            league_cup: leagueData.league_cup || null,
            league_description: leagueData.league_description || null,
            league_status: leagueData.league_status || "Coming soon",
            winner_team_id: leagueData.league_status === "Completed" ? leagueData.winner_team_id : null,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error

        // Add to local state
        setLeagues([data, ...leagues])
        
        alert("✅ League created successfully!")
      }
      
      // Refresh data
      await fetchData()
      
    } catch (error: any) {
      console.error("Error saving league:", error)
      alert(`❌ Failed to save league: ${error.message}`)
      throw error
    }
  }

  const handleDeleteLeague = async (leagueId: number) => {
    if (!supabaseClient) {
      alert("Database connection not available")
      return
    }
    
    if (!confirm("Are you sure you want to delete this league?")) return

    try {
      const { error } = await supabaseClient
        .from('leagues')
        .delete()
        .eq('league_id', leagueId)

      if (error) throw error

      // Remove from local state
      setLeagues(leagues.filter((l) => l.league_id !== leagueId))
      
      alert("✅ League deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting league:", error)
      alert(`❌ Failed to delete league: ${error.message}`)
    }
  }

  const handleToggleStatus = async (league: League) => {
    if (!supabaseClient) {
      alert("Database connection not available")
      return
    }
    
    try {
      const { error } = await supabaseClient
        .from('leagues')
        .update({
          is_active: !league.is_active,
        })
        .eq('league_id', league.league_id)

      if (error) throw error

      // Update local state
      setLeagues(leagues.map(l => 
        l.league_id === league.league_id ? { ...l, is_active: !l.is_active } : l
      ))
      
    } catch (error: any) {
      console.error("Error toggling league status:", error)
      alert(`❌ Failed to update status: ${error.message}`)
    }
  }

  const getSportName = (sportId: number) => {
    const sport = sports.find((s) => s.sport_id === sportId)
    return sport ? `${sport.sport_name} (${sport.sport_code})` : "Unknown"
  }

  const getTeamName = (teamId: number | null) => {
    if (!teamId) return null
    const team = teams.find((t) => t.team_id === teamId)
    return team ? team.team_name : "Unknown Team"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: 'Coming soon' | 'Live' | 'Completed') => {
    switch (status) {
      case 'Coming soon': return <Calendar className="h-3 w-3 mr-1" />
      case 'Live': return <PlayCircle className="h-3 w-3 mr-1" />
      case 'Completed': return <CheckCircle className="h-3 w-3 mr-1" />
      default: return null
    }
  }

  const getStatusColor = (status: 'Coming soon' | 'Live' | 'Completed') => {
    switch (status) {
      case 'Coming soon': return "bg-blue-500 hover:bg-blue-600"
      case 'Live': return "bg-green-500 hover:bg-green-600"
      case 'Completed': return "bg-purple-500 hover:bg-purple-600"
      default: return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const handleSubmit = async () => {
    try {
      await handleSaveLeague(leagueFormData)
      setIsLeagueDialogOpen(false)
    } catch (error) {
      // Error is handled in handleSaveLeague
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
        <span className="ml-2">Loading leagues...</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leagues..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isLeagueDialogOpen} onOpenChange={setIsLeagueDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateLeague} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add League
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLeague ? "Edit League" : "Add New League"}</DialogTitle>
              <DialogDescription>
                {editingLeague ? "Update the league details below." : "Add a new league to your platform."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* League Logo */}
              <div className="space-y-2">
                <Label htmlFor="league-logo">League Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {leagueFormData.league_logo_url ? (
                      <img 
                        src={leagueFormData.league_logo_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="league-logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const base64String = reader.result as string
                          setLeagueFormData(prev => ({ 
                            ...prev, 
                            league_logo_url: base64String 
                          }))
                        }
                        reader.readAsDataURL(file)
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload Leagues Logo Image</p>
                  </div>
                </div>
              </div>

              {/* League Name */}
              <div className="space-y-2">
                <Label htmlFor="league-name">League Name *</Label>
                <Input
                  id="league-name"
                  placeholder="e.g., Premier League"
                  value={leagueFormData.league_name}
                  onChange={(e) => setLeagueFormData({ ...leagueFormData, league_name: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  League code will be auto-generated from the name
                </p>
              </div>

              {/* Sport Selection */}
              <div className="space-y-2">
                <Label htmlFor="sport">Sport *</Label>
                <Select
                  value={leagueFormData.sport_id?.toString() || ""}
                  onValueChange={(value) => setLeagueFormData({ ...leagueFormData, sport_id: parseInt(value) })}
                >
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Select sport" />
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

              {/* Country Code */}
              <div className="space-y-2">
                <Label htmlFor="country-code">Country Code</Label>
                <Select
                  value={leagueFormData.country_code || "none"}
                  onValueChange={(value) => setLeagueFormData({ ...leagueFormData, country_code: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="country-code">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Country</SelectItem>
                    {countriesData.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Number of Clubs */}
              <div className="space-y-2">
                <Label htmlFor="number-of-clubs">Number of Clubs</Label>
                <Input
                  id="number-of-clubs"
                  type="number"
                  min="0"
                  value={leagueFormData.number_of_clubs}
                  onChange={(e) => setLeagueFormData({ ...leagueFormData, number_of_clubs: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* League Cup */}
              <div className="space-y-2">
                <Label htmlFor="league-cup">League Cup</Label>
                <Input
                  id="league-cup"
                  placeholder="e.g., FA Cup, Copa del Rey"
                  value={leagueFormData.league_cup}
                  onChange={(e) => setLeagueFormData({ ...leagueFormData, league_cup: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="League description"
                  value={leagueFormData.league_description}
                  onChange={(e) => setLeagueFormData({ ...leagueFormData, league_description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* League Status */}
              <div className="space-y-2">
                <Label htmlFor="league-status">League Status</Label>
                <Select
                  value={leagueFormData.league_status}
                  onValueChange={(value: 'Coming soon' | 'Live' | 'Completed') => 
                    setLeagueFormData({ ...leagueFormData, league_status: value })
                  }
                >
                  <SelectTrigger id="league-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueStatusOptions.map((status) => {
                      const Icon = status.icon
                      return (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{status.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Winner Selection (only shown when status is Completed) */}
              {leagueFormData.league_status === "Completed" && (
                <div className="space-y-2">
                  <Label htmlFor="winner-team">Winner Team</Label>
                  <Select
                    value={leagueFormData.winner_team_id?.toString() || "none"}
                    onValueChange={(value) => 
                      setLeagueFormData({ 
                        ...leagueFormData, 
                        winner_team_id: value === "none" ? null : parseInt(value) 
                      })
                    }
                  >
                    <SelectTrigger id="winner-team">
                      <SelectValue placeholder="Select winning team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Winner Found</SelectItem>
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
                  <p className="text-xs text-gray-500">
                    Select the winning team for this completed league
                  </p>
                </div>
              )}

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="league-active">Active Status</Label>
                <Switch
                  id="league-active"
                  checked={leagueFormData.is_active}
                  onCheckedChange={(checked) => setLeagueFormData({ ...leagueFormData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLeagueDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingLeague ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leagues ({filteredLeagues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Cup</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Clubs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Winner</TableHead> {/* New column */}
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeagues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      {leagues.length === 0 
                        ? "No leagues found. Create your first league!" 
                        : "No leagues match your search criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeagues.map((league) => (
                    <TableRow key={league.league_id}>
                      <TableCell>
                        {league.league_logo_url ? (
                          <img 
                            src={league.league_logo_url} 
                            alt={league.league_name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Image className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{league.league_name}</span>
                          {league.league_description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {league.league_description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {league.league_cup ? (
                          <Badge variant="secondary" className="font-normal">
                            {league.league_cup}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {league.league_code}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSportName(league.sport_id)}</TableCell>
                      <TableCell>
                        {league.country_code ? (
                          <Badge variant="secondary">{league.country_code}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {league.number_of_clubs > 0 ? league.number_of_clubs : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(league.league_status || 'Coming soon')} text-white`}
                        >
                          <div className="flex items-center">
                            {getStatusIcon(league.league_status || 'Coming soon')}
                            {league.league_status || 'Coming soon'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {league.league_status === "Completed" ? (
                          league.winner_team_id ? (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">
                                {getTeamName(league.winner_team_id) || "Unknown Team"}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              No Winner Set
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
                          <Badge variant={league.is_active ? "default" : "secondary"}>
                            {league.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(league)}
                            className="h-6 px-2 text-xs"
                          >
                            {league.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(league.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditLeague(league)}
                            title="Edit league"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLeague(league.league_id)}
                            title="Delete league"
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
        </CardContent>
      </Card>
    </>
  )
}