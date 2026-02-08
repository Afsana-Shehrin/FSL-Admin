"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Search, DollarSign, Image as ImageIcon, X, Filter, MoreVertical } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Initialize Supabase client
const supabase = getSupabase()

// Types
type Player = {
  player_id: number
  sport_id: number
  team_id: number
  primary_position_id: number
  secondary_positions: any[]
  player_name: string
  first_name: string | null
  last_name: string | null
  jersey_number: number | null
  player_image_url: string | null
  player_image_base64: string | null
  current_price: number
  total_points: number
  form: number | null
  selected_by_percent: number
  availability_status: 'available' | 'injured' | 'suspended' | 'doubtful'
  news_update: string | null
  is_multi_position: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  player_type?: string
  player_role?: number | null
  team_name?: string
  league_name?: string
  league_code?: string
  league_id?: number
  sport_name?: string
  position_name?: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sports, setSports] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [leagues, setLeagues] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [selectedLeague, setSelectedLeague] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Image handling states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedImageTab, setSelectedImageTab] = useState<"upload" | "url">("url")

  // Form state
  const [formData, setFormData] = useState({
    player_name: "",
    first_name: "",
    last_name: "",
    jersey_number: "",
    sport_id: "",
    team_id: "",
    league_id: "",
    primary_position_id: "",
    player_type: "",
    player_role: null as string | null,
    secondary_positions: [] as number[],
    current_price: "",
    total_points: "0",
    form: "",
    selected_by_percent: "0",
    availability_status: "available" as Player['availability_status'],
    news_update: "",
    is_multi_position: false,
    is_active: true,
    player_image_url: "",
    player_image_base64: "",
  })

  // Fetch ALL data directly from Supabase - NO API calls
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)

      // Fetch sports
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (sportsError) throw sportsError
      setSports(sportsData || [])

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('team_name')

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      // Fetch leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('*')
        .order('league_name')

      if (leaguesError) throw leaguesError
      setLeagues(leaguesData || [])

      // Fetch positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('player_positions')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (positionsError) throw positionsError
      setPositions(positionsData || [])

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('player_name')

      if (playersError) throw playersError

      // Enrich player data
      const enrichedPlayers = (playersData || []).map((player: { team_id: any; primary_position_id: any; sport_id: any }) => {
        const team = teamsData?.find((t: { team_id: any }) => t.team_id === player.team_id)
        const league = leaguesData?.find((l: { league_id: any }) => l.league_id === team?.league_id)
        const position = positionsData?.find((p: { position_id: any }) => p.position_id === player.primary_position_id)
        const sport = sportsData?.find((s: { sport_id: any }) => s.sport_id === player.sport_id)

        return {
          ...player,
          team_name: team?.team_name,
          league_name: league?.league_name,
          league_code: league?.league_code,
          league_id: team?.league_id,
          sport_name: sport?.sport_name,
          position_name: position?.position_name,
        }
      })

      setPlayers(enrichedPlayers)

    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter players based on selected sport, league AND team
  const filteredPlayers = players.filter(player => {
    const matchesSearch = searchQuery === "" ||
      player.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.sport_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.league_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSport = selectedSport === "all" || player.sport_id.toString() === selectedSport
    const matchesLeague = selectedLeague === "all" || player.league_id?.toString() === selectedLeague
    const matchesTeam = selectedTeam === "all" || player.team_id?.toString() === selectedTeam

    return matchesSearch && matchesSport && matchesLeague && matchesTeam
  })

  // Get leagues for the selected sport
  const getFilteredLeagues = () => {
    if (selectedSport === "all") {
      return leagues
    }
    return leagues.filter(league => league.sport_id?.toString() === selectedSport)
  }

  // Get filtered teams based on selected sport and league
  const getFilteredTeams = () => {
    let filtered = teams

    if (selectedSport !== "all") {
      filtered = filtered.filter(team => {
        const league = leagues.find(l => l.league_id === team.league_id)
        return league?.sport_id?.toString() === selectedSport
      })
    }

    if (selectedLeague !== "all") {
      filtered = filtered.filter(team => team.league_id?.toString() === selectedLeague)
    }

    return filtered.sort((a, b) => a.team_name.localeCompare(b.team_name))
  }

  // Get sport icon
  const getSportIcon = (sportName: string) => {
    const name = sportName?.toLowerCase() || ''
    if (name.includes('football') || name.includes('soccer')) return '⚽'
    if (name.includes('cricket')) return '🏏'
    if (name.includes('basketball')) return '🏀'
    if (name.includes('tennis')) return '🎾'
    if (name.includes('hockey')) return '🏒'
    return '🏅'
  }

  // Get availability badge variant
  const getAvailabilityBadge = (status: Player['availability_status']) => {
    const variants = {
      available: "default",
      injured: "destructive",
      suspended: "destructive",
      doubtful: "secondary",
    } as const
    return variants[status] || "default"
  }

  // Get player role badge - FIXED: Handle undefined case
  const getPlayerRoleBadge = (role: number | null | undefined) => {
    if (role === 9) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-xs">Captain</Badge>
    } else if (role === 10) {
      return <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">Vice Captain</Badge>
    } else if (role === 11) {
      return <Badge variant="secondary" className="text-xs">Player</Badge>
    }
    return <span className="text-muted-foreground text-xs">-</span>
  }

  // Image handling functions
  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setImageFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setImagePreview(base64String)
        setFormData(prev => ({
          ...prev,
          player_image_base64: base64String,
          player_image_url: ""
        }))
      }
      reader.readAsDataURL(file)

      setSelectedImageTab("upload")
    }
  }

  const removeImageFile = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, player_image_base64: "" }))
  }

  const clearImageUrl = () => {
    setFormData(prev => ({ ...prev, player_image_url: "" }))
  }

  const handleImageTabChange = (tab: "upload" | "url") => {
    setSelectedImageTab(tab)
    if (tab === "url") {
      setImageFile(null)
      setImagePreview(null)
      setFormData(prev => ({ ...prev, player_image_base64: "" }))
    } else {
      setFormData(prev => ({ ...prev, player_image_url: "" }))
    }
  }

  // Handle save player
  const handleSave = async () => {
    if (!formData.player_name.trim()) {
      toast.error('Player name is required')
      return
    }
    if (!formData.sport_id) {
      toast.error('Sport is required')
      return
    }
    if (!formData.league_id) {
      toast.error('League is required')
      return
    }
    if (!formData.team_id) {
      toast.error('Team is required')
      return
    }
    if (!formData.primary_position_id) {
      toast.error('Primary position is required')
      return
    }
    if (!formData.current_price || parseFloat(formData.current_price) <= 0) {
      toast.error('Valid current price is required')
      return
    }

    try {
      setIsSaving(true)

      const playerData: any = {
        player_name: formData.player_name.trim(),
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        sport_id: parseInt(formData.sport_id),
        team_id: parseInt(formData.team_id),
        league_id: parseInt(formData.league_id),
        primary_position_id: parseInt(formData.primary_position_id),
        player_type: formData.player_type || null,
        player_role: formData.player_role ? parseInt(formData.player_role) : null,
        secondary_positions: formData.secondary_positions,
        current_price: parseFloat(formData.current_price),
        total_points: parseInt(formData.total_points) || 0,
        form: formData.form ? parseFloat(formData.form) : null,
        selected_by_percent: parseInt(formData.selected_by_percent) || 0,
        availability_status: formData.availability_status,
        news_update: formData.news_update.trim() || null,
        is_multi_position: formData.is_multi_position,
        is_active: formData.is_active,
      }

      // Handle image
      if (selectedImageTab === "upload" && formData.player_image_base64) {
        playerData.player_image_base64 = formData.player_image_base64
        playerData.player_image_url = null
      } else if (selectedImageTab === "url" && formData.player_image_url) {
        playerData.player_image_url = formData.player_image_url
        playerData.player_image_base64 = null
      } else {
        playerData.player_image_url = null
        playerData.player_image_base64 = null
      }

      if (editingPlayer) {
        const { error } = await supabase
          .from('players')
          .update(playerData)
          .eq('player_id', editingPlayer.player_id)

        if (error) throw error
        toast.success('Player updated successfully')
      } else {
        const { error } = await supabase
          .from('players')
          .insert([playerData])

        if (error) throw error
        toast.success('Player created successfully')
      }

      setIsDialogOpen(false)
      setImageFile(null)
      setImagePreview(null)
      setSelectedImageTab("url")
      fetchAllData()
    } catch (error: any) {
      console.error('Error saving player:', error)
      toast.error(error.message || 'Failed to save player')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete player
  const handleDelete = async (playerId: number) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('player_id', playerId)

      if (error) throw error
      toast.success('Player deleted successfully')
      fetchAllData()
    } catch (error: any) {
      console.error('Error deleting player:', error)
      toast.error(error.message || 'Failed to delete player')
    }
  }

  // Handle edit player
  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      player_name: player.player_name || "",
      first_name: player.first_name || "",
      last_name: player.last_name || "",
      jersey_number: player.jersey_number?.toString() || "",
      sport_id: player.sport_id?.toString() || "",
      team_id: player.team_id?.toString() || "",
      league_id: player.league_id?.toString() || "",
      primary_position_id: player.primary_position_id?.toString() || "",
      player_type: player.player_type || "",
      player_role: player.player_role?.toString() || null,
      secondary_positions: player.secondary_positions || [],
      current_price: player.current_price?.toString() || "",
      total_points: player.total_points?.toString() || "0",
      form: player.form?.toString() || "",
      selected_by_percent: player.selected_by_percent?.toString() || "0",
      availability_status: player.availability_status || "available",
      news_update: player.news_update || "",
      is_multi_position: player.is_multi_position || false,
      is_active: player.is_active || true,
      player_image_url: player.player_image_url || "",
      player_image_base64: player.player_image_base64 || "",
    })

    if (player.player_image_base64) {
      setImagePreview(player.player_image_base64)
      setSelectedImageTab("upload")
      setImageFile(null)
    } else if (player.player_image_url) {
      setImagePreview(player.player_image_url)
      setSelectedImageTab("url")
    } else {
      setImagePreview(null)
      setSelectedImageTab("url")
    }

    setIsDialogOpen(true)
  }

  // Get player image URL for display
  const getPlayerImageUrl = (player: Player) => {
    if (player.player_image_base64) {
      return player.player_image_base64
    }
    if (player.player_image_url) {
      return player.player_image_url
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(player.player_name)}&background=666&color=fff&size=128`
  }

  // Reset league and team filters when sport changes
  useEffect(() => {
    setSelectedLeague("all")
    setSelectedTeam("all")
  }, [selectedSport])

  // Reset team filter when league changes
  useEffect(() => {
    setSelectedTeam("all")
  }, [selectedLeague])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading players...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Players Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage players, prices, and availability</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPlayer(null)
              setFormData({
                player_name: "",
                first_name: "",
                last_name: "",
                jersey_number: "",
                sport_id: "",
                team_id: "",
                league_id: "",
                primary_position_id: "",
                player_type: "",
                player_role: null,
                secondary_positions: [],
                current_price: "",
                total_points: "0",
                form: "",
                selected_by_percent: "0",
                availability_status: "available",
                news_update: "",
                is_multi_position: false,
                is_active: true,
                player_image_url: "",
                player_image_base64: "",
              })
              setImageFile(null)
              setImagePreview(null)
              setSelectedImageTab("url")
              setIsDialogOpen(true)
            }} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
              <DialogDescription>
                {editingPlayer ? "Update the player details below." : "Add a new player to your platform."}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="stats">Statistics & Status</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  {/* Player Image */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Player Image</Label>
                    <Tabs value={selectedImageTab} onValueChange={(value) => handleImageTabChange(value as "upload" | "url")} className="w-full">
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
                            <Label htmlFor="image-upload">Select Player Image</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileSelect}
                                className="cursor-pointer"
                              />
                              {(imageFile || formData.player_image_base64) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={removeImageFile}
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
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Player preview"
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="text-muted-foreground text-center p-4">
                                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-xs">No image selected</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label htmlFor="player-image-url">Image URL</Label>
                            <Input
                              id="player-image-url"
                              placeholder="https://example.com/player-image.jpg"
                              value={formData.player_image_url}
                              onChange={(e) => setFormData({ ...formData, player_image_url: e.target.value })}
                            />
                          </div>
                          {formData.player_image_url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={clearImageUrl}
                              className="mt-6 h-10 w-10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-start gap-4 mt-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-2">
                              Use a direct image URL. For popular players:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• Example: https://resources.premierleague.com/premierleague/photos/players/250x250/p165153.png</li>
                              <li>• Try searching on transfermarkt.com or official club websites</li>
                            </ul>
                          </div>
                          {formData.player_image_url && (
                            <div className="flex-shrink-0">
                              <Label className="text-xs">URL Preview</Label>
                              <div className="mt-1 h-20 w-20 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                <img
                                  src={formData.player_image_url}
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

                  {/* Player Names */}
                  <div className="space-y-2">
                    <Label htmlFor="player-name">Player Name *</Label>
                    <Input
                      id="player-name"
                      placeholder="e.g., Mohamed Salah"
                      value={formData.player_name}
                      onChange={(e) => setFormData({...formData, player_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  {/* Jersey Number */}
                  <div className="space-y-2">
                    <Label htmlFor="jersey-number">Jersey Number</Label>
                    <Input
                      id="jersey-number"
                      type="number"
                      min="0"
                      max="99"
                      placeholder="e.g., 11"
                      value={formData.jersey_number}
                      onChange={(e) => setFormData({...formData, jersey_number: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      placeholder="Mohamed"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      placeholder="Salah"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>

                  {/* Sport Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport *</Label>
                    <Select
                      value={formData.sport_id || ""}
                      onValueChange={(value) => setFormData({...formData, sport_id: value, player_type: ""})}
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

                  {/* Player Role */}
                  <div className="space-y-2">
                    <Label htmlFor="player-role">Role</Label>
                    <Select
                      value={formData.player_role || "none"}
                      onValueChange={(value) => setFormData({...formData, player_role: value === "none" ? null : value})}
                    >
                      <SelectTrigger id="player-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Special Role</SelectItem>
                        <SelectItem value="9">Captain</SelectItem>
                        <SelectItem value="10">Vice Captain</SelectItem>
                        <SelectItem value="11">Player</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* League Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="league">League</Label>
                    <Select
                      value={formData.league_id || ""}
                      onValueChange={(value) => setFormData({...formData, league_id: value, team_id: ""})}
                      disabled={!formData.sport_id}
                    >
                      <SelectTrigger id="league">
                        <SelectValue placeholder="Select league" />
                      </SelectTrigger>
                      <SelectContent>
                        {leagues
                          .filter(league => league.sport_id?.toString() === formData.sport_id)
                          .map((league) => (
                            <SelectItem key={league.league_id} value={league.league_id.toString()}>
                              {league.league_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="team">Team *</Label>
                    <Select
                      value={formData.team_id || ""}
                      onValueChange={(value) => setFormData({...formData, team_id: value})}
                      disabled={!formData.league_id}
                    >
                      <SelectTrigger id="team">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams
                          .filter(team => team.league_id?.toString() === formData.league_id)
                          .map((team) => (
                            <SelectItem key={team.team_id} value={team.team_id.toString()}>
                              {team.team_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Primary Position */}
                  <div className="space-y-2">
                    <Label htmlFor="primary-position">Primary Position *</Label>
                    <Select
                      value={formData.primary_position_id || ""}
                      onValueChange={(value) => setFormData({...formData, primary_position_id: value})}
                      disabled={!formData.sport_id}
                    >
                      <SelectTrigger id="primary-position">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions
                          .filter(position => {
                            if (position.sport_id?.toString() !== formData.sport_id) {
                              return false;
                            }
                            if (formData.sport_id === "1") {
                              return [1, 2, 3, 4].includes(position.position_id);
                            } else if (formData.sport_id === "2") {
                              return [5, 6, 7, 8].includes(position.position_id);
                            }
                            return true;
                          })
                          .map((position) => (
                            <SelectItem key={position.position_id} value={position.position_id.toString()}>
                              {position.position_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  {/* Price and Points */}
                  <div className="space-y-2">
                    <Label htmlFor="current-price">Current Price (M) *</Label>
                    <Input
                      id="current-price"
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={formData.current_price}
                      onChange={(e) => setFormData({...formData, current_price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-points">Total Points</Label>
                    <Input
                      id="total-points"
                      type="number"
                      placeholder="0"
                      value={formData.total_points}
                      onChange={(e) => setFormData({...formData, total_points: e.target.value})}
                    />
                  </div>
              
                  {/* Availability Status */}
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability Status</Label>
                    <Select
                      value={formData.availability_status || "available"}
                      onValueChange={(value: Player['availability_status']) => setFormData({...formData, availability_status: value})}
                    >
                      <SelectTrigger id="availability">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="injured">Injured</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="doubtful">Doubtful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="active-status">Active Status</Label>
                      <Switch
                        id="active-status"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                    </div>
                  </div>

                  {/* News Update */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="news-update">News/Status Update</Label>
                    <Textarea
                      id="news-update"
                      placeholder="Injury updates, transfer news, or other status information"
                      value={formData.news_update}
                      onChange={(e) => setFormData({...formData, news_update: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false)
                setImageFile(null)
                setImagePreview(null)
                setFormData(prev => ({ ...prev, player_image_base64: "" }))
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : editingPlayer ? "Update Player" : "Create Player"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-lg lg:text-xl">All Players ({filteredPlayers.length})</CardTitle>
            
            {/* Mobile Filters Button */}
            <div className="block lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Desktop Filters - IMPROVED LAYOUT */}
            <div className="hidden lg:flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* League Filter Dropdown */}
                <div className="flex-1 min-w-[180px] max-w-[220px]">
                  <Select
                    value={selectedLeague}
                    onValueChange={setSelectedLeague}
                  >
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Leagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leagues</SelectItem>
                      {getFilteredLeagues().map((league) => (
                        <SelectItem 
                          key={league.league_id} 
                          value={league.league_id.toString()}
                          disabled={selectedSport !== "all" && league.sport_id?.toString() !== selectedSport}
                        >
                          {league.league_name}
                          {selectedSport === "all" && league.sport_name && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({league.sport_name})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Team Filter Dropdown */}
                <div className="flex-1 min-w-[180px] max-w-[220px]">
                  <Select
                    value={selectedTeam}
                    onValueChange={setSelectedTeam}
                  >
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {getFilteredTeams().map((team) => {
                        const league = leagues.find(l => l.league_id === team.league_id)
                        return (
                          <SelectItem 
                            key={team.team_id} 
                            value={team.team_id.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="truncate">{team.team_name}</span>
                              {league && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {league.league_name}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Filters Dropdown */}
          {isMobileFiltersOpen && (
            <div className="mt-4 lg:hidden space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    value={selectedLeague}
                    onValueChange={setSelectedLeague}
                  >
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Leagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leagues</SelectItem>
                      {getFilteredLeagues().map((league) => (
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
                
                <div>
                  <Select
                    value={selectedTeam}
                    onValueChange={setSelectedTeam}
                  >
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {getFilteredTeams().map((team) => (
                        <SelectItem 
                          key={team.team_id} 
                          value={team.team_id.toString()}
                        >
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Sport Filter Tabs - FIXED to prevent overflow */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 max-w-full">
              <Button
                variant={selectedSport === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport("all")}
                className="flex-shrink-0"
              >
                All Sports
              </Button>
              {sports.map((sport) => (
                <Button
                  key={sport.sport_id}
                  variant={selectedSport === sport.sport_id.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport(sport.sport_id.toString())}
                  className="flex-shrink-0"
                >
                  {sport.sport_name}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery || selectedSport !== "all" || selectedLeague !== "all" || selectedTeam !== "all"
                    ? 'No players found' 
                    : 'No players available'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Try a different search term'
                    : selectedSport !== "all" || selectedLeague !== "all" || selectedTeam !== "all"
                      ? 'No players match your filters. Try changing your selection.'
                      : 'Add your first player using the "Add Player" button'
                  }
                </p>
                {(selectedSport !== "all" || selectedLeague !== "all" || selectedTeam !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedSport("all")
                      setSelectedLeague("all")
                      setSelectedTeam("all")
                      setSearchQuery("")
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                {/* Desktop Table - ALL COLUMNS RESTORED */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-20">Jersey</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="w-24">League</TableHead>
                        <TableHead className="w-24">Sport</TableHead>
                        <TableHead className="w-28">Position</TableHead>
                        <TableHead className="w-24">Role</TableHead>
                        <TableHead className="w-24">Price</TableHead>
                        <TableHead className="w-20">Points</TableHead>
                        <TableHead className="w-28">Availability</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="w-28 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.player_id}>
                          <TableCell>
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              <img
                                src={getPlayerImageUrl(player)}
                                alt={player.player_name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                  e.currentTarget.classList.add("opacity-50");
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold">{player.player_name}</span>
                              {player.first_name && player.last_name && (
                                <span className="text-xs text-muted-foreground">
                                  {player.first_name} {player.last_name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {player.jersey_number ? (
                              <Badge variant="outline" className="font-mono text-xs px-2">
                                #{player.jersey_number}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{player.team_name || 'Unknown'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {player.league_code || player.league_name || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                             {player.sport_name || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {player.position_name ? (
                              <Badge variant="outline" className="text-xs capitalize">
                                {player.position_name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {/* FIXED: Type now accepts undefined */}
                            {getPlayerRoleBadge(player.player_role)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-semibold">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span>{player.current_price?.toFixed(1) || '0.0'}M</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {player.total_points || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAvailabilityBadge(player.availability_status)} className="text-xs capitalize">
                              {player.availability_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {player.is_active ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50"
                                onClick={() => handleEdit(player)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50"
                                onClick={() => handleDelete(player.player_id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View - FIXED: Added action buttons */}
                <div className="lg:hidden space-y-3 p-3">
                  {filteredPlayers.map((player) => (
                    <div key={player.player_id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            <img
                              src={getPlayerImageUrl(player)}
                              alt={player.player_name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                                e.currentTarget.classList.add("opacity-50");
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{player.player_name}</h3>
                            {player.first_name && player.last_name && (
                              <p className="text-sm text-muted-foreground">
                                {player.first_name} {player.last_name}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Mobile Action Buttons */}
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-50"
                            onClick={() => handleEdit(player)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                            onClick={() => handleDelete(player.player_id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Team</p>
                          <p className="text-sm font-medium">{player.team_name || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Jersey</p>
                          <p className="text-sm font-medium">
                            {player.jersey_number ? `#${player.jersey_number}` : '-'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">League</p>
                          <Badge variant="outline" className="text-xs">
                            {player.league_code || player.league_name || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Sport</p>
                          <Badge variant="secondary" className="text-xs">
                            {player.sport_name || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Position</p>
                          <Badge variant="outline" className="text-xs">
                            {player.position_name || '-'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Role</p>
                          <div className="text-sm">
                            {/* FIXED: Type now accepts undefined */}
                            {getPlayerRoleBadge(player.player_role)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Price</p>
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            {player.current_price?.toFixed(1) || '0.0'}M
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Points</p>
                          <Badge variant="outline" className="text-xs">
                            {player.total_points || 0}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Availability</p>
                          <Badge variant={getAvailabilityBadge(player.availability_status)} className="text-xs capitalize">
                            {player.availability_status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Status</p>
                          {player.is_active ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}