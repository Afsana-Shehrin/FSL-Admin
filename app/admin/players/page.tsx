"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, DollarSign } from "lucide-react"
import { players, teams, sports, type Player } from "@/lib/dummy-data"
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

export default function PlayersPage() {
  const [playersList, setPlayersList] = useState<Player[]>(players)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    teamId: "",
    sportId: "",
    position: "",
    price: 0,
    availability: "available" as Player["availability"],
    news: "",
    photo: "",
  })

  const filteredPlayers = playersList.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.position.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSport = selectedSport === "all" || player.sportId === selectedSport

    return matchesSearch && matchesSport
  })

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      teamId: player.teamId,
      sportId: player.sportId,
      position: player.position,
      price: player.price,
      availability: player.availability,
      news: player.news,
      photo: player.photo,
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingPlayer(null)
    setFormData({
      name: "",
      teamId: "",
      sportId: "",
      position: "",
      price: 0,
      availability: "available",
      news: "",
      photo: "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingPlayer) {
      setPlayersList(
        playersList.map((p) => (p.id === editingPlayer.id ? { ...p, ...formData, stats: editingPlayer.stats } : p)),
      )
    } else {
      const newPlayer: Player = {
        id: String(playersList.length + 1),
        ...formData,
        stats: {},
      }
      setPlayersList([...playersList, newPlayer])
    }
    setIsDialogOpen(false)
  }

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown"
  }

  const getSportName = (sportId: string) => {
    return sports.find((s) => s.id === sportId)?.name || "Unknown"
  }

  const getAvailabilityBadge = (availability: Player["availability"]) => {
    const variants = {
      available: "default",
      injured: "destructive",
      suspended: "destructive",
      doubtful: "secondary",
    } as const
    return variants[availability] || "default"
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Players Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage players, prices, and availability</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
              <DialogDescription>
                {editingPlayer ? "Update the player details below." : "Add a new player to your platform."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  placeholder="e.g., Mohamed Salah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-position">Position</Label>
                <Input
                  id="player-position"
                  placeholder="e.g., Forward"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-sport">Sport</Label>
                <Select
                  value={formData.sportId}
                  onValueChange={(value) => setFormData({ ...formData, sportId: value })}
                >
                  <SelectTrigger id="player-sport">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports
                      .filter((sport) => sport.name === "Football" || sport.name === "Cricket")
                      .map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.icon} {sport.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-team">Team</Label>
                <Select value={formData.teamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })}>
                  <SelectTrigger id="player-team">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-price">Price (M)</Label>
                <Input
                  id="player-price"
                  type="number"
                  step="0.1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-availability">Availability</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value: Player["availability"]) => setFormData({ ...formData, availability: value })}
                >
                  <SelectTrigger id="player-availability">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="doubtful">Doubtful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-photo">Photo URL</Label>
                <Input
                  id="player-photo"
                  placeholder="/player-photo.jpg"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="player-news">News/Status</Label>
                <Textarea
                  id="player-news"
                  placeholder="Injury updates or other news"
                  value={formData.news}
                  onChange={(e) => setFormData({ ...formData, news: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                {editingPlayer ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Players</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedSport === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport("all")}
            >
              All Sports
            </Button>
            <Button
              variant={selectedSport === "1" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport("1")}
            >
              ⚽ Football
            </Button>
            <Button
              variant={selectedSport === "2" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport("2")}
            >
              🏏 Cricket
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>News</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={player.photo || "/placeholder.svg"}
                        alt={player.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{getTeamName(player.teamId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{player.position}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {player.price.toFixed(1)}M
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getAvailabilityBadge(player.availability)}>{player.availability}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{player.news || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(player)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPlayersList(playersList.filter((p) => p.id !== player.id))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
