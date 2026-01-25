"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2} from "lucide-react" 
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
}

export default function TeamRulesTab({
  sportName,
  sportId,
  rules,
  isLoading,
  onAddRule,
  onDeleteRule,
  onToggleRule,
}: TeamRulesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TeamRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isFootball = useMemo(() => sportName.toLowerCase().includes('football'), [sportName])
  const isCricket = useMemo(() => sportName.toLowerCase().includes('cricket'), [sportName])
  
  // Remove match formats checkboxes since formats are stored individually
  const [ruleForm, setRuleForm] = useState(() => ({
    // Basic info
    formatName: "",
    formatCode: "",
    description: "",
    
    // General settings
    totalPlayers: 11,
    playingXiRequired: 11,
    maxPlayersFromSameTeam: isFootball ? 3 : 7,
    fantasyTeamSize: 11,
    captainMultiplier: isFootball ? 2.0 : 1.5,
    viceCaptainMultiplier: isFootball ? 1.5 : 1.25,
    totalCredit: 100,
    maxPlayersPerRealTeam: isFootball ? 3 : 7,
    transferBudgetPerMatch: 5,
    isActive: true,
    displayOrder: 0,
    
    // Cricket specific
    maxOverseasPlayers: 4,
    minBatsmen: 3,
    maxBatsmen: 6,
    minBowlers: 3,
    maxBowlers: 6,
    minAllRounders: 1,
    maxAllRounders: 4,
    minWicketKeepers: 1,
    maxWicketKeepers: 4,
    
    // Cricket format specific
    maxOversPerInnings: isCricket ? 20 : undefined,
    powerplayOvers: isCricket ? 6 : undefined,
    superOverAllowed: false,
    daysLong: 1,
    centuryBonus: 25,
    halfCenturyBonus: 10,
    fiveWicketBonus: 25,
    fourWicketBonus: 10,
    duckPoints: -5,
    maidenOverPoints: 5,
    dotBallPoints: 0.5,
    catchPoints: 10,
    stumpPoints: 15,
    runOutPoints: 15,
    
    // Football specific
    minGoalkeepers: 1,
    maxGoalkeepers: 1,
    minDefenders: 3,
    maxDefenders: 5,
    minMidfielders: 3,
    maxMidfielders: 5,
    minForwards: 1,
    maxForwards: 3,
    
    // Football format specific
    matchDurationMinutes: 90,
  }))

  const handleOpenDialog = (rule?: TeamRule) => {
    if (rule) {
      setEditingRule(rule)
      setRuleForm({ 
        // Basic info
        formatName: rule.formatName || "",
        formatCode: rule.formatCode || "",
        description: rule.description || "",
        
        // General settings
        totalPlayers: rule.totalPlayers || 11,
        playingXiRequired: rule.playingXiRequired || 11,
        maxPlayersFromSameTeam: rule.maxPlayersFromSameTeam || (isFootball ? 3 : 7),
        fantasyTeamSize: rule.fantasyTeamSize || 11,
        captainMultiplier: rule.captainMultiplier || (isFootball ? 2.0 : 1.5),
        viceCaptainMultiplier: rule.viceCaptainMultiplier || (isFootball ? 1.5 : 1.25),
        totalCredit: rule.totalCredit || 100,
        maxPlayersPerRealTeam: rule.maxPlayersPerRealTeam || (isFootball ? 3 : 7),
        transferBudgetPerMatch: rule.transferBudgetPerMatch || 5,
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        displayOrder: rule.displayOrder || 0,
        
        // Cricket specific
        maxOverseasPlayers: rule.maxOverseasPlayers || 4,
        minBatsmen: rule.minBatsmen || 3,
        maxBatsmen: rule.maxBatsmen || 6,
        minBowlers: rule.minBowlers || 3,
        maxBowlers: rule.maxBowlers || 6,
        minAllRounders: rule.minAllRounders || 1,
        maxAllRounders: rule.maxAllRounders || 4,
        minWicketKeepers: rule.minWicketKeepers || 1,
        maxWicketKeepers: rule.maxWicketKeepers || 4,
        
        // Cricket format specific
        maxOversPerInnings: rule.maxOversPerInnings,
        powerplayOvers: rule.powerplayOvers,
        superOverAllowed: rule.superOverAllowed || false,
        daysLong: rule.daysLong || 1,
        centuryBonus: rule.centuryBonus || 25,
        halfCenturyBonus: rule.halfCenturyBonus || 10,
        fiveWicketBonus: rule.fiveWicketBonus || 25,
        fourWicketBonus: rule.fourWicketBonus || 10,
        duckPoints: rule.duckPoints || -5,
        maidenOverPoints: rule.maidenOverPoints || 5,
        dotBallPoints: rule.dotBallPoints || 0.5,
        catchPoints: rule.catchPoints || 10,
        stumpPoints: rule.stumpPoints || 15,
        runOutPoints: rule.runOutPoints || 15,
        
        // Football specific
        minGoalkeepers: rule.minGoalkeepers || 1,
        maxGoalkeepers: rule.maxGoalkeepers || 1,
        minDefenders: rule.minDefenders || 3,
        maxDefenders: rule.maxDefenders || 5,
        minMidfielders: rule.minMidfielders || 3,
        maxMidfielders: rule.maxMidfielders || 5,
        minForwards: rule.minForwards || 1,
        maxForwards: rule.maxForwards || 3,
        
        // Football format specific
        matchDurationMinutes: rule.matchDurationMinutes || 90,
      })
    } else {
      setEditingRule(null)
      setRuleForm({
        // Basic info
        formatName: "",
        formatCode: "",
        description: "",
        
        // General settings
        totalPlayers: 11,
        playingXiRequired: 11,
        maxPlayersFromSameTeam: isFootball ? 3 : 7,
        fantasyTeamSize: 11,
        captainMultiplier: isFootball ? 2.0 : 1.5,
        viceCaptainMultiplier: isFootball ? 1.5 : 1.25,
        totalCredit: 100,
        maxPlayersPerRealTeam: isFootball ? 3 : 7,
        transferBudgetPerMatch: 5,
        isActive: true,
        displayOrder: rules.length,
        
        // Cricket specific
        maxOverseasPlayers: 4,
        minBatsmen: 3,
        maxBatsmen: 6,
        minBowlers: 3,
        maxBowlers: 6,
        minAllRounders: 1,
        maxAllRounders: 4,
        minWicketKeepers: 1,
        maxWicketKeepers: 4,
        
        // Cricket format specific
        maxOversPerInnings: isCricket ? 20 : undefined,
        powerplayOvers: isCricket ? 6 : undefined,
        superOverAllowed: false,
        daysLong: 1,
        centuryBonus: 25,
        halfCenturyBonus: 10,
        fiveWicketBonus: 25,
        fourWicketBonus: 10,
        duckPoints: -5,
        maidenOverPoints: 5,
        dotBallPoints: 0.5,
        catchPoints: 10,
        stumpPoints: 15,
        runOutPoints: 15,
        
        // Football specific
        minGoalkeepers: 1,
        maxGoalkeepers: 1,
        minDefenders: 3,
        maxDefenders: 5,
        minMidfielders: 3,
        maxMidfielders: 5,
        minForwards: 1,
        maxForwards: 3,
        
        // Football format specific
        matchDurationMinutes: 90,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveRule = async () => {
    if (!ruleForm.formatName.trim() || !ruleForm.formatCode.trim()) {
      alert("Format name and code are required.")
      return
    }

    if (!sportId) {
      alert("Please select a sport first.")
      return
    }

    setIsSaving(true)
    try {
      const newRule: TeamRule = {
        id: editingRule?.id || "",
        ...ruleForm
      } as TeamRule

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
              <span className="font-medium">{rule.minWicketKeepers}-{rule.maxWicketKeepers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batsmen:</span>
              <span className="font-medium">{rule.minBatsmen}-{rule.maxBatsmen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All-rounders:</span>
              <span className="font-medium">{rule.minAllRounders}-{rule.maxAllRounders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bowlers:</span>
              <span className="font-medium">{rule.minBowlers}-{rule.maxBowlers}</span>
            </div>
            {rule.maxOverseasPlayers && (
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Max Overseas Players:</span>
                <span className="font-medium">{rule.maxOverseasPlayers}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const getFormatSpecificInfo = (rule: TeamRule) => {
    if (isCricket) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Format Details:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {rule.maxOversPerInnings && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overs per innings:</span>
                <span className="font-medium">{rule.maxOversPerInnings}</span>
              </div>
            )}
            {rule.powerplayOvers && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Powerplay Overs:</span>
                <span className="font-medium">{rule.powerplayOvers}</span>
              </div>
            )}
            {rule.daysLong && rule.daysLong > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match Duration:</span>
                <span className="font-medium">{rule.daysLong} days</span>
              </div>
            )}
          </div>
        </div>
      )
    } else if (isFootball) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Format Details:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {rule.matchDurationMinutes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{rule.matchDurationMinutes} mins</span>
              </div>
            )}
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
          Manage match formats and team composition rules for {sportName}
        </p>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Match Format
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No match formats configured. Click "Add Match Format" to create one.
          </p>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="max-w-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rule.formatName}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{rule.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Code: {rule.formatCode}</Badge>
                      <Badge variant="outline">Order: {rule.displayOrder}</Badge>
                    </div>
                  </div>
                  <Switch 
                    checked={rule.isActive} 
                    onCheckedChange={() => onToggleRule(rule.id)}
                    disabled={isLoading}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getCompositionDisplay(rule)}
                {getFormatSpecificInfo(rule)}

                <div className="space-y-2">
                  <p className="text-sm font-medium">General Settings:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Players:</span>
                      <span className="font-medium">{rule.totalPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Credit:</span>
                      <span className="font-medium">{rule.totalCredit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Captain:</span>
                      <span className="font-medium">{rule.captainMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vice Captain:</span>
                      <span className="font-medium">{rule.viceCaptainMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max per Team:</span>
                      <span className="font-medium">{rule.maxPlayersFromSameTeam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transfer Budget:</span>
                      <span className="font-medium">{rule.transferBudgetPerMatch}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(rule)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteRule(rule.id)}
                    className="flex-1"
                    disabled={isLoading}
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

      {/* Match Format Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Match Format" : "Add New Match Format"}</DialogTitle>
            <DialogDescription>Define match format and team composition for {sportName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format-name">Format Name *</Label>
                <Input
                  id="format-name"
                  placeholder={`e.g., ${isCricket ? 'T20' : 'Standard League Match'}`}
                  value={ruleForm.formatName}
                  onChange={(e) => setRuleForm({ ...ruleForm, formatName: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format-code">Format Code *</Label>
                <Input
                  id="format-code"
                  placeholder={`e.g., ${isCricket ? 't20' : 'standard_90'}`}
                  value={ruleForm.formatCode}
                  onChange={(e) => setRuleForm({ ...ruleForm, formatCode: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this match format"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-players">Total Players</Label>
                <Input
                  id="total-players"
                  type="number"
                  value={ruleForm.totalPlayers}
                  onChange={(e) => setRuleForm({ ...ruleForm, totalPlayers: parseInt(e.target.value) || 11 })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-credit">Total Credit</Label>
                <Input
                  id="total-credit"
                  type="number"
                  step="0.01"
                  value={ruleForm.totalCredit}
                  onChange={(e) => setRuleForm({ ...ruleForm, totalCredit: parseFloat(e.target.value) || 100 })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-order">Display Order</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={ruleForm.displayOrder}
                  onChange={(e) => setRuleForm({ ...ruleForm, displayOrder: parseInt(e.target.value) || 0 })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="captain-multiplier">Captain Multiplier</Label>
                <Input
                  id="captain-multiplier"
                  type="number"
                  step="0.01"
                  value={ruleForm.captainMultiplier}
                  onChange={(e) => setRuleForm({ ...ruleForm, captainMultiplier: parseFloat(e.target.value) || (isFootball ? 2.0 : 1.5) })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vice-captain-multiplier">Vice Captain Multiplier</Label>
                <Input
                  id="vice-captain-multiplier"
                  type="number"
                  step="0.01"
                  value={ruleForm.viceCaptainMultiplier}
                  onChange={(e) => setRuleForm({ ...ruleForm, viceCaptainMultiplier: parseFloat(e.target.value) || (isFootball ? 1.5 : 1.25) })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-players-per-team">Max Players per Real Team</Label>
                <Input
                  id="max-players-per-team"
                  type="number"
                  value={ruleForm.maxPlayersFromSameTeam}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxPlayersFromSameTeam: parseInt(e.target.value) || (isFootball ? 3 : 7) })}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Sport-specific composition rules */}
            {isFootball ? (
              <>
                <div className="space-y-2">
                  <Label>Football Team Composition</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-gk">Min Goalkeepers</Label>
                      <Input
                        id="min-gk"
                        type="number"
                        value={ruleForm.minGoalkeepers}
                        onChange={(e) => setRuleForm({ ...ruleForm, minGoalkeepers: parseInt(e.target.value) || 1 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-gk">Max Goalkeepers</Label>
                      <Input
                        id="max-gk"
                        type="number"
                        value={ruleForm.maxGoalkeepers}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxGoalkeepers: parseInt(e.target.value) || 1 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-def">Min Defenders</Label>
                      <Input
                        id="min-def"
                        type="number"
                        value={ruleForm.minDefenders}
                        onChange={(e) => setRuleForm({ ...ruleForm, minDefenders: parseInt(e.target.value) || 3 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-def">Max Defenders</Label>
                      <Input
                        id="max-def"
                        type="number"
                        value={ruleForm.maxDefenders}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxDefenders: parseInt(e.target.value) || 5 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-mid">Min Midfielders</Label>
                      <Input
                        id="min-mid"
                        type="number"
                        value={ruleForm.minMidfielders}
                        onChange={(e) => setRuleForm({ ...ruleForm, minMidfielders: parseInt(e.target.value) || 3 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-mid">Max Midfielders</Label>
                      <Input
                        id="max-mid"
                        type="number"
                        value={ruleForm.maxMidfielders}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxMidfielders: parseInt(e.target.value) || 5 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-fwd">Min Forwards</Label>
                      <Input
                        id="min-fwd"
                        type="number"
                        value={ruleForm.minForwards}
                        onChange={(e) => setRuleForm({ ...ruleForm, minForwards: parseInt(e.target.value) || 1 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-fwd">Max Forwards</Label>
                      <Input
                        id="max-fwd"
                        type="number"
                        value={ruleForm.maxForwards}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxForwards: parseInt(e.target.value) || 3 })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Football Match Details</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="match-duration">Match Duration (minutes)</Label>
                      <Input
                        id="match-duration"
                        type="number"
                        value={ruleForm.matchDurationMinutes}
                        onChange={(e) => setRuleForm({ ...ruleForm, matchDurationMinutes: parseInt(e.target.value) || 90 })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : isCricket ? (
              <>
                <div className="space-y-2">
                  <Label>Cricket Team Composition</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-wk">Min Wicketkeepers</Label>
                      <Input
                        id="min-wk"
                        type="number"
                        value={ruleForm.minWicketKeepers}
                        onChange={(e) => setRuleForm({ ...ruleForm, minWicketKeepers: parseInt(e.target.value) || 1 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-wk">Max Wicketkeepers</Label>
                      <Input
                        id="max-wk"
                        type="number"
                        value={ruleForm.maxWicketKeepers}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxWicketKeepers: parseInt(e.target.value) || 4 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-bat">Min Batsmen</Label>
                      <Input
                        id="min-bat"
                        type="number"
                        value={ruleForm.minBatsmen}
                        onChange={(e) => setRuleForm({ ...ruleForm, minBatsmen: parseInt(e.target.value) || 3 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-bat">Max Batsmen</Label>
                      <Input
                        id="max-bat"
                        type="number"
                        value={ruleForm.maxBatsmen}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxBatsmen: parseInt(e.target.value) || 6 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-ar">Min All-rounders</Label>
                      <Input
                        id="min-ar"
                        type="number"
                        value={ruleForm.minAllRounders}
                        onChange={(e) => setRuleForm({ ...ruleForm, minAllRounders: parseInt(e.target.value) || 1 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-ar">Max All-rounders</Label>
                      <Input
                        id="max-ar"
                        type="number"
                        value={ruleForm.maxAllRounders}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxAllRounders: parseInt(e.target.value) || 4 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-bowl">Min Bowlers</Label>
                      <Input
                        id="min-bowl"
                        type="number"
                        value={ruleForm.minBowlers}
                        onChange={(e) => setRuleForm({ ...ruleForm, minBowlers: parseInt(e.target.value) || 3 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-bowl">Max Bowlers</Label>
                      <Input
                        id="max-bowl"
                        type="number"
                        value={ruleForm.maxBowlers}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxBowlers: parseInt(e.target.value) || 6 })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-overseas">Max Overseas Players</Label>
                      <Input
                        id="max-overseas"
                        type="number"
                        value={ruleForm.maxOverseasPlayers}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxOverseasPlayers: parseInt(e.target.value) || 4 })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Cricket Format Details</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-overs">Max Overs per Innings</Label>
                      <Input
                        id="max-overs"
                        type="number"
                        value={ruleForm.maxOversPerInnings || ""}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxOversPerInnings: parseInt(e.target.value) || undefined })}
                        disabled={isSaving}
                        placeholder="e.g., 20 for T20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="powerplay-overs">Powerplay Overs</Label>
                      <Input
                        id="powerplay-overs"
                        type="number"
                        value={ruleForm.powerplayOvers || ""}
                        onChange={(e) => setRuleForm({ ...ruleForm, powerplayOvers: parseInt(e.target.value) || undefined })}
                        disabled={isSaving}
                        placeholder="e.g., 6 for T20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="days-long">Match Days</Label>
                      <Input
                        id="days-long"
                        type="number"
                        value={ruleForm.daysLong}
                        onChange={(e) => setRuleForm({ ...ruleForm, daysLong: parseInt(e.target.value) || 1 })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={ruleForm.isActive}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
                disabled={isSaving}
              />
              <Label htmlFor="is-active">Active Format</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={isSaving}>
              {isSaving ? "Saving..." : editingRule ? "Update" : "Create"} Format
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}