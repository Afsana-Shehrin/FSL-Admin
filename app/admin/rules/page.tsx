"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2 } from "lucide-react"
// Removed: import { getSports } from "@/lib/dummy-data"
import { Switch } from "@/components/ui/switch"
// Removed: import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Added: import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Modified Interfaces
interface PlayerType {
  // Changed type to string for Select input compatibility
  type: string
  count: number
}

interface TeamRule {
  id: string
  sportId: string
  name: string
  description: string
  playerTypes: PlayerType[]
  allowTransfers: boolean
  // Changed from 'active' to 'isActive'
  isActive: boolean
}

// Modified Interfaces
interface ScoringAction {
  // Changed name to action for Select input compatibility
  action: string
  points: number
}

interface ScoringRule {
  id: string
  sportId: string
  name: string
  description: string
  actions: ScoringAction[]
  // Changed from 'active' to 'isActive'
  isActive: boolean
}

interface BudgetRule {
  id: string
  sportId: string
  name: string
  description: string
  totalBudget: number
  minPlayerPrice: number // Kept this, but it's not used in the updated UI
  maxPlayerPrice: number
  // Changed from 'active' to 'isActive'
  isActive: boolean
}

// Added Sport interface
interface Sport {
  id: string
  name: string
  icon: string
  isActive: boolean
}

