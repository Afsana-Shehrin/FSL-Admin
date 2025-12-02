"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { teams, sports, type Team } from "@/lib/dummy-data"
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

export default function TeamsPage() {
  const [teamsList, setTeamsList] = useState<Team[]>(teams)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSportId, setSelectedSportId] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    sportId: "",
    logo: "",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    isActive: true,
  })

  const filteredTeams = teamsList.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = selectedSportId === "all" || team.sportId === selectedSportId
    return matchesSearch && matchesSport
  })

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      code: team.code,
      sportId: team.sportId,
      logo: team.logo,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      isActive: team.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingTeam(null)
    setFormData({
      name: "",
      code: "",
      sportId: "",
      logo: "",
      primaryColor: "#000000",
      secondaryColor: "#FFFFFF",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingTeam) {
      setTeamsList(teamsList.map((t) => (t.id === editingTeam.id ? { ...t, ...formData } : t)))
    } else {
      const newTeam: Team = {
        id: String(teamsList.length + 1),
        ...formData,
      }
      setTeamsList([...teamsList, newTeam])
    }
    setIsDialogOpen(false)
  }

  const getSportName = (sportId: string) => {
    return sports.find((s) => s.id === sportId)?.name || "Unknown"
  }

  const availableSports = sports.filter((sport) => sport.name === "Football" || sport.name === "Cricket")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams Management</h1>
          <p className="text-muted-foreground">Manage teams across all sports</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
              <DialogDescription>
                {editingTeam ? "Update the team details below." : "Add a new team to your platform."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="e.g., Manchester United"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-code">Team Code</Label>
                <Input
                  id="team-code"
                  placeholder="e.g., MUN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-sport">Sport</Label>
                <Select
                  value={formData.sportId}
                  onValueChange={(value) => setFormData({ ...formData, sportId: value })}
                >
                  <SelectTrigger id="team-sport">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.icon} {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-logo">Logo URL</Label>
                <Input
                  id="team-logo"
                  placeholder="/team-logo.png"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-16 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
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
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-16 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between md:col-span-2">
                <Label htmlFor="team-active">Active Status</Label>
                <Switch
                  id="team-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingTeam ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Teams</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 border-b">
            <button
              onClick={() => setSelectedSportId("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                selectedSportId === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Sports
              {selectedSportId === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSportId(sport.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  selectedSportId === sport.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sport.icon} {sport.name}
                {selectedSportId === sport.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      <img src={team.logo || "/placeholder.svg"} alt={team.name} className="h-8 w-8 object-contain" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{team.code}</Badge>
                  </TableCell>
                  <TableCell>{getSportName(team.sportId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <div
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: team.primaryColor }}
                        title={team.primaryColor}
                      />
                      <div
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: team.secondaryColor }}
                        title={team.secondaryColor}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.isActive ? "default" : "secondary"}>
                      {team.isActive ? "Active" : "Inactive"}
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
                        onClick={() => setTeamsList(teamsList.filter((t) => t.id !== team.id))}
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
