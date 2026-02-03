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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScoringRule, getMatchFormatsForSport } from "../page"

interface ScoringRulesTabProps {
  sportName: string
  sportId: string
  rules: ScoringRule[]
  isLoading: boolean
  onAddRule: (rule: ScoringRule) => Promise<void>
  onEditRule: (rule: ScoringRule) => void
  onDeleteRule: (id: string) => Promise<void>
  onToggleRule: (id: string) => Promise<void>
  onToggleLock: (id: string) => Promise<void>
}

// Sport-specific categories and actions
const CRICKET_CATEGORIES = ['batting', 'bowling', 'fielding', 'economy', 'strike_rate', 'milestone', 'miscellaneous'];
const FOOTBALL_CATEGORIES = ['attacking', 'defensive', 'goalkeeping', 'disciplinary', 'appearance', 'miscellaneous'];

const CRICKET_ACTION_TYPES = {
  batting: ['run', 'boundary_four', 'boundary_six', 'thirty', 'half_century', 'century', 'duck', 'strike_rate'],
  bowling: ['wicket', 'maiden_over', 'three_wicket_haul', 'four_wicket_haul', 'five_wicket_haul', 'economy_rate'],
  fielding: ['catch', 'run_out', 'stumping', 'direct_hit'],
  economy: ['economy_bonus', 'economy_penalty'],
  strike_rate: ['strike_rate_bonus', 'strike_rate_penalty'],
  milestone: ['milestone_bonus'],
  miscellaneous: ['captain', 'vice_captain', 'player_of_match']
};

const FOOTBALL_ACTION_TYPES = {
  attacking: ['goal_forward', 'goal_midfielder', 'goal_defender', 'goal_goalkeeper', 'assist', 'shot_on_target', 'chance_created', 'penalty_goal', 'free_kick_goal'],
  defensive: ['clean_sheet', 'tackle', 'interception', 'block', 'clearance', 'goals_conceded'],
  goalkeeping: ['save', 'penalty_save', 'catch_gk', 'punch_clear', 'goals_conceded_gk'], // Changed 'catch' to 'catch_gk'
  disciplinary: ['yellow_card', 'red_card', 'foul', 'penalty_conceded'],
  appearance: ['minutes_played', 'substitute_appearance'],
  miscellaneous: ['own_goal', 'penalty_miss', 'player_of_match', 'captain', 'vice_captain']
};

