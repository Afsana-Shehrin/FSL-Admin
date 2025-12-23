"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { gameweeks, players } from "@/lib/dummy-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DashboardDialogsProps {
  lockDialogOpen: boolean
  setLockDialogOpen: (open: boolean) => void
  scoringDialogOpen: boolean
  setScoringDialogOpen: (open: boolean) => void
  statsDialogOpen: boolean
  setStatsDialogOpen: (open: boolean) => void
  addActionDialogOpen: boolean
  setAddActionDialogOpen: (open: boolean) => void
}

export default function DashboardDialogs({
  lockDialogOpen,
  setLockDialogOpen,
  scoringDialogOpen,
  setScoringDialogOpen,
  statsDialogOpen,
  setStatsDialogOpen,
  addActionDialogOpen,
  setAddActionDialogOpen,
}: DashboardDialogsProps) {
  const { toast } = useToast()
  
  // Lock Dialog States
  const [selectedGameweek, setSelectedGameweek] = useState("")
  const [isLockProcessing, setIsLockProcessing] = useState(false)
  
  // Scoring Dialog States
  const [scoringProgress, setScoringProgress] = useState(0)
  const [scoringLogs, setScoringLogs] = useState<string[]>([])
  const [isScoringProcessing, setIsScoringProcessing] = useState(false)
  
  // Stats Dialog States
  const [statsSource, setStatsSource] = useState("api")
  const [isStatsProcessing, setIsStatsProcessing] = useState(false)

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

    setIsLockProcessing(true)

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

    setIsLockProcessing(false)
    setLockDialogOpen(false)
    setSelectedGameweek("")

    window.location.reload()
  }

  const handleScoringCalculation = async () => {
    setScoringProgress(0)
    setScoringLogs([])
    setIsScoringProcessing(true)

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

    setIsScoringProcessing(false)
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

    setIsStatsProcessing(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1800))

    toast({
      title: "Player Stats Updated",
      description: `Successfully synced ${players.length} players from ${statsSource === "api" ? "API" : "manual input"}.`,
    })

    setIsStatsProcessing(false)
    setStatsDialogOpen(false)
    setStatsSource("api")
  }

  const handleAddAction = () => {
    toast({
      title: "Quick Action Added",
      description: "New action has been added to your dashboard.",
    })
    setAddActionDialogOpen(false)
  }

  return (
    <>
      {/* Lock Dialog */}
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
            <Button onClick={handleGameweekLock} disabled={isLockProcessing || liveGameweeks.length === 0}>
              {isLockProcessing ? "Locking..." : "Confirm Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scoring Dialog */}
      <Dialog open={scoringDialogOpen} onOpenChange={setScoringDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Run Scoring Calculation</DialogTitle>
            <DialogDescription>
              Calculate fantasy points for all completed fixtures and update player scores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isScoringProcessing ? (
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
                if (scoringProgress !== 100) {
                  setScoringProgress(0)
                  setScoringLogs([])
                }
              }}
            >
              {scoringProgress === 100 ? "Close" : "Cancel"}
            </Button>
            {scoringProgress !== 100 && (
              <Button onClick={handleScoringCalculation} disabled={isScoringProcessing}>
                {isScoringProcessing ? "Processing..." : "Start Calculation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
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
            <Button onClick={handlePlayerStatsUpdate} disabled={isStatsProcessing}>
              {isStatsProcessing ? "Syncing..." : "Confirm Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Action Dialog */}
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
            <Button onClick={handleAddAction}>
              Add Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}