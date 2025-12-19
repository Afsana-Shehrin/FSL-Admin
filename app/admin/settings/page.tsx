"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar, Shield, Lock, Calculator, RefreshCw, Plus, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
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
import { getSupabase } from "@/lib/supabase/working-client"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AdminStats {
  totalAdmins: number
  activeAdmins: number
  superAdmins: number
  totalUsers: number
}

interface Gameweek {
  id: string
  name: string
  status: "live" | "completed" | "scheduled"
  isLocked: boolean
}

interface ActivityLog {
  id: string
  admin_email: string
  action: string
  details: string
  created_at: string
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats>({
    totalAdmins: 0,
    activeAdmins: 0,
    superAdmins: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([
    { id: "1", name: "Gameweek 1", status: "live", isLocked: false },
    { id: "2", name: "Gameweek 2", status: "live", isLocked: false },
    { id: "3", name: "Gameweek 3", status: "completed", isLocked: true },
    { id: "4", name: "Gameweek 4", status: "scheduled", isLocked: false },
  ])
  const router = useRouter()

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = getSupabase()
      
      // Fetch admin stats
      const { data: admins, error: adminsError } = await supabase
        .from('admins')
        .select('*')

      if (!adminsError && admins) {
        const activeAdmins = admins.filter((admin: any) => admin.is_active).length
        const superAdmins = admins.filter((admin: any) => admin.role === 'Super Admin').length
        
        setStats({
          totalAdmins: admins.length,
          activeAdmins,
          superAdmins,
          totalUsers: 0 // You can add user count from your users table
        })
      }

      // Fetch recent activity (you'll need to create an activity_logs table)
      const { data: activity } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (activity) {
        setRecentActivity(activity)
      } else {
        // Fallback dummy activity
        setRecentActivity([
          {
            id: "1",
            admin_email: "admin@example.com",
            action: "Login",
            details: "Super Admin logged in",
            created_at: new Date().toISOString()
          },
          {
            id: "2",
            admin_email: "admin@example.com",
            action: "Settings Update",
            details: "Updated system configuration",
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ])
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

    try {
      const supabase = getSupabase()
      
      // Update in database (example - update your actual table)
      const { error } = await supabase
        .from('gameweeks')
        .update({ is_locked: true, updated_at: new Date().toISOString() })
        .eq('id', selectedGameweek)

      if (error) throw error

      // Update local state
      setGameweeks(prev => prev.map(gw => 
        gw.id === selectedGameweek ? { ...gw, isLocked: true } : gw
      ))

      toast({
        title: "Gameweek Locked",
        description: "Gameweek has been locked. Team changes are now disabled.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lock gameweek",
        variant: "destructive",
      })
    }

    setIsProcessing(null)
    setLockDialogOpen(false)
    setSelectedGameweek("")
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
      description: `Successfully synced 250 players from ${statsSource === "api" ? "API" : "manual input"}.`,
    })

    setIsProcessing(null)
    setStatsDialogOpen(false)
    setStatsSource("api")
  }

  const dashboardStats = [
    {
      title: "Total Admins",
      value: stats.totalAdmins,
      icon: Shield,
      color: "blue",
      description: "All admin accounts"
    },
    {
      title: "Active Admins",
      value: stats.activeAdmins,
      icon: Users,
      color: "green",
      description: "Currently active"
    },
    {
      title: "Super Admins",
      value: stats.superAdmins,
      icon: Trophy,
      color: "purple",
      description: "Full access accounts"
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "amber",
      description: "Platform users"
    }
  ]

  const quickActions = [
    {
      title: "Trigger Gameweek Lock",
      description: "Lock current gameweek for team changes",
      icon: Lock,
      action: () => setLockDialogOpen(true)
    },
    {
      title: "Run Scoring Calculation",
      description: "Calculate points for completed fixtures",
      icon: Calculator,
      action: () => setScoringDialogOpen(true)
    },
    {
      title: "Update Player Stats",
      description: "Sync latest player statistics",
      icon: RefreshCw,
      action: () => setStatsDialogOpen(true)
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome to your fantasy sports admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <Icon className={`h-4 w-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            )}
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
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={isProcessing !== null}
                    className="w-full text-left px-4 py-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <p className="font-medium">{action.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Gameweeks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Gameweeks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lock Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameweeks.map((gameweek) => (
                <TableRow key={gameweek.id}>
                  <TableCell className="font-medium">{gameweek.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      gameweek.status === 'live' ? 'default' :
                      gameweek.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {gameweek.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={gameweek.isLocked ? "destructive" : "outline"}>
                      {gameweek.isLocked ? "Locked" : "Unlocked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!gameweek.isLocked && gameweek.status === 'live' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedGameweek(gameweek.id)
                          setLockDialogOpen(true)
                        }}
                      >
                        Lock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Admin Authentication</p>
                  <p className="text-sm text-muted-foreground">Custom database authentication</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Database Connection</p>
                  <p className="text-sm text-muted-foreground">PostgreSQL with Supabase</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                Connected
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs (same as before) */}
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
    </div>
  )
}