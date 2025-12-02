"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, CalendarIcon, Lock } from "lucide-react"
import { fixtures, gameweeks, teams, seasons, type Fixture, type Gameweek } from "@/lib/dummy-data"
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

export default function FixturesPage() {
  const [fixturesList, setFixturesList] = useState<Fixture[]>(fixtures)
  const [gameweeksList, setGameweeksList] = useState<Gameweek[]>(gameweeks)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFixtureDialogOpen, setIsFixtureDialogOpen] = useState(false)
  const [isGameweekDialogOpen, setIsGameweekDialogOpen] = useState(false)
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null)
  const [editingGameweek, setEditingGameweek] = useState<Gameweek | null>(null)
  const [selectedGameweek, setSelectedGameweek] = useState<string | null>(null)

  const [fixtureFormData, setFixtureFormData] = useState({
    gameweekId: "",
    homeTeamId: "",
    awayTeamId: "",
    kickoffTime: "",
    venue: "",
    status: "scheduled" as Fixture["status"],
    homeScore: undefined as number | undefined,
    awayScore: undefined as number | undefined,
  })

  const [gameweekFormData, setGameweekFormData] = useState({
    seasonId: "",
    name: "",
    number: 0,
    startDate: "",
    endDate: "",
    deadline: "",
    status: "upcoming" as Gameweek["status"],
    isLocked: false,
  })

  const handleEditFixture = (fixture: Fixture) => {
    setEditingFixture(fixture)
    setFixtureFormData({
      gameweekId: fixture.gameweekId,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
      kickoffTime: fixture.kickoffTime,
      venue: fixture.venue,
      status: fixture.status,
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
    })
    setIsFixtureDialogOpen(true)
  }

  const handleCreateFixture = () => {
    setEditingFixture(null)
    setFixtureFormData({
      gameweekId: "",
      homeTeamId: "",
      awayTeamId: "",
      kickoffTime: "",
      venue: "",
      status: "scheduled",
      homeScore: undefined,
      awayScore: undefined,
    })
    setIsFixtureDialogOpen(true)
  }

  const handleSaveFixture = () => {
    if (editingFixture) {
      setFixturesList(fixturesList.map((f) => (f.id === editingFixture.id ? { ...f, ...fixtureFormData } : f)))
    } else {
      const newFixture: Fixture = {
        id: String(fixturesList.length + 1),
        ...fixtureFormData,
      }
      setFixturesList([...fixturesList, newFixture])
    }
    setIsFixtureDialogOpen(false)
  }

  const handleEditGameweek = (gameweek: Gameweek) => {
    setEditingGameweek(gameweek)
    setGameweekFormData({
      seasonId: gameweek.seasonId,
      name: gameweek.name,
      number: gameweek.number,
      startDate: gameweek.startDate,
      endDate: gameweek.endDate,
      deadline: gameweek.deadline,
      status: gameweek.status,
      isLocked: gameweek.isLocked,
    })
    setIsGameweekDialogOpen(true)
  }

  const handleCreateGameweek = () => {
    setEditingGameweek(null)
    setGameweekFormData({
      seasonId: "",
      name: "",
      number: 0,
      startDate: "",
      endDate: "",
      deadline: "",
      status: "upcoming",
      isLocked: false,
    })
    setIsGameweekDialogOpen(true)
  }

  const handleSaveGameweek = () => {
    if (editingGameweek) {
      setGameweeksList(gameweeksList.map((g) => (g.id === editingGameweek.id ? { ...g, ...gameweekFormData } : g)))
    } else {
      const newGameweek: Gameweek = {
        id: String(gameweeksList.length + 1),
        ...gameweekFormData,
      }
      setGameweeksList([...gameweeksList, newGameweek])
    }
    setIsGameweekDialogOpen(false)
  }

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown"
  }

  const getGameweekName = (gameweekId: string) => {
    return gameweeksList.find((g) => g.id === gameweekId)?.name || "Unknown"
  }

  const getStatusBadge = (status: Fixture["status"] | Gameweek["status"]) => {
    const variants = {
      scheduled: "secondary",
      upcoming: "secondary",
      live: "default",
      completed: "outline",
      postponed: "destructive",
    } as const
    return variants[status] || "secondary"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixtures & Gameweeks</h1>
          <p className="text-muted-foreground">Manage fixtures, gameweeks, and match schedules</p>
        </div>
      </div>

      <Tabs defaultValue="fixtures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="gameweeks">Gameweeks</TabsTrigger>
        </TabsList>

        <TabsContent value="fixtures" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
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
                <Button onClick={handleCreateFixture}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fixture
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingFixture ? "Edit Fixture" : "Add New Fixture"}</DialogTitle>
                  <DialogDescription>
                    {editingFixture ? "Update the fixture details below." : "Add a new fixture to a gameweek."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fixture-gameweek">Gameweek</Label>
                    <Select
                      value={fixtureFormData.gameweekId}
                      onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, gameweekId: value })}
                    >
                      <SelectTrigger id="fixture-gameweek">
                        <SelectValue placeholder="Select gameweek" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameweeksList.map((gameweek) => (
                          <SelectItem key={gameweek.id} value={gameweek.id}>
                            {gameweek.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fixture-status">Status</Label>
                    <Select
                      value={fixtureFormData.status}
                      onValueChange={(value: Fixture["status"]) =>
                        setFixtureFormData({ ...fixtureFormData, status: value })
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
                    <Label htmlFor="home-team">Home Team</Label>
                    <Select
                      value={fixtureFormData.homeTeamId}
                      onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, homeTeamId: value })}
                    >
                      <SelectTrigger id="home-team">
                        <SelectValue placeholder="Select home team" />
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
                    <Label htmlFor="away-team">Away Team</Label>
                    <Select
                      value={fixtureFormData.awayTeamId}
                      onValueChange={(value) => setFixtureFormData({ ...fixtureFormData, awayTeamId: value })}
                    >
                      <SelectTrigger id="away-team">
                        <SelectValue placeholder="Select away team" />
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
                    <Label htmlFor="kickoff-time">Kickoff Time</Label>
                    <Input
                      id="kickoff-time"
                      type="datetime-local"
                      value={
                        fixtureFormData.kickoffTime
                          ? new Date(fixtureFormData.kickoffTime).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setFixtureFormData({ ...fixtureFormData, kickoffTime: new Date(e.target.value).toISOString() })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      placeholder="Stadium name"
                      value={fixtureFormData.venue}
                      onChange={(e) => setFixtureFormData({ ...fixtureFormData, venue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="home-score">Home Score</Label>
                    <Input
                      id="home-score"
                      type="number"
                      placeholder="Optional"
                      value={fixtureFormData.homeScore ?? ""}
                      onChange={(e) =>
                        setFixtureFormData({
                          ...fixtureFormData,
                          homeScore: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="away-score">Away Score</Label>
                    <Input
                      id="away-score"
                      type="number"
                      placeholder="Optional"
                      value={fixtureFormData.awayScore ?? ""}
                      onChange={(e) =>
                        setFixtureFormData({
                          ...fixtureFormData,
                          awayScore: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFixtureDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFixture}>{editingFixture ? "Update" : "Create"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gameweek</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Kickoff</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixturesList.map((fixture) => (
                    <TableRow key={fixture.id}>
                      <TableCell>{getGameweekName(fixture.gameweekId)}</TableCell>
                      <TableCell className="font-medium">
                        {getTeamName(fixture.homeTeamId)} vs {getTeamName(fixture.awayTeamId)}
                      </TableCell>
                      <TableCell>{new Date(fixture.kickoffTime).toLocaleString()}</TableCell>
                      <TableCell>{fixture.venue}</TableCell>
                      <TableCell>
                        {fixture.homeScore !== undefined && fixture.awayScore !== undefined
                          ? `${fixture.homeScore} - ${fixture.awayScore}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(fixture.status)}>{fixture.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditFixture(fixture)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFixturesList(fixturesList.filter((f) => f.id !== fixture.id))}
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
        </TabsContent>

        <TabsContent value="gameweeks" className="space-y-4">
          <div className="flex items-center justify-end">
            <Dialog open={isGameweekDialogOpen} onOpenChange={setIsGameweekDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateGameweek}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Gameweek
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingGameweek ? "Edit Gameweek" : "Add New Gameweek"}</DialogTitle>
                  <DialogDescription>
                    {editingGameweek ? "Update the gameweek details below." : "Add a new gameweek to a season."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-season">Season</Label>
                    <Select
                      value={gameweekFormData.seasonId}
                      onValueChange={(value) => setGameweekFormData({ ...gameweekFormData, seasonId: value })}
                    >
                      <SelectTrigger id="gameweek-season">
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            {season.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-number">Gameweek Number</Label>
                    <Input
                      id="gameweek-number"
                      type="number"
                      value={gameweekFormData.number}
                      onChange={(e) => setGameweekFormData({ ...gameweekFormData, number: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="gameweek-name">Name</Label>
                    <Input
                      id="gameweek-name"
                      placeholder="e.g., Gameweek 1"
                      value={gameweekFormData.name}
                      onChange={(e) => setGameweekFormData({ ...gameweekFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-start">Start Date</Label>
                    <Input
                      id="gameweek-start"
                      type="date"
                      value={gameweekFormData.startDate}
                      onChange={(e) => setGameweekFormData({ ...gameweekFormData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-end">End Date</Label>
                    <Input
                      id="gameweek-end"
                      type="date"
                      value={gameweekFormData.endDate}
                      onChange={(e) => setGameweekFormData({ ...gameweekFormData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-deadline">Deadline</Label>
                    <Input
                      id="gameweek-deadline"
                      type="datetime-local"
                      value={
                        gameweekFormData.deadline ? new Date(gameweekFormData.deadline).toISOString().slice(0, 16) : ""
                      }
                      onChange={(e) =>
                        setGameweekFormData({ ...gameweekFormData, deadline: new Date(e.target.value).toISOString() })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-status">Status</Label>
                    <Select
                      value={gameweekFormData.status}
                      onValueChange={(value: Gameweek["status"]) =>
                        setGameweekFormData({ ...gameweekFormData, status: value })
                      }
                    >
                      <SelectTrigger id="gameweek-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameweek-locked">Locked</Label>
                    <Select
                      value={String(gameweekFormData.isLocked)}
                      onValueChange={(value) =>
                        setGameweekFormData({ ...gameweekFormData, isLocked: value === "true" })
                      }
                    >
                      <SelectTrigger id="gameweek-locked">
                        <SelectValue placeholder="Select lock status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Locked</SelectItem>
                        <SelectItem value="false">Unlocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGameweekDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveGameweek}>{editingGameweek ? "Update" : "Create"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Gameweeks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameweeksList.map((gameweek) => (
                    <TableRow key={gameweek.id}>
                      <TableCell>
                        <Badge variant="outline">GW{gameweek.number}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {gameweek.name}
                        </div>
                      </TableCell>
                      <TableCell>{gameweek.startDate}</TableCell>
                      <TableCell>{gameweek.endDate}</TableCell>
                      <TableCell>{new Date(gameweek.deadline).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadge(gameweek.status)}>{gameweek.status}</Badge>
                          {gameweek.isLocked && gameweek.status !== "completed" && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditGameweek(gameweek)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setGameweeksList(gameweeksList.filter((g) => g.id !== gameweek.id))}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
