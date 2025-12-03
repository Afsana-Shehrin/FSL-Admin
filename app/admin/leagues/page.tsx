"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Calendar } from "lucide-react"
import { leagues, seasons, sports, type League, type Season } from "@/lib/dummy-data"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LeaguesPage() {
  const [leaguesList, setLeaguesList] = useState<League[]>(leagues)
  const [seasonsList, setSeasonsList] = useState<Season[]>(seasons)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLeagueDialogOpen, setIsLeagueDialogOpen] = useState(false)
  const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false)
  const [editingLeague, setEditingLeague] = useState<League | null>(null)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>("all")

  const [leagueFormData, setLeagueFormData] = useState({
    name: "",
    sportId: "",
    description: "",
    isActive: true,
  })

  const [seasonFormData, setSeasonFormData] = useState({
    leagueId: "",
    name: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })

  const filteredLeagues = leaguesList.filter((league) => {
    const matchesSearch = league.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = selectedSport === "all" || league.sportId === selectedSport
    return matchesSearch && matchesSport
  })

  const filteredSeasons = seasonsList.filter((season) => {
    const league = leaguesList.find((l) => l.id === season.leagueId)
    if (!league) return false
    return selectedSport === "all" || league.sportId === selectedSport
  })

  const handleEditLeague = (league: League) => {
    setEditingLeague(league)
    setLeagueFormData({
      name: league.name,
      sportId: league.sportId,
      description: league.description,
      isActive: league.isActive,
    })
    setIsLeagueDialogOpen(true)
  }

  const handleCreateLeague = () => {
    setEditingLeague(null)
    setLeagueFormData({
      name: "",
      sportId: "",
      description: "",
      isActive: true,
    })
    setIsLeagueDialogOpen(true)
  }

  const handleSaveLeague = () => {
    if (editingLeague) {
      setLeaguesList(leaguesList.map((l) => (l.id === editingLeague.id ? { ...l, ...leagueFormData } : l)))
    } else {
      const newLeague: League = {
        id: String(leaguesList.length + 1),
        ...leagueFormData,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setLeaguesList([...leaguesList, newLeague])
    }
    setIsLeagueDialogOpen(false)
  }

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season)
    setSeasonFormData({
      leagueId: season.leagueId,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
    })
    setIsSeasonDialogOpen(true)
  }

  const handleCreateSeason = () => {
    setEditingSeason(null)
    setSeasonFormData({
      leagueId: "",
      name: "",
      startDate: "",
      endDate: "",
      isActive: true,
    })
    setIsSeasonDialogOpen(true)
  }

  const handleSaveSeason = () => {
    if (editingSeason) {
      setSeasonsList(seasonsList.map((s) => (s.id === editingSeason.id ? { ...s, ...seasonFormData } : s)))
    } else {
      const newSeason: Season = {
        id: String(seasonsList.length + 1),
        ...seasonFormData,
      }
      setSeasonsList([...seasonsList, newSeason])
    }
    setIsSeasonDialogOpen(false)
  }

  const getSportName = (sportId: string) => {
    return sports.find((s) => s.id === sportId)?.name || "Unknown"
  }

  const getLeagueName = (leagueId: string) => {
    return leaguesList.find((l) => l.id === leagueId)?.name || "Unknown"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leagues & Seasons</h1>
          <p className="text-muted-foreground">Manage leagues and their seasons</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedSport === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport("all")}
              className="whitespace-nowrap"
            >
              All Sports
            </Button>
            {sports
              .filter((sport) => sport.isActive)
              .map((sport) => (
                <Button
                  key={sport.id}
                  variant={selectedSport === sport.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport(sport.id)}
                  className="whitespace-nowrap"
                >
                  {sport.icon} {sport.name}
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leagues" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="leagues" className="flex-1 sm:flex-none">
            Leagues
          </TabsTrigger>
          <TabsTrigger value="seasons" className="flex-1 sm:flex-none">
            Seasons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leagues" className="space-y-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="league-name">League Name</Label>
                    <Input
                      id="league-name"
                      placeholder="e.g., Premier League"
                      value={leagueFormData.name}
                      onChange={(e) => setLeagueFormData({ ...leagueFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport</Label>
                    <Select
                      value={leagueFormData.sportId}
                      onValueChange={(value) => setLeagueFormData({ ...leagueFormData, sportId: value })}
                    >
                      <SelectTrigger id="sport">
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {sports.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id}>
                            {sport.icon} {sport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="League description"
                      value={leagueFormData.description}
                      onChange={(e) => setLeagueFormData({ ...leagueFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="league-active">Active Status</Label>
                    <Switch
                      id="league-active"
                      checked={leagueFormData.isActive}
                      onCheckedChange={(checked) => setLeagueFormData({ ...leagueFormData, isActive: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLeagueDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveLeague}>{editingLeague ? "Update" : "Create"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Leagues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeagues.map((league) => (
                      <TableRow key={league.id}>
                        <TableCell className="font-medium">{league.name}</TableCell>
                        <TableCell>{getSportName(league.sportId)}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">{league.description}</TableCell>
                        <TableCell>
                          <Badge variant={league.isActive ? "default" : "secondary"}>
                            {league.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{league.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditLeague(league)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLeaguesList(leaguesList.filter((l) => l.id !== league.id))}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isSeasonDialogOpen} onOpenChange={setIsSeasonDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateSeason} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Season
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingSeason ? "Edit Season" : "Add New Season"}</DialogTitle>
                  <DialogDescription>
                    {editingSeason ? "Update the season details below." : "Add a new season to a league."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="season-league">League</Label>
                    <Select
                      value={seasonFormData.leagueId}
                      onValueChange={(value) => setSeasonFormData({ ...seasonFormData, leagueId: value })}
                    >
                      <SelectTrigger id="season-league">
                        <SelectValue placeholder="Select league" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaguesList.map((league) => (
                          <SelectItem key={league.id} value={league.id}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season-name">Season Name</Label>
                    <Input
                      id="season-name"
                      placeholder="e.g., 2024/25 Season"
                      value={seasonFormData.name}
                      onChange={(e) => setSeasonFormData({ ...seasonFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={seasonFormData.startDate}
                      onChange={(e) => setSeasonFormData({ ...seasonFormData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={seasonFormData.endDate}
                      onChange={(e) => setSeasonFormData({ ...seasonFormData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="season-active">Active Status</Label>
                    <Switch
                      id="season-active"
                      checked={seasonFormData.isActive}
                      onCheckedChange={(checked) => setSeasonFormData({ ...seasonFormData, isActive: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSeasonDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSeason}>{editingSeason ? "Update" : "Create"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Seasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Season</TableHead>
                      <TableHead>League</TableHead>
                      <TableHead className="hidden md:table-cell">Start Date</TableHead>
                      <TableHead className="hidden md:table-cell">End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeasons.map((season) => (
                      <TableRow key={season.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {season.name}
                          </div>
                        </TableCell>
                        <TableCell>{getLeagueName(season.leagueId)}</TableCell>
                        <TableCell className="hidden md:table-cell">{season.startDate}</TableCell>
                        <TableCell className="hidden md:table-cell">{season.endDate}</TableCell>
                        <TableCell>
                          <Badge variant={season.isActive ? "default" : "secondary"}>
                            {season.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSeason(season)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSeasonsList(seasonsList.filter((s) => s.id !== season.id))}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
