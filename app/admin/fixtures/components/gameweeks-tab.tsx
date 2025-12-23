"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, CalendarIcon, Search } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Types based on your table structure
type Gameweek = {
  gameweek_id: number
  season_id: number
  gameweek_number: number
  gameweek_name: string
  deadline_time: string
  start_date: string
  end_date: string
  is_current: boolean
  is_finished: boolean
  average_score: number | null
  highest_score: number | null
  created_at: string
  sport_code?: string
  league_code?: string
  season_name?: string
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

type Season = {
  season_id: number
  season_name: string
  league_id: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  league_code?: string
  sport_code?: string
}

type League = {
  league_id: number
  league_name: string
  league_code: string
  sport_id: number
  country: string
  logo_url: string
  is_active: boolean
  created_at: string
}

export default function GameweeksTab() {
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [isGameweekDialogOpen, setIsGameweekDialogOpen] = useState(false)
  const [editingGameweek, setEditingGameweek] = useState<Gameweek | null>(null)
  const [gameweekSportFilter, setGameweekSportFilter] = useState<string>("all")
  const [selectedSeason, setSelectedSeason] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingLockStatus, setUpdatingLockStatus] = useState<number | null>(null)
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({ all: 0 })

  const [gameweekFormData, setGameweekFormData] = useState({
    season_id: "",
    gameweek_name: "",
    gameweek_number: 0,
    start_date: "",
    end_date: "",
    deadline_time: "",
    is_current: false,
    is_finished: false,
  })

  // Calculate sport counts based on current filters
  useEffect(() => {
    if (gameweeks.length > 0) {
      const filtered = filterGameweeks(gameweeks)
      const counts: Record<string, number> = { all: filtered.length }
      
      sports.forEach(sport => {
        const sportGameweeks = filtered.filter(gw => gw.sport_code === sport.sport_code)
        counts[sport.sport_code] = sportGameweeks.length
      })
      
      setSportCounts(counts)
    }
  }, [gameweeks, searchQuery, selectedSeason, gameweekSportFilter, sports])

  // Fetch data from Supabase
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch gameweeks with related data
      const { data: gameweeksData, error: gameweeksError } = await supabase
        .from('gameweeks')
        .select(`
          *,
          season:season_id (
            season_name,
            league_id,
            league:league_id (
              league_code,
              sport_id,
              sport:sport_id (sport_code)
            )
          )
        `)
        .order('gameweek_number', { ascending: true })

      if (gameweeksError) throw gameweeksError
      
      // Transform the data to include nested fields
      const transformedGameweeks: Gameweek[] = (gameweeksData || []).map((gameweek: { season: { season_name: any; league: { league_code: any; sport: { sport_code: any } } } }) => ({
        ...gameweek,
        season_name: gameweek.season?.season_name,
        league_code: gameweek.season?.league?.league_code,
        sport_code: gameweek.season?.league?.sport?.sport_code
      }))

      setGameweeks(transformedGameweeks)

      // Fetch other data for the form
      const [seasonsData, leaguesData, sportsData] = await Promise.all([
        supabase
          .from('seasons')
          .select('*')
          .order('start_date', { ascending: false }),
        supabase
          .from('leagues')
          .select('*')
          .order('league_name'),
        supabase
          .from('sports')
          .select('*')
          .order('display_order')
      ])

      if (seasonsData.error) throw seasonsData.error
      if (leaguesData.error) throw leaguesData.error
      if (sportsData.error) throw sportsData.error

      setSeasons(seasonsData.data || [])
      setLeagues(leaguesData.data || [])
      setSports(sportsData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterGameweeks = (gameweeksList: Gameweek[]) => {
    return gameweeksList.filter((gameweek) => {
      // Apply sport filter
      const matchesSport = gameweekSportFilter === "all" || gameweek.sport_code === gameweekSportFilter
      
      // Apply season filter
      const matchesSeason = selectedSeason === "all" || gameweek.season_id.toString() === selectedSeason
      
      // Apply search filter
      const matchesSearch = searchQuery === "" || 
        gameweek.gameweek_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gameweek.season_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gameweek.league_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `GW${gameweek.gameweek_number}`.includes(searchQuery)

      return matchesSport && matchesSeason && matchesSearch
    })
  }

  const handleEditGameweek = (gameweek: Gameweek) => {
    setEditingGameweek(gameweek)
    setGameweekFormData({
      season_id: gameweek.season_id.toString(),
      gameweek_name: gameweek.gameweek_name || "",
      gameweek_number: gameweek.gameweek_number,
      start_date: gameweek.start_date,
      end_date: gameweek.end_date,
      deadline_time: new Date(gameweek.deadline_time).toISOString().slice(0, 16),
      is_current: gameweek.is_current,
      is_finished: gameweek.is_finished,
    })
    setIsGameweekDialogOpen(true)
  }

  const handleCreateGameweek = () => {
    setEditingGameweek(null)
    setGameweekFormData({
      season_id: "",
      gameweek_name: "",
      gameweek_number: 0,
      start_date: "",
      end_date: "",
      deadline_time: "",
      is_current: false,
      is_finished: false,
    })
    setIsGameweekDialogOpen(true)
  }

  const handleSaveGameweek = async () => {
    try {
      // Validate form data
      if (!gameweekFormData.season_id) {
        alert("Please select a season")
        return
      }

      if (!gameweekFormData.gameweek_number || gameweekFormData.gameweek_number <= 0) {
        alert("Please enter a valid gameweek number")
        return
      }

      if (!gameweekFormData.deadline_time) {
        alert("Please set a deadline time")
        return
      }

      if (!gameweekFormData.start_date || !gameweekFormData.end_date) {
        alert("Please set start and end dates")
        return
      }

      const gameweekData = {
        season_id: parseInt(gameweekFormData.season_id),
        gameweek_name: gameweekFormData.gameweek_name || `Gameweek ${gameweekFormData.gameweek_number}`,
        gameweek_number: gameweekFormData.gameweek_number,
        start_date: gameweekFormData.start_date,
        end_date: gameweekFormData.end_date,
        deadline_time: new Date(gameweekFormData.deadline_time).toISOString(),
        is_current: gameweekFormData.is_current,
        is_finished: gameweekFormData.is_finished,
      }

      // Check if this would make multiple current gameweeks
      if (gameweekData.is_current) {
        const { data: currentGameweeks } = await supabase
          .from('gameweeks')
          .select('gameweek_id')
          .eq('is_current', true)
          .neq('gameweek_id', editingGameweek?.gameweek_id || 0)

        if (currentGameweeks && currentGameweeks.length > 0) {
          const confirmMessage = "There is already a current gameweek. Setting this as current will unset the others. Continue?"
          if (!confirm(confirmMessage)) {
            return
          }
          
          // Unset other current gameweeks
          await supabase
            .from('gameweeks')
            .update({ is_current: false })
            .eq('is_current', true)
        }
      }

      if (editingGameweek) {
        const { error } = await supabase
          .from('gameweeks')
          .update(gameweekData)
          .eq('gameweek_id', editingGameweek.gameweek_id)
        
        if (error) throw error
      } else {
        // Check for duplicate gameweek number in same season
        const { data: existingGameweek } = await supabase
          .from('gameweeks')
          .select('gameweek_id')
          .eq('season_id', gameweekData.season_id)
          .eq('gameweek_number', gameweekData.gameweek_number)
          .single()

        if (existingGameweek) {
          alert(`Gameweek ${gameweekData.gameweek_number} already exists for this season`)
          return
        }

        const { error } = await supabase
          .from('gameweeks')
          .insert([gameweekData])
        
        if (error) throw error
      }

      setIsGameweekDialogOpen(false)
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error saving gameweek:', error)
      alert('Error saving gameweek. Please try again.')
    }
  }

  const handleToggleLockStatus = async (gameweek: Gameweek) => {
    try {
      setUpdatingLockStatus(gameweek.gameweek_id)
      
      const newLockStatus = !gameweek.is_finished
      
      const confirmMessage = newLockStatus 
        ? "Are you sure you want to lock this gameweek? Locked gameweeks cannot be edited."
        : "Are you sure you want to unlock this gameweek?"
      
      if (!confirm(confirmMessage)) {
        setUpdatingLockStatus(null)
        return
      }

      const { error } = await supabase
        .from('gameweeks')
        .update({ is_finished: newLockStatus })
        .eq('gameweek_id', gameweek.gameweek_id)
      
      if (error) throw error

      // Update local state immediately for better UX
      setGameweeks(prev => prev.map(gw => 
        gw.gameweek_id === gameweek.gameweek_id 
          ? { ...gw, is_finished: newLockStatus }
          : gw
      ))
    } catch (error) {
      console.error('Error toggling lock status:', error)
      alert('Error updating lock status')
    } finally {
      setUpdatingLockStatus(null)
    }
  }

  const handleSetCurrent = async (gameweek: Gameweek) => {
    try {
      if (gameweek.is_current) {
        // Unset as current
        const confirmMessage = "Are you sure you want to unset this as current gameweek?"
        if (!confirm(confirmMessage)) return
        
        const { error } = await supabase
          .from('gameweeks')
          .update({ is_current: false })
          .eq('gameweek_id', gameweek.gameweek_id)
        
        if (error) throw error
      } else {
        // Set as current
        const confirmMessage = "Setting this as current gameweek will unset any other current gameweeks. Continue?"
        if (!confirm(confirmMessage)) return

        // First, unset all current gameweeks
        await supabase
          .from('gameweeks')
          .update({ is_current: false })
          .eq('is_current', true)

        // Then set this one as current
        const { error } = await supabase
          .from('gameweeks')
          .update({ is_current: true })
          .eq('gameweek_id', gameweek.gameweek_id)
        
        if (error) throw error
      }

      fetchData()
    } catch (error) {
      console.error('Error setting current gameweek:', error)
      alert('Error updating current gameweek status')
    }
  }

  const filteredGameweeks = filterGameweeks(gameweeks)

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading gameweeks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-4">
        {/* Sport Filter Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>All Gameweeks</CardTitle>
            <div className="flex gap-2 mt-4 border-b overflow-x-auto">
              <button
                onClick={() => setGameweekSportFilter("all")}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  gameweekSportFilter === "all"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Sports ({sportCounts.all || 0})
              </button>
              {sports.map((sport) => (
                <button
                  key={sport.sport_id}
                  onClick={() => setGameweekSportFilter(sport.sport_code)}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    gameweekSportFilter === sport.sport_code
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sport.sport_name} ({sportCounts[sport.sport_code] || 0})
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search gameweeks..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Season Filter */}
                <div className="w-full md:w-64">
                  <Select
                    value={selectedSeason}
                    onValueChange={setSelectedSeason}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seasons</SelectItem>
                      {seasons.map((season) => (
                        <SelectItem key={season.season_id} value={season.season_id.toString()}>
                          {season.season_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Gameweek Button */}
              <Dialog open={isGameweekDialogOpen} onOpenChange={setIsGameweekDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreateGameweek} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Gameweek
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingGameweek ? "Edit Gameweek" : "Add New Gameweek"}</DialogTitle>
                    <DialogDescription>
                      {editingGameweek ? "Update the gameweek details below." : "Add a new gameweek to a season."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gameweek-season">Season *</Label>
                      <Select
                        value={gameweekFormData.season_id}
                        onValueChange={(value) => setGameweekFormData({ ...gameweekFormData, season_id: value })}
                        required
                      >
                        <SelectTrigger id="gameweek-season">
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map((season) => (
                            <SelectItem key={season.season_id} value={season.season_id.toString()}>
                              {season.season_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gameweek-number">Gameweek Number *</Label>
                      <Input
                        id="gameweek-number"
                        type="number"
                        min="1"
                        value={gameweekFormData.gameweek_number}
                        onChange={(e) => setGameweekFormData({ ...gameweekFormData, gameweek_number: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gameweek-name">Gameweek Name</Label>
                      <Input
                        id="gameweek-name"
                        placeholder="e.g., Premier League Opening Week"
                        value={gameweekFormData.gameweek_name}
                        onChange={(e) => setGameweekFormData({ ...gameweekFormData, gameweek_name: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to auto-generate: "Gameweek {gameweekFormData.gameweek_number}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gameweek-start">Start Date *</Label>
                      <Input
                        id="gameweek-start"
                        type="date"
                        value={gameweekFormData.start_date}
                        onChange={(e) => setGameweekFormData({ ...gameweekFormData, start_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gameweek-end">End Date *</Label>
                      <Input
                        id="gameweek-end"
                        type="date"
                        value={gameweekFormData.end_date}
                        onChange={(e) => setGameweekFormData({ ...gameweekFormData, end_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gameweek-deadline">Deadline Time *</Label>
                      <Input
                        id="gameweek-deadline"
                        type="datetime-local"
                        value={gameweekFormData.deadline_time}
                        onChange={(e) =>
                          setGameweekFormData({ ...gameweekFormData, deadline_time: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gameweek-current">Set as Current Gameweek</Label>
                        <Switch
                          id="gameweek-current"
                          checked={gameweekFormData.is_current}
                          onCheckedChange={(checked) =>
                            setGameweekFormData({ ...gameweekFormData, is_current: checked })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only one gameweek can be current at a time
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gameweek-finished">Lock Gameweek</Label>
                        <Switch
                          id="gameweek-finished"
                          checked={gameweekFormData.is_finished}
                          onCheckedChange={(checked) =>
                            setGameweekFormData({ ...gameweekFormData, is_finished: checked })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Locked gameweeks cannot be edited
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setIsGameweekDialogOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveGameweek} className="w-full sm:w-auto">
                      {editingGameweek ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Gameweeks Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GW</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>League</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Lock Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGameweeks.length > 0 ? (
                    filteredGameweeks.map((gameweek) => (
                      <TableRow key={gameweek.gameweek_id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            GW{gameweek.gameweek_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{gameweek.gameweek_name || `Gameweek ${gameweek.gameweek_number}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {gameweek.sport_code || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {gameweek.league_code || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{gameweek.season_name || "-"}</span>
                        </TableCell>
                        <TableCell>{formatDate(gameweek.start_date)}</TableCell>
                        <TableCell>{formatDate(gameweek.end_date)}</TableCell>
                        <TableCell>{formatDateTime(gameweek.deadline_time)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {gameweek.is_current ? (
                              <Badge variant="default" className="bg-green-600">
                                Current
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetCurrent(gameweek)}
                                className="h-7 text-xs"
                                disabled={gameweek.is_finished}
                              >
                                Set Current
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={gameweek.is_finished}
                                onCheckedChange={() => handleToggleLockStatus(gameweek)}
                                disabled={updatingLockStatus === gameweek.gameweek_id}
                                className="data-[state=checked]:bg-red-600"
                              />
                              <span className={`text-sm font-medium ${gameweek.is_finished ? 'text-red-600' : 'text-green-600'}`}>
                                {gameweek.is_finished ? 'Locked' : 'Unlocked'}
                              </span>
                            </div>
                            {updatingLockStatus === gameweek.gameweek_id && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditGameweek(gameweek)}
                              disabled={gameweek.is_finished}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this gameweek?')) {
                                  const { error } = await supabase
                                    .from('gameweeks')
                                    .delete()
                                    .eq('gameweek_id', gameweek.gameweek_id)
                                  
                                  if (error) {
                                    console.error('Error deleting gameweek:', error)
                                    alert('Error deleting gameweek')
                                  } else {
                                    fetchData()
                                  }
                                }
                              }}
                              disabled={gameweek.is_finished}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No gameweeks found. Try adjusting your filters or add a new gameweek.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}