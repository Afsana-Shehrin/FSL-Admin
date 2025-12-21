"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Filter, Image as ImageIcon, X } from "lucide-react"
import { getSupabase } from "@/lib/supabase/working-client"
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
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interface for team data
interface Team {
  team_id: number
  team_name: string
  team_short_name?: string
  team_code: string
  sport_id: number
  league_id: number
  team_logo_url?: string
  team_logo_base64?: string
  primary_color?: string
  secondary_color?: string
  total_score: number
  top_player?: string
  is_active: boolean
  sport_name?: string
  league_name?: string
}

interface Sport {
  sport_id: number
  sport_name: string
  sport_code: string
  icon_url: string
  is_active: boolean
  display_order: number
}

interface League {
  league_id: number
  sport_id: number
  league_name: string
  league_code: string
  league_logo_url?: string
  country_code?: string
  is_active: boolean
  number_of_clubs: number
}

export default function TeamsPage() {
  const [teamsList, setTeamsList] = useState<Team[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSportId, setSelectedSportId] = useState<string>("all")
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // State for image handling
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<"upload" | "url">("url")

  const [formData, setFormData] = useState({
    team_name: "",
    team_short_name: "",
    team_code: "",
    sport_id: "",
    league_id: "",
    team_logo_url: "",
    team_logo_base64: "",
    primary_color: "#000000",
    secondary_color: "#FFFFFF",
    total_score: 0,
    top_player: "",
    is_active: true,
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchTeams(),
        fetchSports(),
        fetchLeagues()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeams = async () => {
  try {
    const supabase = getSupabase()
    
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('team_name')
    
    if (teamsError) throw teamsError
    
    if (teamsData && teamsData.length > 0) {
      // FIX: Simplify the filter logic to avoid TypeScript issues
      const sportIds = teamsData
        .map((team: any) => team.sport_id as number)
        .filter((id: number | null): id is number => id !== null)
      
      const leagueIds = teamsData
        .map((team: any) => team.league_id as number)
        .filter((id: number | null): id is number => id !== null)
      
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('sport_id, sport_name, sport_code')
        .in('sport_id', sportIds)
      
      if (sportsError) throw sportsError
      
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('league_id, league_name, league_code, sport_id')
        .in('league_id', leagueIds)
      
      if (leaguesError) throw leaguesError
      
      // Define types for map values
      type SportInfo = {
        name: string;
        code: string;
      }
      
      type LeagueInfo = {
        name: string;
        code: string;
        sport_id: number;
      }
      
      const sportsMap = new Map<number, SportInfo>(
        sportsData?.map((sport: any) => [sport.sport_id, {
          name: sport.sport_name,
          code: sport.sport_code
        }]) || []
      )
      
      const leaguesMap = new Map<number, LeagueInfo>(
        leaguesData?.map((league: any) => [league.league_id, {
          name: league.league_name,
          code: league.league_code,
          sport_id: league.sport_id
        }]) || []
      )
      
      const enrichedTeams = teamsData.map((team: any) => {
        const sportInfo = sportsMap.get(team.sport_id) || { 
          name: `Sport ID: ${team.sport_id}`, 
          code: `SPORT_${team.sport_id}` 
        }
        
        const leagueInfo = leaguesMap.get(team.league_id) || { 
          name: `League ID: ${team.league_id}`, 
          code: `LEAGUE_${team.league_id}`,
          sport_id: team.sport_id
        }
        
        return {
          ...team,
          sport_name: sportInfo.name,
          sport_code: sportInfo.code,
          league_name: leagueInfo.name,
          league_code: leagueInfo.code
        }
      })
      
      setTeamsList(enrichedTeams as Team[])
    } else {
      setTeamsList([])
    }
  } catch (error) {
    console.error("Error fetching teams:", error)
    toast.error("Failed to fetch teams")
    
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name')
      
      if (error) throw error
      
      setTeamsList(data || [])
    } catch (fallbackError) {
      console.error("Fallback fetch also failed:", fallbackError)
    }
  }
}

  const fetchSports = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .order('display_order', { ascending: true })
        .order('sport_name')
      
      if (error) throw error
      setSports(data || [])
    } catch (error) {
      console.error("Error fetching sports:", error)
      toast.error("Failed to fetch sports")
    }
  }

  const fetchLeagues = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('league_name')
      
      if (error) throw error
      setLeagues(data || [])
    } catch (error) {
      console.error("Error fetching leagues:", error)
      toast.error("Failed to fetch leagues")
    }
  }

  // Image handling functions
  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)")
        return
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB")
        return
      }
      
      setLogoFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setLogoPreview(base64String)
        setFormData(prev => ({ 
          ...prev, 
          team_logo_base64: base64String,
          team_logo_url: ""
        }))
      }
      reader.readAsDataURL(file)
      
      setSelectedTab("upload")
    }
  }

  const removeLogoFile = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, team_logo_base64: "" }))
  }

  const clearLogoUrl = () => {
    setFormData(prev => ({ ...prev, team_logo_url: "" }))
  }

  const handleTabChange = (tab: "upload" | "url") => {
    setSelectedTab(tab)
    if (tab === "url") {
      setLogoFile(null)
      setLogoPreview(null)
      setFormData(prev => ({ ...prev, team_logo_base64: "" }))
    } else {
      setFormData(prev => ({ ...prev, team_logo_url: "" }))
    }
  }

  const filteredTeams = teamsList.filter((team) => {
    const matchesSearch =
      team.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.team_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.top_player?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.team_short_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSport = selectedSportId === "all" || team.sport_id?.toString() === selectedSportId
    const matchesLeague = selectedLeagueId === "all" || team.league_id?.toString() === selectedLeagueId
    
    return matchesSearch && matchesSport && matchesLeague
  })

  const filteredLeagues = selectedSportId === "all" 
    ? leagues 
    : leagues.filter((league: League) => league.sport_id.toString() === selectedSportId)

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      team_name: team.team_name || "",
      team_short_name: team.team_short_name || "",
      team_code: team.team_code || "",
      sport_id: team.sport_id?.toString() || "",
      league_id: team.league_id?.toString() || "",
      team_logo_url: team.team_logo_url || "",
      team_logo_base64: team.team_logo_base64 || "",
      primary_color: team.primary_color || "#000000",
      secondary_color: team.secondary_color || "#FFFFFF",
      total_score: team.total_score || 0,
      top_player: team.top_player || "",
      is_active: team.is_active,
    })
    
    if (team.team_logo_base64) {
      setLogoPreview(team.team_logo_base64)
      setSelectedTab("upload")
      setLogoFile(null)
    } else if (team.team_logo_url) {
      setLogoPreview(team.team_logo_url)
      setSelectedTab("url")
    } else {
      setLogoPreview(null)
      setSelectedTab("url")
    }
    
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingTeam(null)
    setFormData({
      team_name: "",
      team_short_name: "",
      team_code: "",
      sport_id: "",
      league_id: "",
      team_logo_url: "",
      team_logo_base64: "",
      primary_color: "#000000",
      secondary_color: "#FFFFFF",
      total_score: 0,
      top_player: "",
      is_active: true,
    })
    
    setLogoFile(null)
    setLogoPreview(null)
    setSelectedTab("url")
    
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const supabase = getSupabase()
      
      if (!formData.team_name.trim() || !formData.team_code.trim() || !formData.sport_id || !formData.league_id) {
        toast.error("Please fill in all required fields: Team Name, Team Code, Sport, and League")
        return
      }

      const teamData: any = {
        team_name: formData.team_name,
        team_short_name: formData.team_short_name || null,
        team_code: formData.team_code,
        sport_id: parseInt(formData.sport_id),
        league_id: parseInt(formData.league_id),
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        total_score: formData.total_score,
        top_player: formData.top_player || null,
        is_active: formData.is_active,
      }

      if (selectedTab === "upload" && formData.team_logo_base64) {
        teamData.team_logo_base64 = formData.team_logo_base64
        teamData.team_logo_url = null
      } else if (selectedTab === "url" && formData.team_logo_url) {
        teamData.team_logo_url = formData.team_logo_url
        teamData.team_logo_base64 = null
      } else {
        teamData.team_logo_url = null
        teamData.team_logo_base64 = null
      }

      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update(teamData)
          .eq('team_id', editingTeam.team_id)

        if (error) throw error
        toast.success("Team updated successfully!")
      } else {
        const { error } = await supabase
          .from('teams')
          .insert(teamData)

        if (error) throw error
        toast.success("Team created successfully!")
      }

      await fetchTeams()
      setIsDialogOpen(false)
      
      setLogoFile(null)
      setLogoPreview(null)
      setFormData(prev => ({ ...prev, team_logo_base64: "" }))
      
    } catch (error: any) {
      console.error("Error saving team:", error)
      toast.error(`Failed to save team: ${error.message}`)
    }
  }

  const handleDelete = async (teamId: number) => {
    if (!confirm("Are you sure you want to delete this team?")) return
    
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId)

      if (error) throw error
      
      await fetchTeams()
      toast.success("Team deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting team:", error)
      toast.error(`Failed to delete team: ${error.message}`)
    }
  }

  const fixTeamReferences = async () => {
    if (!confirm("This will update all teams to use sport_id=1 (Football) and league_id=1 (EPL). Continue?")) return
    
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('teams')
        .update({
          sport_id: 1,
          league_id: 1
        })
        .neq('team_id', 0)

      if (error) throw error
      
      toast.success("Team references updated successfully!")
      await fetchTeams()
    } catch (error: any) {
      console.error("Error fixing team references:", error)
      toast.error(`Failed to update team references: ${error.message}`)
    }
  }

  const addDefaultSport = async () => {
    try {
      const supabase = getSupabase()
      
      const { data: existingSports } = await supabase
        .from('sports')
        .select('sport_id')
        .eq('sport_code', 'FOOTBALL')
        .limit(1)
      
      if (!existingSports || existingSports.length === 0) {
        const { error } = await supabase
          .from('sports')
          .insert({
            sport_name: 'Football',
            sport_code: 'FOOTBALL',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
            is_active: true,
            display_order: 1
          })
        
        if (error) throw error
        toast.success("Added Football sport to database")
      }
      
      const { data: existingLeagues } = await supabase
        .from('leagues')
        .select('league_id')
        .eq('league_code', 'EPL')
        .limit(1)
      
      if (!existingLeagues || existingLeagues.length === 0) {
        const { data: footballSport } = await supabase
          .from('sports')
          .select('sport_id')
          .eq('sport_code', 'FOOTBALL')
          .single()
        
        if (footballSport) {
          const { error } = await supabase
            .from('leagues')
            .insert({
              sport_id: footballSport.sport_id,
              league_name: 'English Premier League',
              league_code: 'EPL',
              league_logo_url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
              country_code: 'GB',
              is_active: true,
              number_of_clubs: 20
            })
          
          if (error) throw error
          toast.success("Added EPL league to database")
        }
      }
      
      await fetchSports()
      await fetchLeagues()
      toast.success("Database setup complete!")
    } catch (error: any) {
      console.error("Error adding default sport/league:", error)
      toast.error(`Failed to setup database: ${error.message}`)
    }
  }

  const getTeamLogoUrl = (team: Team) => {
    if (team.team_logo_base64) {
      return team.team_logo_base64
    }
    
    if (team.team_logo_url) {
      return team.team_logo_url
    }
    
    const logoMap: Record<string, string> = {
      'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
      'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
      'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
      'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
      'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
      'Tottenham Hotspur': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
      'Aston Villa': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
      'Newcastle United': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
      'West Ham United': 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
      'Crystal Palace': 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg',
      'Brighton & Hove Albion': 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
      'Wolverhampton Wanderers': 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg',
      'Everton': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
      'Brentford': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
      'Nottingham Forest': 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
      'Fulham': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg',
      'Burnley': 'https://upload.wikimedia.org/wikipedia/en/6/6d/Burnley_FC_Logo.svg',
      'Bournemouth': 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg',
    }
    
    if (logoMap[team.team_name]) {
      return logoMap[team.team_name]
    }
    
    for (const [key, url] of Object.entries(logoMap)) {
      if (team.team_name.includes(key) || key.includes(team.team_name)) {
        return url
      }
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(team.team_name)}&background=${team.primary_color?.replace('#', '') || '666'}&color=${team.secondary_color?.replace('#', '') || 'fff'}&size=128`
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Teams Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage teams across all sports and leagues</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {sports.length === 0 && (
            <Button variant="outline" onClick={addDefaultSport} className="w-full sm:w-auto bg-green-100 text-green-800 hover:bg-green-200">
              <Plus className="mr-2 h-4 w-4" />
              Setup DB
            </Button>
          )}

          {teamsList.some(team => !team.sport_name || team.sport_name.includes('ID:')) && (
            <Button variant="outline" onClick={fixTeamReferences} className="w-full sm:w-auto bg-amber-100 text-amber-800 hover:bg-amber-200">
              <Plus className="mr-2 h-4 w-4" />
              Fix References
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
                <DialogDescription>
                  {editingTeam ? "Update the team details below." : "Add a new team to your platform."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    placeholder="e.g., Arsenal"
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team-short-name">Short Name</Label>
                  <Input
                    id="team-short-name"
                    placeholder="e.g., Ars"
                    value={formData.team_short_name}
                    onChange={(e) => setFormData({ ...formData, team_short_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team-code">Team Code *</Label>
                  <Input
                    id="team-code"
                    placeholder="e.g., ARS"
                    value={formData.team_code}
                    onChange={(e) => setFormData({ ...formData, team_code: e.target.value.toUpperCase() })}
                    required
                    maxLength={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sport-id">Sport *</Label>
                  <Select
                    value={formData.sport_id}
                    onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
                  >
                    <SelectTrigger id="sport-id">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((sport: Sport) => (
                        <SelectItem key={sport.sport_id} value={sport.sport_id.toString()}>
                          {sport.sport_name} (Code: {sport.sport_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="league-id">League *</Label>
                  <Select
                    value={formData.league_id}
                    onValueChange={(value) => setFormData({ ...formData, league_id: value })}
                    disabled={!formData.sport_id}
                  >
                    <SelectTrigger id="league-id">
                      <SelectValue placeholder="Select league" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues
                        .filter((league: League) => league.sport_id.toString() === formData.sport_id)
                        .map((league: League) => (
                          <SelectItem key={league.league_id} value={league.league_id.toString()}>
                            {league.league_name} (Code: {league.league_code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Logo Section */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Team Logo</Label>
                  <Tabs value={selectedTab} onValueChange={(value) => handleTabChange(value as "upload" | "url")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">
                        <span className="flex items-center">
                          <span className="mr-2">📤</span>
                          Upload from Device
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <span className="flex items-center">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Use Image URL
                        </span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="logo-upload">Select Logo Image</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileSelect}
                              className="cursor-pointer"
                            />
                            {(logoFile || formData.team_logo_base64) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={removeLogoFile}
                                className="h-10 w-10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Supported: JPG, PNG, GIF, WebP, SVG (Max: 2MB)
                          </p>
                        </div>
                        
                        <div className="flex-1">
                          <Label>Preview</Label>
                          <div className="mt-1 h-32 w-32 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                            {logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="text-muted-foreground text-center p-4">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-xs">No logo selected</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label htmlFor="team-logo-url">Logo URL</Label>
                          <Input
                            id="team-logo-url"
                            placeholder="https://example.com/logo.png"
                            value={formData.team_logo_url}
                            onChange={(e) => setFormData({ ...formData, team_logo_url: e.target.value })}
                          />
                        </div>
                        {formData.team_logo_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearLogoUrl}
                            className="mt-6 h-10 w-10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-start gap-4 mt-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-2">
                            Use a direct image URL. For Premier League teams:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Arsenal: https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg</li>
                            <li>• Man Utd: https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg</li>
                            <li>• Liverpool: https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg</li>
                          </ul>
                        </div>
                        {formData.team_logo_url && (
                          <div className="flex-shrink-0">
                            <Label className="text-xs">URL Preview</Label>
                            <div className="mt-1 h-20 w-20 rounded border bg-muted flex items-center justify-center overflow-hidden">
                              <img
                                src={formData.team_logo_url}
                                alt="URL preview"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                  e.currentTarget.classList.add("opacity-50");
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total-score">Total Score</Label>
                  <Input
                    id="total-score"
                    type="number"
                    placeholder="0"
                    value={formData.total_score}
                    onChange={(e) => setFormData({ ...formData, total_score: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="top-player">Top Player</Label>
                  <Input
                    id="top-player"
                    placeholder="e.g., Bukayo Saka"
                    value={formData.top_player}
                    onChange={(e) => setFormData({ ...formData, top_player: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:col-span-2">
                  <Label htmlFor="team-active">Active Status</Label>
                  <Switch
                    id="team-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false)
                  setLogoFile(null)
                  setLogoPreview(null)
                  setFormData(prev => ({ ...prev, team_logo_base64: "" }))
                }} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="w-full sm:w-auto"
                >
                  {editingTeam ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Teams ({filteredTeams.length})</CardTitle>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              {/* Leagues dropdown on the left */}
              <div className="w-full md:w-64">
                <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={selectedSportId === "all" ? "Select league" : "Filter leagues"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {filteredLeagues.map((league: League) => (
                      <SelectItem key={league.league_id} value={league.league_id.toString()}>
                        {league.league_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search bar on the right */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search teams or players..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-2 border-b overflow-x-auto">
              <button
                onClick={() => setSelectedSportId("all")}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  selectedSportId === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Sports
                {selectedSportId === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              {sports.map((sport: Sport) => (
                <button
                  key={sport.sport_id}
                  onClick={() => setSelectedSportId(sport.sport_id.toString())}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    selectedSportId === sport.sport_id.toString() ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sport.sport_name}
                  {selectedSportId === sport.sport_id.toString() && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading teams...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead>Top Player</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {teamsList.length === 0 ? (
                        <div className="space-y-4">
                          <p>No teams found in database.</p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button onClick={handleCreate} size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Your First Team
                            </Button>
                            {sports.length === 0 && (
                              <Button onClick={addDefaultSport} variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100">
                                <Plus className="mr-2 h-4 w-4" />
                                Setup Database First
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        "No teams match your search filters."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team: Team) => (
                    <TableRow key={team.team_id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          <img 
                            src={getTeamLogoUrl(team)} 
                            alt={team.team_name} 
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                              console.error(`Failed to load logo for ${team.team_name}:`, e.currentTarget.src);
                              e.currentTarget.src = "/placeholder.svg";
                              e.currentTarget.classList.add("opacity-50");
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{team.team_name}</div>
                          {team.team_short_name && team.team_short_name !== team.team_name && (
                            <div className="text-sm text-muted-foreground">{team.team_short_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.team_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{team.sport_name || 'N/A'}</div>
                          {team.sport_id && (
                            <div className="text-xs text-muted-foreground">ID: {team.sport_id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{team.league_name || 'N/A'}</div>
                          {team.league_id && (
                            <div className="text-xs text-muted-foreground">ID: {team.league_id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.top_player ? (
                          <Badge variant="secondary">{team.top_player}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {team.total_score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: team.primary_color || '#000000' }}
                            title={team.primary_color || '#000000'}
                          />
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: team.secondary_color || '#FFFFFF' }}
                            title={team.secondary_color || '#FFFFFF'}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={team.is_active ? "default" : "secondary"}>
                          {team.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(team)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(team.team_id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