export default function RulesPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedSport, setSelectedSport] = useState("")
  // </CHANGE>
  // Removed: const sports = getSports()
  // Removed: const [selectedSport, setSelectedSport] = useState(sports[0]?.id || "1")
  const [selectedCategory, setSelectedCategory] = useState<"team" | "scoring" | "budget">("team")

  const [teamRules, setTeamRules] = useState<TeamRule[]>([])
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>([])

  // Renamed dialog states for clarity
  const [isTeamRuleDialogOpen, setIsTeamRuleDialogOpen] = useState(false)
  const [isScoringRuleDialogOpen, setIsScoringRuleDialogOpen] = useState(false)
  const [isBudgetRuleDialogOpen, setIsBudgetRuleDialogOpen] = useState(false)
  // Removed: const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  // Removed: const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false)
  // Removed: const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)

  const [editingTeamRule, setEditingTeamRule] = useState<TeamRule | null>(null)
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null)
  const [editingBudgetRule, setEditingBudgetRule] = useState<BudgetRule | null>(null)

  // Replaced individual state variables with form objects for better state management
  const [teamRuleForm, setTeamRuleForm] = useState({
    name: "",
    description: "",
    playerTypes: [{ type: "", count: 0 }], // Changed 'id' to 'type' and removed 'name'
    allowTransfers: false,
  })

  const [scoringRuleForm, setScoringRuleForm] = useState({
    name: "",
    description: "",
    actions: [{ action: "", points: 0 }], // Changed 'name' to 'action'
  })

  const [budgetRuleForm, setBudgetRuleForm] = useState({
    name: "",
    description: "",
    totalBudget: 100, // Default values
    maxPlayerPrice: 15, // Default values
    // Removed minPlayerPrice as it was not used in dialog
  })

  // Removed: const [teamRuleName, setTeamRuleName] = useState("")
  // Removed: const [teamRuleDescription, setTeamRuleDescription] = useState("")
  // Removed: const [playerTypes, setPlayerTypes] = useState<PlayerType[]>([])
  // Removed: const [allowTransfers, setAllowTransfers] = useState(true)

  // Removed: const [scoringRuleName, setScoringRuleName] = useState("")
  // Removed: const [scoringRuleDescription, setScoringRuleDescription] = useState("")
  // Removed: const [scoringActions, setScoringActions] = useState<ScoringAction[]>([])

  // Removed: const [budgetRuleName, setBudgetRuleName] = useState("")
  // Removed: const [budgetRuleDescription, setBudgetRuleDescription] = useState("")
  // Removed: const [totalBudget, setTotalBudget] = useState("")
  // Removed: const [minPlayerPrice, setMinPlayerPrice] = useState("")
  // Removed: const [maxPlayerPrice, setMaxPlayerPrice] = useState("")

  useEffect(() => {
    const loadSports = () => {
      const storedSports = localStorage.getItem("sports_list")
      if (storedSports) {
        const parsed = JSON.parse(storedSports) as Sport[]
        const activeSports = parsed.filter((s) => s.isActive)
        setSports(activeSports)
        // Set selectedSport only if it's not already set and there are active sports
        if (activeSports.length > 0 && !selectedSport) {
          setSelectedSport(activeSports[0].id)
        } else if (activeSports.length === 0) {
          // Clear selectedSport if no active sports remain
          setSelectedSport("")
        }
      } else {
        // Default sports if none exist
        const defaultSports = [
          { id: "1", name: "Football", icon: "⚽", isActive: true },
          { id: "2", name: "Cricket", icon: "🏏", isActive: true },
        ]
        setSports(defaultSports)
        localStorage.setItem("sports_list", JSON.stringify(defaultSports))
        setSelectedSport(defaultSports[0].id)
      }
    }

    loadSports()

    // Listen for storage changes to update sports dynamically
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sports_list") {
        loadSports()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [selectedSport]) // Depend on selectedSport to re-evaluate if needed
  // </CHANGE>

  useEffect(() => {
    const storedTeamRules = localStorage.getItem("team_rules")
    const storedScoringRules = localStorage.getItem("scoring_rules")
    const storedBudgetRules = localStorage.getItem("budget_rules")

    console.log("[v0] Loading rules from localStorage...")
    if (storedTeamRules) {
      const parsed = JSON.parse(storedTeamRules)
      console.log("[v0] Loaded team rules:", parsed)
      setTeamRules(parsed)
    }
    if (storedScoringRules) {
      const parsed = JSON.parse(storedScoringRules)
      console.log("[v0] Loaded scoring rules:", parsed)
      setScoringRules(parsed)
    }
    if (storedBudgetRules) {
      const parsed = JSON.parse(storedBudgetRules)
      console.log("[v0] Loaded budget rules:", parsed)
      setBudgetRules(parsed)
    }
  }, [])

  useEffect(() => {
    console.log("[v0] Saving team rules to localStorage:", teamRules)
    localStorage.setItem("team_rules", JSON.stringify(teamRules))
  }, [teamRules])

  useEffect(() => {
    console.log("[v0] Saving scoring rules to localStorage:", scoringRules)
    localStorage.setItem("scoring_rules", JSON.stringify(scoringRules))
  }, [scoringRules])

  useEffect(() => {
    console.log("[v0] Saving budget rules to localStorage:", budgetRules)
    localStorage.setItem("budget_rules", JSON.stringify(budgetRules))
  }, [budgetRules])

  const getCurrentSport = () => sports.find((s) => s.id === selectedSport)

  const filteredTeamRules = teamRules.filter((r) => r.sportId === selectedSport)
  const filteredScoringRules = scoringRules.filter((r) => r.sportId === selectedSport)
  const filteredBudgetRules = budgetRules.filter((r) => r.sportId === selectedSport)

  // Handlers for player types within the team rule form
  const handleAddPlayerType = () => {
    setTeamRuleForm({
      ...teamRuleForm,
      playerTypes: [...teamRuleForm.playerTypes, { type: "", count: 0 }],
    })
  }

  const handleRemovePlayerType = (index: number) => {
    setTeamRuleForm({
      ...teamRuleForm,
      playerTypes: teamRuleForm.playerTypes.filter((_, i) => i !== index),
    })
  }

  const handlePlayerTypeChange = (index: number, field: "type" | "count", value: string | number) => {
    const updated = [...teamRuleForm.playerTypes]
    // Ensure count is a number, default to 0 if invalid input
    const numericValue = field === "count" ? (typeof value === "string" ? Number.parseInt(value) || 0 : value) : value
    updated[index] = { ...updated[index], [field]: numericValue }
    setTeamRuleForm({ ...teamRuleForm, playerTypes: updated })
  }

  // Handlers for scoring actions within the scoring rule form
  const handleAddAction = () => {
    setScoringRuleForm({
      ...scoringRuleForm,
      actions: [...scoringRuleForm.actions, { action: "", points: 0 }],
    })
  }

  const handleRemoveAction = (index: number) => {
    setScoringRuleForm({
      ...scoringRuleForm,
      actions: scoringRuleForm.actions.filter((_, i) => i !== index),
    })
  }

  const handleActionChange = (index: number, field: "action" | "points", value: string | number) => {
    const updated = [...scoringRuleForm.actions]
    // Ensure points is a number, default to 0 if invalid input
    const numericValue = field === "points" ? (typeof value === "string" ? Number.parseInt(value) || 0 : value) : value
    updated[index] = { ...updated[index], [field]: numericValue }
    setScoringRuleForm({ ...scoringRuleForm, actions: updated })
  }

  // Dialog open/close and form population handlers
  const handleOpenTeamRuleDialog = (rule?: TeamRule) => {
    if (rule) {
      setEditingTeamRule(rule)
      setTeamRuleForm({
        name: rule.name,
        description: rule.description,
        playerTypes: rule.playerTypes,
        allowTransfers: rule.allowTransfers,
      })
    } else {
      setEditingTeamRule(null)
      // Reset form to default state for new rule
      setTeamRuleForm({
        name: "",
        description: "",
        playerTypes: [{ type: "", count: 0 }], // Start with one empty player type
        allowTransfers: false,
      })
    }
    setIsTeamRuleDialogOpen(true)
  }

  const handleSaveTeamRule = () => {
    // Basic validation
    if (!teamRuleForm.name.trim()) {
      alert("Rule name is required.")
      return
    }
    if (teamRuleForm.playerTypes.some((pt) => !pt.type.trim() || pt.count <= 0)) {
      alert("Please define valid player types and their counts.")
      return
    }

    if (editingTeamRule) {
      setTeamRules(
        teamRules.map((r) =>
          r.id === editingTeamRule.id
            ? { ...r, ...teamRuleForm, sportId: selectedSport } // Spread form data, update sportId
            : r,
        ),
      )
    } else {
      const newRule: TeamRule = {
        id: Date.now().toString(), // Simple unique ID generation
        ...teamRuleForm,
        sportId: selectedSport,
        isActive: true, // New rules are active by default
      }
      setTeamRules([...teamRules, newRule])
    }
    setIsTeamRuleDialogOpen(false)
    setEditingTeamRule(null) // Clear editing state
  }

  const handleOpenScoringRuleDialog = (rule?: ScoringRule) => {
    if (rule) {
      setEditingScoringRule(rule)
      setScoringRuleForm({
        name: rule.name,
        description: rule.description,
        actions: rule.actions,
      })
    } else {
      setEditingScoringRule(null)
      // Reset form to default state for new rule
      setScoringRuleForm({
        name: "",
        description: "",
        actions: [{ action: "", points: 0 }], // Start with one empty action
      })
    }
    setIsScoringRuleDialogOpen(true)
  }

  const handleSaveScoringRule = () => {
    // Basic validation
    if (!scoringRuleForm.name.trim()) {
      alert("Rule name is required.")
      return
    }
    if (scoringRuleForm.actions.some((action) => !action.action.trim() || action.points < 0)) {
      alert("Please define valid actions and their points.")
      return
    }

    if (editingScoringRule) {
      setScoringRules(
        scoringRules.map((r) =>
          r.id === editingScoringRule.id
            ? { ...r, ...scoringRuleForm, sportId: selectedSport } // Spread form data, update sportId
            : r,
        ),
      )
    } else {
      const newRule: ScoringRule = {
        id: Date.now().toString(), // Simple unique ID generation
        ...scoringRuleForm,
        sportId: selectedSport,
        isActive: true, // New rules are active by default
      }
      setScoringRules([...scoringRules, newRule])
    }
    setIsScoringRuleDialogOpen(false)
    setEditingScoringRule(null) // Clear editing state
  }

  const handleOpenBudgetRuleDialog = (rule?: BudgetRule) => {
    if (rule) {
      setEditingBudgetRule(rule)
      setBudgetRuleForm({
        name: rule.name,
        description: rule.description,
        totalBudget: rule.totalBudget,
        maxPlayerPrice: rule.maxPlayerPrice,
        // minPlayerPrice is not included in form state as it's not used in dialog
      })
    } else {
      setEditingBudgetRule(null)
      // Reset form to default state for new rule
      setBudgetRuleForm({
        name: "",
        description: "",
        totalBudget: 100, // Default values
        maxPlayerPrice: 15, // Default values
      })
    }
    setIsBudgetRuleDialogOpen(true)
  }

  const handleSaveBudgetRule = () => {
    // Basic validation
    if (!budgetRuleForm.name.trim()) {
      alert("Rule name is required.")
      return
    }
    if (budgetRuleForm.totalBudget <= 0) {
      alert("Total budget must be a positive number.")
      return
    }
    // Max player price can be 0 if not specified, but if it's less than 0, it's an error
    if (budgetRuleForm.maxPlayerPrice < 0) {
      alert("Max player price cannot be negative.")
      return
    }

    if (editingBudgetRule) {
      setBudgetRules(
        budgetRules.map((r) =>
          r.id === editingBudgetRule.id
            ? { ...r, ...budgetRuleForm, sportId: selectedSport } // Spread form data, update sportId
            : r,
        ),
      )
    } else {
      const newRule: BudgetRule = {
        id: Date.now().toString(), // Simple unique ID generation
        ...budgetRuleForm,
        sportId: selectedSport,
        isActive: true, // New rules are active by default
        minPlayerPrice: 0, // Default minPlayerPrice to 0 since it's not in form
      }
      setBudgetRules([...budgetRules, newRule])
    }
    setIsBudgetRuleDialogOpen(false)
    setEditingBudgetRule(null) // Clear editing state
  }

  // Deletion handlers - simplified as they just need the ID
  const handleDeleteTeamRule = (id: string) => {
    if (confirm("Are you sure you want to delete this team rule?")) {
      setTeamRules(teamRules.filter((r) => r.id !== id))
    }
  }

  const handleDeleteScoringRule = (id: string) => {
    if (confirm("Are you sure you want to delete this scoring rule?")) {
      setScoringRules(scoringRules.filter((r) => r.id !== id))
    }
  }

  const handleDeleteBudgetRule = (id: string) => {
    if (confirm("Are you sure you want to delete this budget rule?")) {
      setBudgetRules(budgetRules.filter((r) => r.id !== id))
    }
  }

  // Toggle handlers - simplified to use isActive
  const handleToggleTeamRule = (id: string) => {
    setTeamRules(teamRules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
  }

  const handleToggleScoringRule = (id: string) => {
    setScoringRules(scoringRules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
  }

  const handleToggleBudgetRule = (id: string) => {
    setBudgetRules(budgetRules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
  }

  return (
    <div className="space-y-6">
      <div>
        {/* Adjusted heading size for better responsiveness */}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rules Configuration</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure sport-specific team composition, scoring, and budget rules
        </p>
      </div>

      {/* Sport Selection */}
      <div className="flex flex-wrap gap-2">
        {sports.map((sport) => (
          <Button
            key={sport.id}
            variant={selectedSport === sport.id ? "default" : "outline"}
            onClick={() => setSelectedSport(sport.id)}
            className="gap-2"
          >
            <span>{sport.icon}</span>
            {sport.name}
          </Button>
        ))}
      </div>

      {/* Category Tabs - Replaced Tabs component with custom buttons for better control */}
      <div className="flex gap-2 border-b overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("team")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
            selectedCategory === "team" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Team Composition
          {selectedCategory === "team" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setSelectedCategory("scoring")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
            selectedCategory === "scoring" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Scoring Rules
          {selectedCategory === "scoring" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setSelectedCategory("budget")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
            selectedCategory === "budget" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Budget Rules
          {selectedCategory === "budget" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Team Composition Section */}
      {selectedCategory === "team" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Define squad size and player requirements for {getCurrentSport()?.name}
            </p>
            <Button onClick={() => handleOpenTeamRuleDialog()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Rule
            </Button>
          </div>

          {/* Display Team Rules */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeamRules.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">
                No team composition rules configured for {getCurrentSport()?.name}. Click "Add Team Rule" to create one.
              </p>
            ) : (
              filteredTeamRules.map((rule) => (
                <Card key={rule.id} className="max-w-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{rule.description}</CardDescription>
                      </div>
                      {/* Use isActive property */}
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggleTeamRule(rule.id)} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      {/* Use isActive property */}
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Player Composition:</p>
                      {rule.playerTypes.map((pt, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-muted p-2 rounded">
                          <span className="text-muted-foreground">{pt.type}:</span>
                          <span className="font-medium">{pt.count}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Allow Transfers:</span>
                      {/* Use concise display for boolean */}
                      <Badge variant="outline">{rule.allowTransfers ? "Yes" : "No"}</Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTeamRuleDialog(rule)}
                        className="flex-1"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTeamRule(rule.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Scoring Rules Section */}
      {selectedCategory === "scoring" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <p className="text-sm text-muted-foreground">Configure points for actions in {getCurrentSport()?.name}</p>
            <Button onClick={() => handleOpenScoringRuleDialog()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Scoring Rule
            </Button>
          </div>

          {/* Display Scoring Rules */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredScoringRules.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">
                No scoring rules configured for {getCurrentSport()?.name}. Click "Add Scoring Rule" to create one.
              </p>
            ) : (
              filteredScoringRules.map((rule) => (
                <Card key={rule.id} className="max-w-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{rule.description}</CardDescription>
                      </div>
                      {/* Use isActive property */}
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggleScoringRule(rule.id)} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      {/* Use isActive property */}
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Points System:</p>
                      {rule.actions.map((action, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-muted p-2 rounded">
                          <span className="text-muted-foreground">{action.action}:</span>
                          <span className="font-medium">{action.points} pts</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenScoringRuleDialog(rule)}
                        className="flex-1"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteScoringRule(rule.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Budget Rules Section */}
      {selectedCategory === "budget" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <p className="text-sm text-muted-foreground">Set budget constraints for {getCurrentSport()?.name}</p>
            <Button onClick={() => handleOpenBudgetRuleDialog()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Budget Rule
            </Button>
          </div>

          {/* Display Budget Rules */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBudgetRules.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">
                No budget rules configured for {getCurrentSport()?.name}. Click "Add Budget Rule" to create one.
              </p>
            ) : (
              filteredBudgetRules.map((rule) => (
                <Card key={rule.id} className="max-w-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{rule.description}</CardDescription>
                      </div>
                      {/* Use isActive property */}
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggleBudgetRule(rule.id)} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      {/* Use isActive property */}
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Total Budget:</span>
                        {/* Format to 1 decimal place and add M */}
                        <span className="font-medium">${rule.totalBudget.toFixed(1)}M</span>
                      </div>
                      {/* Removed minPlayerPrice display as it was not in dialog */}
                      <div className="flex justify-between text-sm bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Max Player Price:</span>
                        {/* Format to 1 decimal place and add M */}
                        <span className="font-medium">${rule.maxPlayerPrice.toFixed(1)}M</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBudgetRuleDialog(rule)}
                        className="flex-1"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBudgetRule(rule.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Team Rule Dialog - Updated to use new state management and dialog states */}
      <Dialog open={isTeamRuleDialogOpen} onOpenChange={setIsTeamRuleDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeamRule ? "Edit Team Rule" : "Add Team Composition Rule"}</DialogTitle>
            <DialogDescription>Define player type requirements for {getCurrentSport()?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-rule-name">Rule Name</Label>
              <Input
                id="team-rule-name"
                placeholder="e.g., Squad Size, Player Composition"
                value={teamRuleForm.name}
                onChange={(e) => setTeamRuleForm({ ...teamRuleForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-rule-desc">Description</Label>
              <Textarea
                id="team-rule-desc"
                placeholder="Describe this rule"
                value={teamRuleForm.description}
                onChange={(e) => setTeamRuleForm({ ...teamRuleForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Team Composition Settings</Label>
              {teamRuleForm.playerTypes.map((pt, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Player Type (e.g., Goalkeeper, Batsman)"
                    value={pt.type}
                    onChange={(e) => handlePlayerTypeChange(index, "type", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Count"
                    // Ensure value is controlled by number state, default to empty if NaN
                    value={pt.count || ""}
                    onChange={(e) => handlePlayerTypeChange(index, "count", Number.parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  {/* Only show delete button if more than one player type exists */}
                  {teamRuleForm.playerTypes.length > 1 && (
                    <Button variant="outline" size="icon" onClick={() => handleRemovePlayerType(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddPlayerType} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Player Type
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow-transfers">Allow Transfers</Label>
              <Switch
                id="allow-transfers"
                checked={teamRuleForm.allowTransfers}
                onCheckedChange={(checked) => setTeamRuleForm({ ...teamRuleForm, allowTransfers: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamRuleDialogOpen(false)}>
              Cancel
            </Button>
            {/* Changed button text based on editing state */}
            <Button onClick={handleSaveTeamRule}>{editingTeamRule ? "Update" : "Create"} Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scoring Rule Dialog - Updated to use new state management and dialog states */}
      <Dialog open={isScoringRuleDialogOpen} onOpenChange={setIsScoringRuleDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScoringRule ? "Edit Scoring Rule" : "Add Scoring Rule"}</DialogTitle>
            <DialogDescription>Configure points for actions in {getCurrentSport()?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scoring-rule-name">Rule Name</Label>
              <Input
                id="scoring-rule-name"
                placeholder="e.g., Goal Scoring, Run Scoring"
                value={scoringRuleForm.name}
                onChange={(e) => setScoringRuleForm({ ...scoringRuleForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scoring-rule-desc">Description</Label>
              <Textarea
                id="scoring-rule-desc"
                placeholder="Describe this scoring system"
                value={scoringRuleForm.description}
                onChange={(e) => setScoringRuleForm({ ...scoringRuleForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Actions & Points</Label>
              {scoringRuleForm.actions.map((action, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Action (e.g., Goal, Run, Wicket)"
                    value={action.action}
                    onChange={(e) => handleActionChange(index, "action", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Points"
                    // Ensure value is controlled by number state, default to empty if NaN
                    value={action.points || ""}
                    onChange={(e) => handleActionChange(index, "points", Number.parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  {/* Only show delete button if more than one action exists */}
                  {scoringRuleForm.actions.length > 1 && (
                    <Button variant="outline" size="icon" onClick={() => handleRemoveAction(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddAction} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScoringRuleDialogOpen(false)}>
              Cancel
            </Button>
            {/* Changed button text based on editing state */}
            <Button onClick={handleSaveScoringRule}>{editingScoringRule ? "Update" : "Create"} Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Rule Dialog - Updated to use new state management and dialog states */}
      <Dialog open={isBudgetRuleDialogOpen} onOpenChange={setIsBudgetRuleDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBudgetRule ? "Edit Budget Rule" : "Add Budget Rule"}</DialogTitle>
            <DialogDescription>Set budget constraints for {getCurrentSport()?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="budget-rule-name">Rule Name</Label>
              <Input
                id="budget-rule-name"
                placeholder="e.g., Total Budget Cap"
                value={budgetRuleForm.name}
                onChange={(e) => setBudgetRuleForm({ ...budgetRuleForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-rule-desc">Description</Label>
              <Textarea
                id="budget-rule-desc"
                placeholder="Describe this budget rule"
                value={budgetRuleForm.description}
                onChange={(e) => setBudgetRuleForm({ ...budgetRuleForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-budget">Total Budget (M)</Label>
              <Input
                id="total-budget"
                type="number"
                // Ensure value is controlled by number state, default to empty if NaN
                value={budgetRuleForm.totalBudget}
                onChange={(e) =>
                  setBudgetRuleForm({ ...budgetRuleForm, totalBudget: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-player-price">Max Player Price (M)</Label>
              <Input
                id="max-player-price"
                type="number"
                // Ensure value is controlled by number state, default to empty if NaN
                value={budgetRuleForm.maxPlayerPrice}
                onChange={(e) =>
                  setBudgetRuleForm({ ...budgetRuleForm, maxPlayerPrice: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBudgetRuleDialogOpen(false)}>
              Cancel
            </Button>
            {/* Changed button text based on editing state */}
            <Button onClick={handleSaveBudgetRule}>{editingBudgetRule ? "Update" : "Create"} Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
