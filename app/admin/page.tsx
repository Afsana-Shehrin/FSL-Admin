"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar, TrendingUp, Lock, Calculator, RefreshCw, Plus } from "lucide-react"
import { sports, leagues, players, fixtures, gameweeks } from "@/lib/dummy-data"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function AdminDashboard() {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Dialog states
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false)
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [addActionDialogOpen, setAddActionDialogOpen] = useState(false)

  // Form states
  const [selectedGameweek, setSelectedGameweek] = useState("")
  const [scoringProgress, setScoringProgress] = useState(0)
  const [scoringLogs, setScoringLogs] = useState<string[]>([])
  const [statsSource, setStatsSource] = useState("api")

  const liveGameweeks = gameweeks.filter((gw) => gw.status === "live" && !gw.isLocked)

  const handleGameweekLock = async () => {
    if (!selectedGameweek) {
      toast({
        title: "Error",
        description: "Please select a gameweek to lock",
        variant: "destructive",
      })
      return
    }

    setIsProcessing("lock")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const gameweekData = gameweeks.find((gw) => gw.id === selectedGameweek)
    if (gameweekData) {
      gameweekData.isLocked = true
    }

    toast({
      title: "Gameweek Locked",
      description: `${gameweekData?.name} has been locked. Team changes are now disabled.`,
    })

    setIsProcessing(null)
    setLockDialogOpen(false)
    setSelectedGameweek("")

    window.location.reload()
  }

  const handleScoringCalculation = async () => {
    setScoringProgress(0)
    setScoringLogs([])
    setIsProcessing("scoring")

    const logs = [
      "Initializing scoring calculation...",
      "Fetching completed fixtures...",
      "Processing player statistics...",
      "Calculating fantasy points...",
      "Updating leaderboards...",
      "Finalizing results...",
    ]

    for (let i = 0; i < logs.length; i++) {
      setScoringLogs((prev) => [...prev, logs[i]])
      setScoringProgress((i + 1) * (100 / logs.length))
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    toast({
      title: "Scoring Calculation Complete",
      description: "Points calculated for 127 players across 12 fixtures.",
    })

    setIsProcessing(null)
  }

  const handlePlayerStatsUpdate = async () => {
    if (!statsSource) {
      toast({
        title: "Error",
        description: "Please select a data source",
        variant: "destructive",
      })
      return
    }

    setIsProcessing("stats")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1800))

    toast({
      title: "Player Stats Updated",
      description: `Successfully synced ${players.length} players from ${statsSource === "api" ? "API" : "manual input"}.`,
    })

    setIsProcessing(null)
    setStatsDialogOpen(false)
    setStatsSource("api")
  }

  const stats = [
    {
      title: "Active Sports",
      value: sports.filter((s) => s.isActive).length,
      icon: Trophy,
    },
    {
      title: "Total Players",
      value: players.length,
      icon: Users,
    },
    {
      title: "Active Leagues",
      value: leagues.filter((l) => l.isActive).length,
      icon: TrendingUp,
    },
    {
      title: "Upcoming Fixtures",
      value: fixtures.filter((f) => f.status === "scheduled").length,
      icon: Calendar,
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome to your fantasy sports admin panel</p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Player added</p>
                  <p className="text-xs text-muted-foreground">Mohamed Salah added to Liverpool</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Fixture updated</p>
                  <p className="text-xs text-muted-foreground">MUN vs LIV - Status changed to live</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Gameweek created</p>
                  <p className="text-xs text-muted-foreground">Gameweek 3 created for EPL</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddActionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add More
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => setLockDialogOpen(true)}
                disabled={isProcessing !== null}
                className="w-full text-left px-4 py-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <p className="font-medium">Trigger Gameweek Lock</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Lock current gameweek for team changes</p>
              </button>

              <button
                onClick={() => setScoringDialogOpen(true)}
                disabled={isProcessing !== null}
                className="w-full text-left px-4 py-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <p className="font-medium">Run Scoring Calculation</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Calculate points for completed fixtures</p>
              </button>

              <button
                onClick={() => setStatsDialogOpen(true)}
                disabled={isProcessing !== null}
                className="w-full text-left px-4 py-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <p className="font-medium">Update Player Stats</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sync latest player statistics</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Trigger Gameweek Lock</DialogTitle>
            <DialogDescription>
              Select a live gameweek to lock. This will prevent users from making any team changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gameweek">Select Gameweek</Label>
              {liveGameweeks.length > 0 ? (
                <Select value={selectedGameweek} onValueChange={setSelectedGameweek}>
                  <SelectTrigger id="gameweek">
                    <SelectValue placeholder="Choose live gameweek..." />
                  </SelectTrigger>
                  <SelectContent>
                    {liveGameweeks.map((gw) => (
                      <SelectItem key={gw.id} value={gw.id}>
                        {gw.name} - {gw.status.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  No live gameweeks available to lock
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGameweekLock} disabled={isProcessing === "lock" || liveGameweeks.length === 0}>
              {isProcessing === "lock" ? "Locking..." : "Confirm Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scoringDialogOpen} onOpenChange={setScoringDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Run Scoring Calculation</DialogTitle>
            <DialogDescription>
              Calculate fantasy points for all completed fixtures and update player scores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isProcessing === "scoring" ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span className="font-medium">{Math.round(scoringProgress)}%</span>
                  </div>
                  <Progress value={scoringProgress} />
                </div>
                <div className="bg-secondary rounded-md p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-1 font-mono text-xs">
                    {scoringLogs.map((log, i) => (
                      <div key={i} className="text-muted-foreground">
                        <span className="text-primary mr-2">›</span>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : scoringProgress === 100 ? (
              <div className="space-y-3">
                <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fixtures Processed:</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Players Updated:</span>
                      <span className="font-medium">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Points Awarded:</span>
                      <span className="font-medium">8,452</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Click "Start Calculation" to begin processing scores
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScoringDialogOpen(false)
                setScoringProgress(0)
                setScoringLogs([])
              }}
            >
              {scoringProgress === 100 ? "Close" : "Cancel"}
            </Button>
            {scoringProgress !== 100 && (
              <Button onClick={handleScoringCalculation} disabled={isProcessing === "scoring"}>
                {isProcessing === "scoring" ? "Processing..." : "Start Calculation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Update Player Stats</DialogTitle>
            <DialogDescription>Choose the source for player statistics synchronization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Data Source</Label>
              <RadioGroup value={statsSource} onValueChange={setStatsSource}>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="api" id="api" />
                  <div className="flex-1">
                    <Label htmlFor="api" className="font-medium cursor-pointer">
                      External API
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically fetch latest statistics from third-party sports data providers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="manual" id="manual" />
                  <div className="flex-1">
                    <Label htmlFor="manual" className="font-medium cursor-pointer">
                      Manual Input
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use manually entered statistics from your database or CSV import
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlayerStatsUpdate} disabled={isProcessing === "stats"}>
              {isProcessing === "stats" ? "Syncing..." : "Confirm Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addActionDialogOpen} onOpenChange={setAddActionDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Add Quick Action</DialogTitle>
            <DialogDescription>Create a new quick action button for frequently used operations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-name">Action Name</Label>
              <input
                id="action-name"
                placeholder="e.g., Reset Player Prices"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-desc">Description</Label>
              <input
                id="action-desc"
                placeholder="Brief description of what this action does"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Quick Action Added",
                  description: "New action has been added to your dashboard.",
                })
                setAddActionDialogOpen(false)
              }}
            >
              Add Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