export default function ScoringRulesTab({
  sportName,
  sportId,
  rules,
  isLoading,
  onAddRule,
  onDeleteRule,
  onToggleRule,
  onToggleLock
}: ScoringRulesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Use useMemo to avoid recalculating on every render
  const isFootball = useMemo(() => sportName.toLowerCase().includes('football'), [sportName])
  const isCricket = useMemo(() => sportName.toLowerCase().includes('cricket'), [sportName])
  
  // Get sport-specific categories and actions
  const sportCategories = useMemo(() => 
    isFootball ? FOOTBALL_CATEGORIES : CRICKET_CATEGORIES, 
    [isFootball]
  )
  
  const sportActionTypes = useMemo(() => 
    isFootball ? FOOTBALL_ACTION_TYPES : CRICKET_ACTION_TYPES, 
    [isFootball]
  )
  
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

  // Define default values based on sport
  const defaultCategory = isFootball ? "attacking" : "batting";
  const defaultAction = isFootball ? "goal_forward" : "run";

  const [ruleForm, setRuleForm] = useState(() => ({
    name: "",
    description: "",
    category: defaultCategory,
    actionType: defaultAction,
    points: 0,
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
    rangeMin: undefined as number | undefined,
    rangeMax: undefined as number | undefined,
    minRequirement: undefined as number | undefined,
    excludeRunout: false,
    boundaryType: undefined as string | undefined,
    position: "any" as string | undefined,
    minutesPlayed: undefined as number | undefined,
    goalsConcededInterval: undefined as number | undefined,
    isPenalty: false,
    matchFormats: defaultMatchFormats as string[],
    isActive: true,
    isLocked: false
  }))

  const handleOpenDialog = (rule?: ScoringRule) => {
    if (rule) {
      setEditingRule(rule)
      setRuleForm({
        name: rule.name || "",
        description: rule.description || "",
        category: rule.category || defaultCategory,
        actionType: rule.actionType || defaultAction,
        points: rule.points || 0,
        minValue: rule.minValue ?? undefined,
        maxValue: rule.maxValue ?? undefined,
        rangeMin: rule.rangeMin ?? undefined,
        rangeMax: rule.rangeMax ?? undefined,
        minRequirement: rule.minRequirement ?? undefined,
        excludeRunout: rule.excludeRunout ?? false,
        boundaryType: rule.boundaryType ?? undefined,
        position: rule.position ?? "any",
        minutesPlayed: rule.minutesPlayed ?? undefined,
        goalsConcededInterval: rule.goalsConcededInterval ?? undefined,
        isPenalty: rule.isPenalty ?? false,
        matchFormats: rule.matchFormats || defaultMatchFormats,
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        isLocked: rule.isLocked !== undefined ? rule.isLocked : false
      })
    } else {
      setEditingRule(null)
      setRuleForm({
        name: "",
        description: "",
        category: defaultCategory,
        actionType: defaultAction,
        points: 0,
        minValue: undefined as number | undefined,
        maxValue: undefined as number | undefined,
        rangeMin: undefined as number | undefined,
        rangeMax: undefined as number | undefined,
        minRequirement: undefined as number | undefined,
        excludeRunout: false,
        boundaryType: undefined as string | undefined,
        position: "any" as string | undefined,
        minutesPlayed: undefined as number | undefined,
        goalsConcededInterval: undefined as number | undefined,
        isPenalty: false,
        matchFormats: defaultMatchFormats as string[],
        isActive: true,
        isLocked: false
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
      const newRule: ScoringRule = {
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

  // Get action display name
  const getActionDisplayName = (actionType: string) => {
    const actionMap: Record<string, string> = {
      // Cricket actions
      'run': 'Run',
      'boundary_four': 'Boundary (4 runs)',
      'boundary_six': 'Boundary (6 runs)',
      'thirty': '30+ Runs',
      'half_century': 'Half Century (50+ runs)',
      'century': 'Century (100+ runs)',
      'duck': 'Duck (0 runs)',
      'strike_rate': 'Strike Rate Bonus',
      'wicket': 'Wicket',
      'maiden_over': 'Maiden Over',
      'three_wicket_haul': '3 Wicket Haul',
      'four_wicket_haul': '4 Wicket Haul',
      'five_wicket_haul': '5 Wicket Haul',
      'economy_rate': 'Economy Rate',
      'catch': 'Catch',
      'run_out': 'Run Out',
      'stumping': 'Stumping',
      'direct_hit': 'Direct Hit',
      'economy_bonus': 'Economy Bonus',
      'economy_penalty': 'Economy Penalty',
      'strike_rate_bonus': 'Strike Rate Bonus',
      'strike_rate_penalty': 'Strike Rate Penalty',
      'milestone_bonus': 'Milestone Bonus',
      'captain': 'Captain',
      'vice_captain': 'Vice Captain',
      'player_of_match': 'Player of Match',
      
      // Football actions
      'goal_forward': 'Goal (Forward)',
      'goal_midfielder': 'Goal (Midfielder)',
      'goal_defender': 'Goal (Defender)',
      'goal_goalkeeper': 'Goal (Goalkeeper)',
      'assist': 'Assist',
      'shot_on_target': 'Shot on Target',
      'chance_created': 'Chance Created',
      'penalty_goal': 'Penalty Goal',
      'free_kick_goal': 'Free Kick Goal',
      'clean_sheet': 'Clean Sheet',
      'tackle': 'Tackle',
      'interception': 'Interception',
      'block': 'Block',
      'clearance': 'Clearance',
      'goals_conceded': 'Goals Conceded',
      'save': 'Save',
      'penalty_save': 'Penalty Save',
      'catch_gk': 'Catch (GK)', // Changed from 'catch' to 'catch_gk'
      'punch_clear': 'Punch/Clear',
      'goals_conceded_gk': 'Goals Conceded (GK)',
      'yellow_card': 'Yellow Card',
      'red_card': 'Red Card',
      'foul': 'Foul',
      'penalty_conceded': 'Penalty Conceded',
      'minutes_played': 'Minutes Played',
      'substitute_appearance': 'Substitute Appearance',
      'own_goal': 'Own Goal',
      'penalty_miss': 'Penalty Miss',
    };
    
    return actionMap[actionType] || actionType.replace('_', ' ');
  }

  // Get position display name
  const getPositionDisplayName = (position?: string) => {
    if (!position || position === 'any') return 'Any';
    const positionMap: Record<string, string> = {
      'goalkeeper': 'Goalkeeper',
      'defender': 'Defender',
      'midfielder': 'Midfielder',
      'forward': 'Forward'
    };
    return positionMap[position] || position;
  }

  // Group scoring rules by category
  const groupedRules = useMemo(() => {
    const groups: Record<string, ScoringRule[]> = {};
    
    sportCategories.forEach(category => {
      const categoryRules = rules.filter(r => r.category === category);
      if (categoryRules.length > 0) {
        groups[category] = categoryRules;
      }
    });
    
    return groups;
  }, [rules, sportCategories]);

  // Get current action types for the selected category
  const currentActionTypes = useMemo(() => {
    return sportActionTypes[ruleForm.category as keyof typeof sportActionTypes] || [];
  }, [ruleForm.category, sportActionTypes]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <p className="text-sm text-muted-foreground">Configure scoring rules for {sportName}</p>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Scoring Rule
        </Button>
      </div>

      {/* Group scoring rules by category */}
      {Object.keys(groupedRules).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scoring rules configured. Click "Add Scoring Rule" to create one.
        </p>
      ) : (
        Object.entries(groupedRules).map(([category, categoryRules]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold capitalize">{category.replace('_', ' ')} Rules</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryRules.map((rule) => (
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

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Points Details:</p>
                      <div className="text-sm">
                        {rule.category === 'economy' || rule.category === 'strike_rate' ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Range:</span>
                            <span className="font-medium">{rule.rangeMin} - {rule.rangeMax}</span>
                          </div>
                        ) : rule.actionType?.includes('milestone') ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Milestone:</span>
                            <span className="font-medium">{rule.minValue}+</span>
                          </div>
                        ) : rule.actionType?.includes('range') ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Range:</span>
                            <span className="font-medium">{rule.minValue} - {rule.maxValue}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Action:</span>
                            <span className="font-medium">{getActionDisplayName(rule.actionType || '')}</span>
                          </div>
                        )}
                        
                        {/* Position display for football */}
                        {isFootball && rule.position && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Position:</span>
                            <span className="font-medium">{getPositionDisplayName(rule.position)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Points:</span>
                          <span className="font-medium">{rule.points > 0 ? '+' : ''}{rule.points}</span>
                        </div>
                        
                        {/* Minutes played for appearance */}
                        {rule.category === 'appearance' && rule.minutesPlayed && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Minutes:</span>
                            <span className="font-medium">{rule.minutesPlayed}+</span>
                          </div>
                        )}
                        
                        {/* Goals conceded interval */}
                        {rule.actionType === 'goals_conceded' && rule.goalsConcededInterval && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Per {rule.goalsConcededInterval} goals:</span>
                          </div>
                        )}
                        
                        {/* Penalty flag */}
                        {rule.isPenalty && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Penalty:</span>
                            <span className="font-medium">Yes</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {rule.minRequirement && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Min Requirement: </span>
                        <span className="font-medium">{rule.minRequirement}</span>
                      </div>
                    )}

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
              ))}
            </div>
          </div>
        ))
      )}

      {/* Scoring Rule Dialog */}
      <Dialog key={editingRule?.id || "new-rule"} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Scoring Rule" : "Add Scoring Rule"}</DialogTitle>
            <DialogDescription>Configure points for actions in {sportName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scoring-rule-name">Rule Name</Label>
              <Input
                id="scoring-rule-name"
                placeholder={isFootball ? "e.g., Goal Scoring, Clean Sheet Points" : "e.g., Run Scoring, Wicket Points"}
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scoring-rule-desc">Description</Label>
              <Textarea
                id="scoring-rule-desc"
                placeholder="Describe this scoring rule"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={ruleForm.category}
                  onValueChange={(value) => {
                    const actionTypes = sportActionTypes[value as keyof typeof sportActionTypes];
                    setRuleForm({ 
                      ...ruleForm, 
                      category: value, 
                      actionType: actionTypes && actionTypes.length > 0 ? actionTypes[0] : defaultAction
                    })
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-type">Action Type</Label>
                <Select
                  value={ruleForm.actionType}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, actionType: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentActionTypes.length > 0 ? (
                      currentActionTypes.map((action) => (
                        <SelectItem key={action} value={action}>
                          {getActionDisplayName(action)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default" disabled>
                        No actions available for this category
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={ruleForm.points}
                onChange={(e) => setRuleForm({ ...ruleForm, points: Number.parseFloat(e.target.value) || 0 })}
                disabled={isSaving}
              />
            </div>

            {/* Football-specific fields */}
            {isFootball && (
              <>
                {/* Position selector for certain actions */}
                {(ruleForm.actionType?.includes('goal') || ruleForm.actionType === 'clean_sheet') && (
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={ruleForm.position || 'any'}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, position: value })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Position</SelectItem>
                        <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                        <SelectItem value="defender">Defender</SelectItem>
                        <SelectItem value="midfielder">Midfielder</SelectItem>
                        <SelectItem value="forward">Forward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Minutes played for appearance points */}
                {ruleForm.category === 'appearance' && (
                  <div className="space-y-2">
                    <Label htmlFor="minutes-played">Minutes Required</Label>
                    <Input
                      id="minutes-played"
                      type="number"
                      placeholder="e.g., 60 for 60+ minutes"
                      value={ruleForm.minutesPlayed || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, minutesPlayed: Number.parseInt(e.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                )}

                {/* Goals conceded interval */}
                {ruleForm.actionType === 'goals_conceded' && (
                  <div className="space-y-2">
                    <Label htmlFor="goals-interval">Goals Conceded Interval</Label>
                    <Input
                      id="goals-interval"
                      type="number"
                      placeholder="e.g., 2 for every 2 goals"
                      value={ruleForm.goalsConcededInterval || 2}
                      onChange={(e) => setRuleForm({ ...ruleForm, goalsConcededInterval: Number.parseInt(e.target.value) || 2 })}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Points deducted for every X goals conceded (e.g., -2 points for every 2 goals)
                    </p>
                  </div>
                )}

                {/* Penalty flag for goal actions */}
                {(ruleForm.actionType?.includes('goal') || ruleForm.actionType?.includes('save') || ruleForm.actionType?.includes('miss') || ruleForm.actionType?.includes('conceded')) && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-penalty"
                      checked={ruleForm.isPenalty}
                      onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isPenalty: checked as boolean })}
                      disabled={isSaving}
                    />
                    <Label htmlFor="is-penalty" className="text-sm font-normal">
                      Penalty Situation
                    </Label>
                  </div>
                )}
              </>
            )}

            {/* Cricket-specific conditional fields */}
            {isCricket && (
              <>
                {ruleForm.actionType?.includes('milestone') && (
                  <div className="space-y-2">
                    <Label htmlFor="min-value">Milestone Value</Label>
                    <Input
                      id="min-value"
                      type="number"
                      placeholder={ruleForm.actionType === 'thirty' ? "30" : ruleForm.actionType === 'half_century' ? "50" : "100"}
                      value={ruleForm.minValue || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, minValue: Number.parseInt(e.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                )}

                {(ruleForm.actionType === 'range' || ruleForm.category === 'economy' || ruleForm.category === 'strike_rate') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="range-min">Range Min</Label>
                      <Input
                        id="range-min"
                        type="number"
                        step="0.01"
                        placeholder={ruleForm.category === 'economy' ? "e.g., 0.00" : "e.g., 100.00"}
                        value={ruleForm.rangeMin || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, rangeMin: Number.parseFloat(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="range-max">Range Max</Label>
                      <Input
                        id="range-max"
                        type="number"
                        step="0.01"
                        placeholder={ruleForm.category === 'economy' ? "e.g., 5.00" : "e.g., 200.00"}
                        value={ruleForm.rangeMax || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, rangeMax: Number.parseFloat(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}

                {(ruleForm.category === 'economy' || ruleForm.category === 'strike_rate') && (
                  <div className="space-y-2">
                    <Label htmlFor="min-requirement">Minimum Requirement</Label>
                    <Input
                      id="min-requirement"
                      type="number"
                      placeholder="e.g., 2 overs, 10 balls"
                      value={ruleForm.minRequirement || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, minRequirement: Number.parseInt(e.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                )}

                {ruleForm.actionType === 'wicket' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exclude-runout"
                      checked={ruleForm.excludeRunout}
                      onCheckedChange={(checked) => setRuleForm({ ...ruleForm, excludeRunout: checked as boolean })}
                      disabled={isSaving}
                    />
                    <Label htmlFor="exclude-runout" className="text-sm font-normal">
                      Exclude run-out wickets
                    </Label>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Match Formats</Label>
              <div className="flex flex-wrap gap-2">
                {sportMatchFormats.map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={`scoring-format-${format.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={ruleForm.matchFormats.includes(format)}
                      onCheckedChange={() => handleMatchFormatToggle(format)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`scoring-format-${format.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm font-normal">
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