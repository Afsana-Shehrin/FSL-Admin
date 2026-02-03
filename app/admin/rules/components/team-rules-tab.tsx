"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Lock, LockOpen } from "lucide-react"
import { Switch } from "@/components/ui/switch"
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
import { Checkbox } from "@/components/ui/checkbox"
import { TeamRule, getMatchFormatsForSport } from "../page"

interface TeamRulesTabProps {
  sportName: string
  sportId: string
  rules: TeamRule[]
  isLoading: boolean
  onAddRule: (rule: TeamRule) => Promise<void>
  onEditRule: (rule: TeamRule) => void
  onDeleteRule: (id: string) => Promise<void>
  onToggleRule: (id: string) => Promise<void>
  onToggleLock: (id: string) => Promise<void>
}

export default function TeamRulesTab({
  sportName,
  sportId,
  rules,
  isLoading,
  onAddRule,
  onDeleteRule,
  onToggleRule,
  onToggleLock
}: TeamRulesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TeamRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Use useMemo to avoid recalculating on every render
  const isFootball = useMemo(() => sportName.toLowerCase().includes('football'), [sportName])
  const isCricket = useMemo(() => sportName.toLowerCase().includes('cricket'), [sportName])
  
  // Get match formats based on sport
  const sportMatchFormats = useMemo(() => 
    getMatchFormatsForSport(sportName), 
    [sportName]
  )
  
  const defaultMatchFormats = useMemo(() => 
    isFootball 
      ? ['Standard League Match (90-Minute)'] 
      : ['T20', 'ODI', 'Test', 'T10'],
    [isFootball]
  )

  const [ruleForm, setRuleForm] = useState(() => ({
    name: "",
    description: "",
    totalCredits: 100,
    maxPlayersPerTeam: isFootball ? 3 : 7,
    totalPlayers: 11,
    matchFormats: defaultMatchFormats,
    captainMultiplier: 2,
    viceCaptainMultiplier: 1.5,
    isActive: true,
    isLocked: false,
    // Cricket-specific fields
    minWicketkeepers: 1,
    maxWicketkeepers: 2,
    minBatsmen: 3,
    maxBatsmen: 6,
    minAllrounders: 1,
    maxAllrounders: 4,
    minBowlers: 3,
    maxBowlers: 6,
    // Football-specific fields
    minGoalkeepers: 1,
    maxGoalkeepers: 1,
    minDefenders: 3,
    maxDefenders: 5,
    minMidfielders: 3,
    maxMidfielders: 5,
    minForwards: 1,
    maxForwards: 3,
    maxPlayersPerRealTeam: 3,
  }))

  const handleOpenDialog = (rule?: TeamRule) => {
    if (rule) {
      setEditingRule(rule)
      setRuleForm({ 
        name: rule.name || "",
        description: rule.description || "",
        totalCredits: rule.totalCredits || 100,
        maxPlayersPerTeam: rule.maxPlayersPerTeam || (isFootball ? 3 : 7),
        totalPlayers: rule.totalPlayers || 11,
        matchFormats: rule.matchFormats || defaultMatchFormats,
        captainMultiplier: rule.captainMultiplier || 2,
        viceCaptainMultiplier: rule.viceCaptainMultiplier || 1.5,
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        isLocked: rule.isLocked !== undefined ? rule.isLocked : false,
        // Cricket-specific fields
        minWicketkeepers: rule.minWicketkeepers || 1,
        maxWicketkeepers: rule.maxWicketkeepers || 2,
        minBatsmen: rule.minBatsmen || 3,
        maxBatsmen: rule.maxBatsmen || 6,
        minAllrounders: rule.minAllrounders || 1,
        maxAllrounders: rule.maxAllrounders || 4,
        minBowlers: rule.minBowlers || 3,
        maxBowlers: rule.maxBowlers || 6,
        // Football-specific fields with optional chaining
        minGoalkeepers: rule.minGoalkeepers || 1,
        maxGoalkeepers: rule.maxGoalkeepers || 1,
        minDefenders: rule.minDefenders || 3,
        maxDefenders: rule.maxDefenders || 5,
        minMidfielders: rule.minMidfielders || 3,
        maxMidfielders: rule.maxMidfielders || 5,
        minForwards: rule.minForwards || 1,
        maxForwards: rule.maxForwards || 3,
        maxPlayersPerRealTeam: rule.maxPlayersPerRealTeam || 3,
      })
    } else {
      setEditingRule(null)
      setRuleForm({
        name: "",
        description: "",
        totalCredits: 100,
        maxPlayersPerTeam: isFootball ? 3 : 7,
        totalPlayers: 11,
        matchFormats: defaultMatchFormats,
        captainMultiplier: 2,
        viceCaptainMultiplier: 1.5,
        isActive: true,
        isLocked: false,
        // Cricket-specific fields
        minWicketkeepers: 1,
        maxWicketkeepers: 2,
        minBatsmen: 3,
        maxBatsmen: 6,
        minAllrounders: 1,
        maxAllrounders: 4,
        minBowlers: 3,
        maxBowlers: 6,
        // Football-specific fields
        minGoalkeepers: 1,
        maxGoalkeepers: 1,
        minDefenders: 3,
        maxDefenders: 5,
        minMidfielders: 3,
        maxMidfielders: 5,
        minForwards: 1,
        maxForwards: 3,
        maxPlayersPerRealTeam: 3,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveRule = async () => {
    if (!ruleForm.name.trim()) {
      alert("Rule name is required.")
      return
    }

    if (!sportId) {
      alert("Please select a sport first.")
      return
    }

    setIsSaving(true)
    try {
      const newRule: TeamRule = {
        // Don't generate ID - let the database do it
        id: editingRule?.id || "", // Empty string for new rules
        sportId: sportId,
        ...ruleForm
      }

      await onAddRule(newRule)
      setIsDialogOpen(false)
      setEditingRule(null)
      
    } catch (error) {
      console.error("Failed to save rule:", error)
      alert("Failed to save rule. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleMatchFormatToggle = (format: string) => {
    const currentFormats = ruleForm.matchFormats
    const newFormats = currentFormats.includes(format)
      ? currentFormats.filter(f => f !== format)
      : [...currentFormats, format]
    setRuleForm({ ...ruleForm, matchFormats: newFormats })
  }

  const getCompositionDisplay = (rule: TeamRule) => {
    if (isFootball) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Team Composition:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Goalkeepers:</span>
              <span className="font-medium">{(rule.minGoalkeepers || 1)}-{(rule.maxGoalkeepers || 1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Defenders:</span>
              <span className="font-medium">{(rule.minDefenders || 3)}-{(rule.maxDefenders || 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Midfielders:</span>
              <span className="font-medium">{(rule.minMidfielders || 3)}-{(rule.maxMidfielders || 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Forwards:</span>
              <span className="font-medium">{(rule.minForwards || 1)}-{(rule.maxForwards || 3)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Max per Real Team:</span>
              <span className="font-medium">{rule.maxPlayersPerRealTeam || 3}</span>
            </div>
          </div>
        </div>
      )
    } else if (isCricket) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Team Composition:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wicketkeepers:</span>
              <span className="font-medium">{rule.minWicketkeepers}-{rule.maxWicketkeepers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batsmen:</span>
              <span className="font-medium">{rule.minBatsmen}-{rule.maxBatsmen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All-rounders:</span>
              <span className="font-medium">{rule.minAllrounders}-{rule.maxAllrounders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bowlers:</span>
              <span className="font-medium">{rule.minBowlers}-{rule.maxBowlers}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Define team composition rules for {sportName}
        </p>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Team Rule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No team composition rules configured. Click "Add Team Rule" to create one.
          </p>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="max-w-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{rule.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Switch 
                      checked={rule.isActive} 
                      onCheckedChange={() => onToggleRule(rule.id)}
                      disabled={isLoading}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleLock(rule.id)}
                      disabled={isLoading}
                    >
                      {rule.isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={rule.isLocked ? "destructive" : "outline"}>
                    {rule.isLocked ? "Locked" : "Editable"}
                  </Badge>
                </div>

                {getCompositionDisplay(rule)}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Settings:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Credits:</span>
                      <span className="font-medium">{rule.totalCredits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max per Team:</span>
                      <span className="font-medium">{rule.maxPlayersPerTeam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Players:</span>
                      <span className="font-medium">{rule.totalPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Captain Multiplier:</span>
                      <span className="font-medium">{rule.captainMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vice Captain:</span>
                      <span className="font-medium">{rule.viceCaptainMultiplier}x</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Match Formats:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.matchFormats?.map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(rule)}
                    className="flex-1"
                    disabled={rule.isLocked || isLoading}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteRule(rule.id)}
                    className="flex-1"
                    disabled={rule.isLocked || isLoading}
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

      {/* Team Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Team Rule" : "Add Team Composition Rule"}</DialogTitle>
            <DialogDescription>Define team composition requirements for {sportName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-rule-name">Rule Name</Label>
              <Input
                id="team-rule-name"
                placeholder={`e.g., Standard ${sportName} Team Rules`}
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-rule-desc">Description</Label>
              <Textarea
                id="team-rule-desc"
                placeholder="Describe this team composition rule"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-credits">Total Credits</Label>
                <Input
                  id="total-credits"
                  type="number"
                  value={ruleForm.totalCredits}
                  onChange={(e) => setRuleForm({ ...ruleForm, totalCredits: Number.parseFloat(e.target.value) || 100 })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-players-per-team">Max Players per Real Team</Label>
                <Input
                  id="max-players-per-team"
                  type="number"
                  value={ruleForm.maxPlayersPerTeam}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxPlayersPerTeam: Number.parseInt(e.target.value) || (isFootball ? 3 : 7) })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-players">Total Players</Label>
                <Input
                  id="total-players"
                  type="number"
                  value={ruleForm.totalPlayers}
                  onChange={(e) => setRuleForm({ ...ruleForm, totalPlayers: Number.parseInt(e.target.value) || 11 })}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Sport-specific composition rules */}
            {isFootball ? (
              <div className="space-y-2">
                <Label>Football Team Composition</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-gk">Min Goalkeepers</Label>
                    <Input
                      id="min-gk"
                      type="number"
                      value={ruleForm.minGoalkeepers}
                      onChange={(e) => setRuleForm({ ...ruleForm, minGoalkeepers: Number.parseInt(e.target.value) || 1 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-gk">Max Goalkeepers</Label>
                    <Input
                      id="max-gk"
                      type="number"
                      value={ruleForm.maxGoalkeepers}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxGoalkeepers: Number.parseInt(e.target.value) || 1 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-def">Min Defenders</Label>
                    <Input
                      id="min-def"
                      type="number"
                      value={ruleForm.minDefenders}
                      onChange={(e) => setRuleForm({ ...ruleForm, minDefenders: Number.parseInt(e.target.value) || 3 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-def">Max Defenders</Label>
                    <Input
                      id="max-def"
                      type="number"
                      value={ruleForm.maxDefenders}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxDefenders: Number.parseInt(e.target.value) || 5 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-mid">Min Midfielders</Label>
                    <Input
                      id="min-mid"
                      type="number"
                      value={ruleForm.minMidfielders}
                      onChange={(e) => setRuleForm({ ...ruleForm, minMidfielders: Number.parseInt(e.target.value) || 3 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-mid">Max Midfielders</Label>
                    <Input
                      id="max-mid"
                      type="number"
                      value={ruleForm.maxMidfielders}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxMidfielders: Number.parseInt(e.target.value) || 5 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-fwd">Min Forwards</Label>
                    <Input
                      id="min-fwd"
                      type="number"
                      value={ruleForm.minForwards}
                      onChange={(e) => setRuleForm({ ...ruleForm, minForwards: Number.parseInt(e.target.value) || 1 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-fwd">Max Forwards</Label>
                    <Input
                      id="max-fwd"
                      type="number"
                      value={ruleForm.maxForwards}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxForwards: Number.parseInt(e.target.value) || 3 })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            ) : isCricket ? (
              <div className="space-y-2">
                <Label>Cricket Team Composition</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-wk">Min Wicketkeepers</Label>
                    <Input
                      id="min-wk"
                      type="number"
                      value={ruleForm.minWicketkeepers}
                      onChange={(e) => setRuleForm({ ...ruleForm, minWicketkeepers: Number.parseInt(e.target.value) || 1 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-wk">Max Wicketkeepers</Label>
                    <Input
                      id="max-wk"
                      type="number"
                      value={ruleForm.maxWicketkeepers}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxWicketkeepers: Number.parseInt(e.target.value) || 2 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-bat">Min Batsmen</Label>
                    <Input
                      id="min-bat"
                      type="number"
                      value={ruleForm.minBatsmen}
                      onChange={(e) => setRuleForm({ ...ruleForm, minBatsmen: Number.parseInt(e.target.value) || 3 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-bat">Max Batsmen</Label>
                    <Input
                      id="max-bat"
                      type="number"
                      value={ruleForm.maxBatsmen}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxBatsmen: Number.parseInt(e.target.value) || 6 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-ar">Min All-rounders</Label>
                    <Input
                      id="min-ar"
                      type="number"
                      value={ruleForm.minAllrounders}
                      onChange={(e) => setRuleForm({ ...ruleForm, minAllrounders: Number.parseInt(e.target.value) || 1 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-ar">Max All-rounders</Label>
                    <Input
                      id="max-ar"
                      type="number"
                      value={ruleForm.maxAllrounders}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxAllrounders: Number.parseInt(e.target.value) || 4 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-bowl">Min Bowlers</Label>
                    <Input
                      id="min-bowl"
                      type="number"
                      value={ruleForm.minBowlers}
                      onChange={(e) => setRuleForm({ ...ruleForm, minBowlers: Number.parseInt(e.target.value) || 3 })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-bowl">Max Bowlers</Label>
                    <Input
                      id="max-bowl"
                      type="number"
                      value={ruleForm.maxBowlers}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxBowlers: Number.parseInt(e.target.value) || 6 })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>General Team Composition</Label>
                <p className="text-sm text-muted-foreground">
                  Custom team composition rules for {sportName}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Match Formats</Label>
              <div className="flex flex-wrap gap-2">
                {sportMatchFormats.map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-format-${format.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={ruleForm.matchFormats.includes(format)}
                      onCheckedChange={() => handleMatchFormatToggle(format)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`team-format-${format.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm font-normal">
                      {format}
                    </Label>
                  </div>
                ))}
              </div>
              {isFootball && (
                <p className="text-xs text-muted-foreground mt-2">
                  • Standard League Match: 90 minutes (2 × 45)<br/>
                  • Knockout Match: 90 minutes (cup format)<br/>
                  • Extra-Time Match: 120 minutes (90 + 30)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="captain-multiplier">Captain Multiplier</Label>
                <Input
                  id="captain-multiplier"
                  type="number"
                  step="0.1"
                  value={ruleForm.captainMultiplier}
                  onChange={(e) => setRuleForm({ ...ruleForm, captainMultiplier: Number.parseFloat(e.target.value) || 2 })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vice-captain-multiplier">Vice Captain Multiplier</Label>
                <Input
                  id="vice-captain-multiplier"
                  type="number"
                  step="0.1"
                  value={ruleForm.viceCaptainMultiplier}
                  onChange={(e) => setRuleForm({ ...ruleForm, viceCaptainMultiplier: Number.parseFloat(e.target.value) || 1.5 })}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={isSaving}>
              {isSaving ? "Saving..." : editingRule ? "Update" : "Create"} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}