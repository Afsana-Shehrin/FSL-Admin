"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Trophy, AlertCircle, Plus, Search, X } from "lucide-react"
import { fixtures, teams, sports } from "@/lib/dummy-data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

type PlayerStat = {
  playerId: string
  playerName: string
  position: string
  stats: Record<string, any>
}

type CustomPlayer = {
  id: string
  name: string
  position: string
  team: "home" | "away"
}

type MatchResult = {
  id: string
  fixtureId: string
  homeTeamId: string
  awayTeamId: string
  homeScore: number
  awayScore: number
  sportId: string
  kickoffTime: string
  homePlayerStats: PlayerStat[]
  awayPlayerStats: PlayerStat[]
}

export default function ResultsPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)
  const [showAddResultDialog, setShowAddResultDialog] = useState(false)
  const [formStep, setFormStep] = useState<"selectMatch" | "enterScores" | "enterPlayerStats">("selectMatch")
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>("")
  const [homeScore, setHomeScore] = useState<string>("")
  const [awayScore, setAwayScore] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home")
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({})
  const [validationError, setValidationError] = useState<string>("")
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [customPlayers, setCustomPlayers] = useState<CustomPlayer[]>([])
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPosition, setNewPlayerPosition] = useState("")

  useEffect(() => {
    const savedResults = localStorage.getItem("match_results")
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults)
        setMatchResults(parsed)
      } catch (e) {
        console.error("Failed to parse saved results:", e)
      }
    } else {
      setMatchResults([])
    }
  }, [])

  useEffect(() => {
    if (matchResults.length > 0) {
      localStorage.setItem("match_results", JSON.stringify(matchResults))
    } else {
      localStorage.removeItem("match_results")
    }
  }, [matchResults])

  const filteredResults = matchResults
    .filter((result) => {
      if (selectedSport !== "all" && result.sportId !== selectedSport) return false

      if (searchQuery.trim()) {
        const homeTeam = teams.find((t) => t.id === result.homeTeamId)
        const awayTeam = teams.find((t) => t.id === result.awayTeamId)
        const searchLower = searchQuery.toLowerCase()
        return homeTeam?.name.toLowerCase().includes(searchLower) || awayTeam?.name.toLowerCase().includes(searchLower)
      }
      return true
    })
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())

  const getTeam = (teamId: string) => teams.find((t) => t.id === teamId)

  const getSportById = (sportId: string) => sports.find((s) => s.id === sportId)

  const getMatchResult = (result: MatchResult) => {
    const sport = getSportById(result.sportId)
    const homeTeam = getTeam(result.homeTeamId)
    const awayTeam = getTeam(result.awayTeamId)

    if (!homeTeam || !awayTeam) {
      return { summary: "Result unavailable", winner: null }
    }

    if (sport?.name === "Cricket") {
      const margin = Math.abs(result.homeScore - result.awayScore)
      const winner = result.homeScore > result.awayScore ? homeTeam.name : awayTeam.name
      return {
        summary: `${winner} won by ${margin} runs`,
        winner: result.homeScore > result.awayScore ? "home" : "away",
      }
    } else {
      // Football
      const goalDiff = Math.abs(result.homeScore - result.awayScore)
      if (result.homeScore === result.awayScore) {
        return { summary: "Match drawn", winner: "draw" }
      }
      const winner = result.homeScore > result.awayScore ? homeTeam.name : awayTeam.name
      return {
        summary: `${winner} won by ${goalDiff} ${goalDiff === 1 ? "goal" : "goals"}`,
        winner: result.homeScore > result.awayScore ? "home" : "away",
      }
    }
  }

  const getTeamPlayers = (teamId: string, sportId: string) => {
    // Use customPlayers instead of dummy data players
    return customPlayers.filter(
      (p) => p.team === (teamId === getTeam(teamId)?.id ? "home" : "away") && p.id.startsWith("custom_"),
    )
  }

  const calculateFantasyPoints = (playerStat: any, sportName: string) => {
    if (sportName === "Cricket") {
      const runs = playerStat.stats.runs || 0
      const wickets = playerStat.stats.wickets || 0
      const catches = playerStat.stats.catches || 0
      return runs * 1 + wickets * 25 + catches * 8
    } else {
      // Football
      const goals = playerStat.stats.goals || 0
      const assists = playerStat.stats.assists || 0
      const cleanSheets = playerStat.stats.cleanSheets || 0
      return goals * 4 + assists * 3 + cleanSheets * 4
    }
  }

  const toggleMatchDetails = (resultId: string) => {
    setExpandedMatch(expandedMatch === resultId ? null : resultId)
  }

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId)

  const openAddResultDialog = () => {
    setShowAddResultDialog(true)
    setFormStep("selectMatch")
    setSelectedFixtureId("")
    setHomeScore("")
    setAwayScore("")
    setPlayerStats({})
    setValidationError("")
    setSelectedTeam("home")
    setEditingMatchId(null)
    setCustomPlayers([])
    setShowAddPlayerForm(false)
    setNewPlayerName("")
    setNewPlayerPosition("")
  }

  const openEditResultDialog = (matchResult: MatchResult) => {
    setEditingMatchId(matchResult.id)
    setShowAddResultDialog(true)
    setFormStep("selectMatch")
    setSelectedFixtureId(matchResult.fixtureId)
    setHomeScore(matchResult.homeScore.toString())
    setAwayScore(matchResult.awayScore.toString())

    // Pre-populate player stats
    const stats: Record<string, any> = {}
    matchResult.homePlayerStats.forEach((ps) => {
      Object.entries(ps.stats).forEach(([key, value]) => {
        stats[`${ps.playerId}_${key}`] = value
      })
    })
    matchResult.awayPlayerStats.forEach((ps) => {
      Object.entries(ps.stats).forEach(([key, value]) => {
        stats[`${ps.playerId}_${key}`] = value
      })
    })
    setPlayerStats(stats)
    setValidationError("")
    setSelectedTeam("home")
  }

  const proceedToScoreEntry = () => {
    if (!selectedFixtureId) {
      setValidationError("Please select a match first")
      return
    }
    setValidationError("")
    setFormStep("enterScores")
  }

  const proceedToPlayerStats = () => {
    const home = Number.parseInt(homeScore)
    const away = Number.parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setValidationError("Please enter valid scores for both teams")
      return
    }

    setValidationError("")
    setFormStep("enterPlayerStats")
  }

  const addCustomPlayer = () => {
    if (!newPlayerName.trim()) {
      setValidationError("Please enter player name")
      return
    }
    if (!newPlayerPosition.trim()) {
      setValidationError("Please select player position")
      return
    }

    const newPlayer: CustomPlayer = {
      id: `custom_${Date.now()}_${Math.random()}`,
      name: newPlayerName.trim(),
      position: newPlayerPosition,
      team: selectedTeam,
    }

    setCustomPlayers([...customPlayers, newPlayer])
    setNewPlayerName("")
    setNewPlayerPosition("")
    setShowAddPlayerForm(false)
    setValidationError("")
  }

  const removeCustomPlayer = (playerId: string) => {
    setCustomPlayers(customPlayers.filter((p) => p.id !== playerId))
    // Remove stats for this player
    const updatedStats = { ...playerStats }
    Object.keys(updatedStats).forEach((key) => {
      if (key.startsWith(`${playerId}_`)) {
        delete updatedStats[key]
      }
    })
    setPlayerStats(updatedStats)
  }

  const handleSaveMatchResult = () => {
    if (!selectedFixture) return

    const fixture = fixtures.find((f) => f.id === selectedFixtureId)
    if (!fixture) return

    const homeTeam = getTeam(fixture.homeTeamId)
    const awayTeam = getTeam(fixture.awayTeamId)
    const sport = getSportById(homeTeam?.sportId || "")

    const homeTeamScore = Number.parseInt(homeScore)
    const awayTeamScore = Number.parseInt(awayScore)

    const homePlayers = customPlayers.filter((p) => p.team === "home")
    const awayPlayers = customPlayers.filter((p) => p.team === "away")

    // Validate cricket team size
    if (sport?.name === "Cricket") {
      if (homePlayers.length > 11) {
        setValidationError(
          `Home team has ${homePlayers.length} players. Cricket teams can have a maximum of 11 players.`,
        )
        return
      }
      if (awayPlayers.length > 11) {
        setValidationError(
          `Away team has ${awayPlayers.length} players. Cricket teams can have a maximum of 11 players.`,
        )
        return
      }
    }

    // Collect home team stats
    const homePlayerStats: PlayerStat[] = []
    let homeTotalWickets = 0

    for (const player of homePlayers) {
      if (sport?.name === "Cricket") {
        const runs = Number.parseInt(playerStats[`${player.id}_runs`] || "0")
        const ballsFaced = Number.parseInt(playerStats[`${player.id}_ballsFaced`] || "0")
        const wickets = Number.parseInt(playerStats[`${player.id}_wickets`] || "0")
        const catches = Number.parseInt(playerStats[`${player.id}_catches`] || "0")
        const economyRate = Number.parseFloat(playerStats[`${player.id}_economyRate`] || "0")

        homeTotalWickets += wickets

        homePlayerStats.push({
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          stats: { runs, ballsFaced, wickets, catches, economyRate },
        })
      } else {
        // Football
        const goals = Number.parseInt(playerStats[`${player.id}_goals`] || "0")
        const assists = Number.parseInt(playerStats[`${player.id}_assists`] || "0")
        const cleanSheets = Number.parseInt(playerStats[`${player.id}_cleanSheets`] || "0")
        const yellowCards = Number.parseInt(playerStats[`${player.id}_yellowCards`] || "0")
        const redCards = Number.parseInt(playerStats[`${player.id}_redCards`] || "0")

        homePlayerStats.push({
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          stats: { goals, assists, cleanSheets, yellowCards, redCards },
        })
      }
    }

    // Collect away team stats
    const awayPlayerStats: PlayerStat[] = []
    let awayTotalWickets = 0

    for (const player of awayPlayers) {
      if (sport?.name === "Cricket") {
        const runs = Number.parseInt(playerStats[`${player.id}_runs`] || "0")
        const ballsFaced = Number.parseInt(playerStats[`${player.id}_ballsFaced`] || "0")
        const wickets = Number.parseInt(playerStats[`${player.id}_wickets`] || "0")
        const catches = Number.parseInt(playerStats[`${player.id}_catches`] || "0")
        const economyRate = Number.parseFloat(playerStats[`${player.id}_economyRate`] || "0")

        awayTotalWickets += wickets

        awayPlayerStats.push({
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          stats: { runs, ballsFaced, wickets, catches, economyRate },
        })
      } else {
        // Football
        const goals = Number.parseInt(playerStats[`${player.id}_goals`] || "0")
        const assists = Number.parseInt(playerStats[`${player.id}_assists`] || "0")
        const cleanSheets = Number.parseInt(playerStats[`${player.id}_cleanSheets`] || "0")
        const yellowCards = Number.parseInt(playerStats[`${player.id}_yellowCards`] || "0")
        const redCards = Number.parseInt(playerStats[`${player.id}_redCards`] || "0")

        awayPlayerStats.push({
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          stats: { goals, assists, cleanSheets, yellowCards, redCards },
        })
      }
    }

    // Only validate maximum wickets for cricket
    if (sport?.name === "Cricket") {
      if (homeTotalWickets > 10) {
        setValidationError(`Home team wickets (${homeTotalWickets}) cannot exceed 10`)
        return
      }
      if (awayTotalWickets > 10) {
        setValidationError(`Away team wickets (${awayTotalWickets}) cannot exceed 10`)
        return
      }
    }

    // Create or update match result
    const matchResult: MatchResult = {
      id: editingMatchId || `result_${Date.now()}`,
      fixtureId: fixture.id,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
      homeScore: homeTeamScore,
      awayScore: awayTeamScore,
      sportId: sport?.id || "",
      kickoffTime: fixture.kickoffTime,
      homePlayerStats,
      awayPlayerStats,
    }

    if (editingMatchId) {
      const updatedResults = matchResults.map((r) => (r.id === editingMatchId ? matchResult : r))
      setMatchResults(updatedResults)
      localStorage.setItem("match_results", JSON.stringify(updatedResults))
    } else {
      const newResults = [...matchResults, matchResult]
      setMatchResults(newResults)
      localStorage.setItem("match_results", JSON.stringify(newResults))
    }

    // Reset form
    setValidationError("")
    setShowAddResultDialog(false)
    setFormStep("selectMatch")
    setSelectedFixtureId("")
    setHomeScore("")
    setAwayScore("")
    setPlayerStats({})
    setCustomPlayers([])
    setEditingMatchId(null)
  }

  const renderPlayerStatsTable = (result: MatchResult, teamType: "home" | "away") => {
    const sport = getSportById(result.sportId)
    const teamId = teamType === "home" ? result.homeTeamId : result.awayTeamId
    const team = getTeam(teamId)
    const teamPlayerStats = teamType === "home" ? result.homePlayerStats : result.awayPlayerStats
    const matchResult = getMatchResult(result)
    const isWinner =
      (teamType === "home" && matchResult.winner === "home") || (teamType === "away" && matchResult.winner === "away")

    return (
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <span>{team?.name}</span>
          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
        </h4>
        <div className="rounded-lg border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                {sport?.name === "Cricket" ? (
                  <>
                    <TableHead className="text-right">Runs</TableHead>
                    <TableHead className="text-right">Balls Faced</TableHead>
                    <TableHead className="text-right">Wickets</TableHead>
                    <TableHead className="text-right">Catches</TableHead>
                    <TableHead className="text-right">Economy Rate</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">Goals</TableHead>
                    <TableHead className="text-right">Assists</TableHead>
                    <TableHead className="text-right">Clean Sheet</TableHead>
                    <TableHead className="text-right">Yellow Cards</TableHead>
                    <TableHead className="text-right">Red Cards</TableHead>
                  </>
                )}
                <TableHead className="text-right font-semibold">Fantasy Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamPlayerStats.map((playerStat) => (
                <TableRow key={playerStat.playerId}>
                  <TableCell className="font-medium">{playerStat.playerName}</TableCell>
                  <TableCell>{playerStat.position}</TableCell>
                  {sport?.name === "Cricket" ? (
                    <>
                      <TableCell className="text-right">{playerStat.stats.runs || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stats.ballsFaced || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stats.wickets || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stats.catches || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stats.economyRate || "N/A"}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right">{playerStat.stats.goals || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stats.assists || 0}</TableCell>
                      <TableCell className="text-right">
                        {(playerStat.position === "Goalkeeper" || playerStat.position === "Defender") &&
                        playerStat.stats.cleanSheets
                          ? "Yes"
                          : "No"}
                      </TableCell>
                      <TableCell className="text-right">{playerStat.stats.yellowCards || 0}</TableCell>
                      <TableCell className="text-right">{playerStat.stats.redCards || 0}</TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-semibold">
                    {calculateFantasyPoints(playerStat, sport?.name || "")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const handleEditStats = (matchId: string) => {
    const match = matchResults.find((m) => m.id === matchId)
    if (!match) return

    setEditingMatchId(matchId)
    setSelectedFixtureId(match.fixtureId)
    setHomeScore(match.homeScore.toString())
    setAwayScore(match.awayScore.toString())
    setFormStep("enterPlayerStats")

    const loadedCustomPlayers: CustomPlayer[] = []
    const loadedPlayerStats: Record<string, any> = {}

    match.homePlayerStats.forEach((ps) => {
      loadedCustomPlayers.push({
        id: ps.playerId,
        name: ps.playerName,
        position: ps.position,
        team: "home",
      })

      // Load stats
      Object.entries(ps.stats).forEach(([key, value]) => {
        loadedPlayerStats[`${ps.playerId}_${key}`] = value.toString()
      })
    })

    match.awayPlayerStats.forEach((ps) => {
      loadedCustomPlayers.push({
        id: ps.playerId,
        name: ps.playerName,
        position: ps.position,
        team: "away",
      })

      // Load stats
      Object.entries(ps.stats).forEach(([key, value]) => {
        loadedPlayerStats[`${ps.playerId}_${key}`] = value.toString()
      })
    })

    setCustomPlayers(loadedCustomPlayers)
    setPlayerStats(loadedPlayerStats)
    setShowAddResultDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results Board</h1>
          <p className="text-muted-foreground">View completed match results and player performances</p>
        </div>
        <Button onClick={openAddResultDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Match Result
        </Button>
      </div>

      {/* Sport Filter and Search */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2">
          <Button variant={selectedSport === "all" ? "default" : "outline"} onClick={() => setSelectedSport("all")}>
            All Sports
          </Button>
          <Button variant={selectedSport === "1" ? "default" : "outline"} onClick={() => setSelectedSport("1")}>
            ⚽ Football
          </Button>
          <Button variant={selectedSport === "2" ? "default" : "outline"} onClick={() => setSelectedSport("2")}>
            🏏 Cricket
          </Button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Match Results */}
      <Card>
        <CardHeader>
          <CardTitle>Match Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No matches found for your search"
                : "No completed matches found. Add match results to get started."}
            </div>
          ) : (
            filteredResults.map((result) => {
              const homeTeam = getTeam(result.homeTeamId)
              const awayTeam = getTeam(result.awayTeamId)
              const sport = getSportById(result.sportId)
              const matchResult = getMatchResult(result)
              const isExpanded = expandedMatch === result.id

              return (
                <div key={result.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Match Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          {sport?.icon} {sport?.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.kickoffTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {" · "}
                          {new Date(result.kickoffTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Match Title */}
                    <h3 className="text-lg font-semibold">
                      {homeTeam?.name} vs {awayTeam?.name}
                    </h3>

                    {/* Result Summary */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">{matchResult.summary}</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {result.homeScore} - {result.awayScore}
                      </div>
                    </div>

                    {/* View Details and Edit Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => toggleMatchDetails(result.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View Details
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => handleEditStats(result.id)}>
                        Edit Stats
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-6">
                      {renderPlayerStatsTable(result, "home")}
                      {renderPlayerStatsTable(result, "away")}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddResultDialog} onOpenChange={setShowAddResultDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMatchId ? "Edit Match Result" : "Add Match Result"}</DialogTitle>
            <DialogDescription>
              {formStep === "selectMatch" && "Select a match to add result"}
              {formStep === "enterScores" && "Enter the final scores for both teams"}
              {formStep === "enterPlayerStats" &&
                "Enter player statistics for both teams. Stats must match the final scores."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Select Match */}
            {formStep === "selectMatch" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Match</Label>
                  <Select value={selectedFixtureId} onValueChange={setSelectedFixtureId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a match" />
                    </SelectTrigger>
                    <SelectContent>
                      {fixtures.map((fixture) => {
                        const homeTeam = getTeam(fixture.homeTeamId)
                        const awayTeam = getTeam(fixture.awayTeamId)
                        const sport = getSportById(homeTeam?.sportId || "")
                        return (
                          <SelectItem key={fixture.id} value={fixture.id}>
                            {sport?.icon} {homeTeam?.name} vs {awayTeam?.name} ({sport?.name})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFixture && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {getTeam(selectedFixture.homeTeamId)?.name} vs {getTeam(selectedFixture.awayTeamId)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedFixture.kickoffTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {getSportById(getTeam(selectedFixture.homeTeamId)?.sportId || "")?.name}
                      </Badge>
                    </div>
                  </div>
                )}

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 2: Enter Scores */}
            {formStep === "enterScores" && selectedFixture && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">
                    {getTeam(selectedFixture.homeTeamId)?.name} vs {getTeam(selectedFixture.awayTeamId)?.name}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {getSportById(getTeam(selectedFixture.homeTeamId)?.sportId || "")?.name}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{getTeam(selectedFixture.homeTeamId)?.name} Score</Label>
                    <Input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{getTeam(selectedFixture.awayTeamId)?.name} Score</Label>
                    <Input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 3: Enter Player Stats */}
            {formStep === "enterPlayerStats" && selectedFixture && (
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {getTeam(selectedFixture.homeTeamId)?.name} vs {getTeam(selectedFixture.awayTeamId)?.name}
                    </p>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Final Score</p>
                      <p className="text-2xl font-bold">
                        {homeScore} - {awayScore}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Selector */}
                <div className="flex gap-2 border-b">
                  <Button
                    variant={selectedTeam === "home" ? "default" : "ghost"}
                    onClick={() => setSelectedTeam("home")}
                    className="flex-1"
                  >
                    {getTeam(selectedFixture.homeTeamId)?.name}
                  </Button>
                  <Button
                    variant={selectedTeam === "away" ? "default" : "ghost"}
                    onClick={() => setSelectedTeam("away")}
                    className="flex-1"
                  >
                    {getTeam(selectedFixture.awayTeamId)?.name}
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Enter stats for{" "}
                    {selectedTeam === "home"
                      ? getTeam(selectedFixture.homeTeamId)?.name
                      : getTeam(selectedFixture.awayTeamId)?.name}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPlayerForm(!showAddPlayerForm)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Player
                  </Button>
                </div>

                {showAddPlayerForm && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                    <p className="font-semibold text-sm">Add New Player</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Player Name</Label>
                        <Input
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Enter player name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Position/Role</Label>
                        {(() => {
                          const homeTeam = getTeam(selectedFixture.homeTeamId)
                          const sport = getSportById(homeTeam?.sportId || "")

                          if (sport?.name === "Cricket") {
                            return (
                              <select
                                value={newPlayerPosition}
                                onChange={(e) => setNewPlayerPosition(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                              >
                                <option value="">Select role</option>
                                <option value="Batsman">Batsman</option>
                                <option value="Bowler">Bowler</option>
                                <option value="All-rounder">All-rounder</option>
                                <option value="Wicket-keeper">Wicket-keeper</option>
                              </select>
                            )
                          } else {
                            return (
                              <select
                                value={newPlayerPosition}
                                onChange={(e) => setNewPlayerPosition(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                              >
                                <option value="">Select position</option>
                                <option value="Goalkeeper">Goalkeeper</option>
                                <option value="Defender">Defender</option>
                                <option value="Midfielder">Midfielder</option>
                                <option value="Forward">Forward</option>
                              </select>
                            )
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={addCustomPlayer}>
                        Add Player
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddPlayerForm(false)
                          setNewPlayerName("")
                          setNewPlayerPosition("")
                          setValidationError("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Player Stats Form */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {(() => {
                    const sport = getSportById(
                      selectedFixture.homeTeamId ? getTeam(selectedFixture.homeTeamId)?.sportId || "" : "",
                    )

                    const teamCustomPlayers = customPlayers
                      .filter((cp) => cp.team === selectedTeam)
                      .map((cp) => ({
                        id: cp.id,
                        name: cp.name,
                        position: cp.position,
                        teamId: selectedTeam === "home" ? selectedFixture.homeTeamId : selectedFixture.awayTeamId,
                        sportId: sport?.id || "",
                        price: 0,
                        availability: "available" as const,
                      }))

                    return teamCustomPlayers.length > 0 ? (
                      teamCustomPlayers.map((player) => (
                        <div key={player.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{player.name}</p>
                              <p className="text-sm text-muted-foreground">{player.position}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomPlayer(player.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {sport?.name === "Cricket" ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Runs</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_runs`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_runs`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Balls Faced</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_ballsFaced`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_ballsFaced`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Wickets</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={playerStats[`${player.id}_wickets`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_wickets`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Catches</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_catches`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_catches`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Economy Rate</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={playerStats[`${player.id}_economyRate`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_economyRate`]: e.target.value })
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Goals</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_goals`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_goals`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Assists</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_assists`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_assists`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Clean Sheets</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  value={playerStats[`${player.id}_cleanSheets`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_cleanSheets`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Yellow Cards</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={playerStats[`${player.id}_yellowCards`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_yellowCards`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Red Cards</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  value={playerStats[`${player.id}_redCards`] || ""}
                                  onChange={(e) =>
                                    setPlayerStats({ ...playerStats, [`${player.id}_redCards`]: e.target.value })
                                  }
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No players added yet.</p>
                        <p className="text-sm mt-1">Click "Add Player" to add players for this team.</p>
                      </div>
                    )
                  })()}
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {formStep !== "selectMatch" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (formStep === "enterScores") setFormStep("selectMatch")
                  else if (formStep === "enterPlayerStats") setFormStep("enterScores")
                  setValidationError("")
                }}
              >
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAddResultDialog(false)}>
              Cancel
            </Button>
            {formStep === "selectMatch" && <Button onClick={proceedToScoreEntry}>Next: Enter Scores</Button>}
            {formStep === "enterScores" && <Button onClick={proceedToPlayerStats}>Next: Enter Player Stats</Button>}
            {formStep === "enterPlayerStats" && (
              <Button onClick={handleSaveMatchResult}>{editingMatchId ? "Update Result" : "Save Result"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
