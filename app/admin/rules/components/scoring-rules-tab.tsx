"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Lock, LockOpen, Filter } from "lucide-react"
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
const CRICKET_CATEGORIES = ['batting', 'bowling', 'fielding', 'economy', 'strike_rate', 'milestone', 'wicket_type', 'miscellaneous'];
const FOOTBALL_CATEGORIES = ['attacking', 'defensive', 'goalkeeping', 'disciplinary', 'appearance', 'miscellaneous'];

const CRICKET_ACTION_TYPES = {
  batting: [
    'run', 
    'boundary_four', 
    'boundary_six', 
    'thirty', 
    'seventy_five', 
    'half_century', 
    'century', 
    'duck', 
    'strike_rate_bonus', 
    'strike_rate_penalty'
  ],
  bowling: [
    'wicket', 
    'maiden_over', 
    'dot_ball', 
    'three_wicket_haul', 
    'four_wicket_haul', 
    'five_wicket_haul', 
    'economy_rate_bonus', 
    'economy_rate_penalty'
  ],
  fielding: ['catch', 'run_out', 'stumping', 'direct_hit'],
  wicket_type: ['bowled_bonus', 'lbw_bonus', 'caught_bonus', 'stump_bonus', 'runout_bonus'],
  economy: ['economy_rate'],
  strike_rate: ['strike_rate'],
  milestone: ['milestone_bonus'],
  miscellaneous: ['captain', 'vice_captain', 'player_of_match']
};

const FOOTBALL_ACTION_TYPES = {
  attacking: ['goal_forward', 'goal_midfielder', 'goal_defender', 'goal_goalkeeper', 'assist', 'shot_on_target', 'chance_created', 'penalty_goal', 'free_kick_goal'],
  defensive: ['clean_sheet', 'tackle', 'interception', 'block', 'clearance', 'goals_conceded'],
  goalkeeping: ['save', 'penalty_save', 'catch_gk', 'punch_clear', 'goals_conceded_gk'],
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
  
  // Filter states
  const [selectedFormat, setSelectedFormat] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

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
      : ['T20'],
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
    isLocked: false,
    displayOrder: 0,
    
    // Cricket specific fields
    wicketType: undefined as string | undefined,
    thresholdValue: undefined as number | undefined,
    bonusMultiplier: undefined as number | undefined,
    penaltyMultiplier: undefined as number | undefined,
    
    // Multiplier fields
    battingPointMultiplier: undefined as number | undefined,
    bowlingPointMultiplier: undefined as number | undefined,
    fieldingPointMultiplier: undefined as number | undefined,
    economyBonusMultiplier: undefined as number | undefined,
    strikeRateBonusMultiplier: undefined as number | undefined
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
        isLocked: rule.isLocked !== undefined ? rule.isLocked : false,
        displayOrder: rule.displayOrder || 0,
        wicketType: rule.wicketType ?? undefined,
        thresholdValue: rule.thresholdValue ?? undefined,
        bonusMultiplier: rule.bonusMultiplier ?? undefined,
        penaltyMultiplier: rule.penaltyMultiplier ?? undefined,
        battingPointMultiplier: rule.battingPointMultiplier ?? undefined,
        bowlingPointMultiplier: rule.bowlingPointMultiplier ?? undefined,
        fieldingPointMultiplier: rule.fieldingPointMultiplier ?? undefined,
        economyBonusMultiplier: rule.economyBonusMultiplier ?? undefined,
        strikeRateBonusMultiplier: rule.strikeRateBonusMultiplier ?? undefined
      })
    } else {
      setEditingRule(null)
      setRuleForm({
        name: "",
        description: "",
        category: defaultCategory,
        actionType: defaultAction,
        points: getDefaultPoints(defaultAction),
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
        isLocked: false,
        displayOrder: rules.length,
        wicketType: undefined as string | undefined,
        thresholdValue: undefined as number | undefined,
        bonusMultiplier: undefined as number | undefined,
        penaltyMultiplier: undefined as number | undefined,
        battingPointMultiplier: undefined as number | undefined,
        bowlingPointMultiplier: undefined as number | undefined,
        fieldingPointMultiplier: undefined as number | undefined,
        economyBonusMultiplier: undefined as number | undefined,
        strikeRateBonusMultiplier: undefined as number | undefined
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

    if (ruleForm.matchFormats.length === 0) {
      alert("Please select at least one match format.")
      return
    }

    setIsSaving(true)
    try {
      const newRule: ScoringRule = {
        id: editingRule?.id || "",
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
      'thirty': '30+ Runs Bonus',
      'seventy_five': '75+ Runs Bonus',
      'half_century': 'Half Century (50+ runs)',
      'century': 'Century (100+ runs)',
      'duck': 'Duck (0 runs)',
      'strike_rate_bonus': 'Strike Rate Bonus',
      'strike_rate_penalty': 'Strike Rate Penalty',
      'wicket': 'Wicket',
      'maiden_over': 'Maiden Over',
      'dot_ball': 'Dot Ball',
      'three_wicket_haul': '3 Wicket Haul Bonus',
      'four_wicket_haul': '4 Wicket Haul Bonus',
      'five_wicket_haul': '5 Wicket Haul Bonus',
      'economy_rate_bonus': 'Economy Rate Bonus',
      'economy_rate_penalty': 'Economy Rate Penalty',
      'catch': 'Catch',
      'run_out': 'Run Out',
      'stumping': 'Stumping',
      'direct_hit': 'Direct Hit',
      'bowled_bonus': 'Bowled Bonus',
      'lbw_bonus': 'LBW Bonus',
      'caught_bonus': 'Caught Bonus',
      'stump_bonus': 'Stumping Bonus',
      'runout_bonus': 'Run Out Bonus',
      'economy_rate': 'Economy Rate',
      'strike_rate': 'Strike Rate',
      'milestone_bonus': 'Milestone Bonus',
      'captain': 'Captain Multiplier',
      'vice_captain': 'Vice Captain Multiplier',
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
      'catch_gk': 'Catch (GK)',
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

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Get points display
  const getPointsDisplay = (rule: ScoringRule) => {
    if (rule.actionType === 'captain' || rule.actionType === 'vice_captain') {
      return `×${rule.points}`;
    }
    if (rule.points > 0) {
      return `+${rule.points}`;
    }
    return rule.points.toString();
  }

  // Get current action types for the selected category
  const currentActionTypes = useMemo(() => {
    return sportActionTypes[ruleForm.category as keyof typeof sportActionTypes] || [];
  }, [ruleForm.category, sportActionTypes]);

  // Get default points based on action type
  const getDefaultPoints = (actionType: string) => {
    const defaultPoints: Record<string, number> = {
      'run': 1,
      'boundary_four': 1,
      'boundary_six': 2,
      'thirty': 4,
      'seventy_five': 8,
      'half_century': 8,
      'century': 16,
      'duck': -5,
      'wicket': 25,
      'maiden_over': 5,
      'dot_ball': 0.5,
      'three_wicket_haul': 4,
      'four_wicket_haul': 8,
      'five_wicket_haul': 12,
      'catch': 8,
      'run_out': 12,
      'stumping': 12,
      'direct_hit': 6,
      'bowled_bonus': 8,
      'lbw_bonus': 8,
      'caught_bonus': 0,
      'stump_bonus': 12,
      'runout_bonus': 12,
      'strike_rate_bonus': 6,
      'strike_rate_penalty': -6,
      'economy_rate_bonus': 6,
      'economy_rate_penalty': -6,
      'captain': 2,
      'vice_captain': 1.5,
      'player_of_match': 50,
      // Football defaults
      'goal_forward': 6,
      'goal_midfielder': 5,
      'goal_defender': 6,
      'goal_goalkeeper': 10,
      'assist': 3,
      'clean_sheet': 4,
      'penalty_save': 5,
      'penalty_miss': -2,
      'yellow_card': -1,
      'red_card': -3,
      'own_goal': -2
    };
    
    return defaultPoints[actionType] || 0;
  };

  // Filter rules based on selected filters
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      // Format filter
      if (selectedFormat !== "all") {
        const hasFormat = rule.matchFormats?.includes(selectedFormat);
        if (!hasFormat) return false;
      }
      
      // Category filter
      if (selectedCategory !== "all") {
        if (rule.category !== selectedCategory) return false;
      }
      
      return true;
    });
  }, [rules, selectedFormat, selectedCategory]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedFormat("all");
    setSelectedCategory("all");
  };

  // Update points when action type changes
  const handleActionTypeChange = (value: string) => {
    const defaultPoints = getDefaultPoints(value)
    setRuleForm({ 
      ...ruleForm, 
      actionType: value,
      points: defaultPoints
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Scoring Rules</CardTitle>
                <CardDescription>Configure scoring rules for {sportName}</CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Scoring Rule
              </Button>
            </div>
            
            {/* Filter section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Format filter */}
                <div className="space-y-1">
                  <Label htmlFor="format-filter" className="text-xs">Format</Label>
                  <Select
                    value={selectedFormat}
                    onValueChange={setSelectedFormat}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Formats</SelectItem>
                      {sportMatchFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Category filter */}
                <div className="space-y-1">
                  <Label htmlFor="category-filter" className="text-xs">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {sportCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryDisplayName(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear filters button */}
                {(selectedFormat !== "all" || selectedCategory !== "all") && (
                  <div className="space-y-1">
                    <Label className="text-xs opacity-0">Clear</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-10"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
                
                {/* Active filter badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedFormat !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Format: {selectedFormat}
                      <button
                        onClick={() => setSelectedFormat("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Category: {getCategoryDisplayName(selectedCategory)}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {selectedFormat !== "all" || selectedCategory !== "all" 
                  ? "No scoring rules found for the selected filters." 
                  : "No scoring rules configured. Click 'Add Scoring Rule' to create one."}
              </p>
              {(selectedFormat !== "all" || selectedCategory !== "all") && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Rule Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Points
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Match Formats
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule) => (
                      <tr key={rule.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {rule.description || "No description"}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline">
                            {getCategoryDisplayName(rule.category || "Uncategorized")}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {getActionDisplayName(rule.actionType || "unknown")}
                            </div>
                            {/* Display additional details if needed */}
                            {rule.position && rule.position !== 'any' && (
                              <div className="text-xs text-muted-foreground">
                                Position: {rule.position}
                              </div>
                            )}
                            {rule.minutesPlayed && (
                              <div className="text-xs text-muted-foreground">
                                Min: {rule.minutesPlayed}+ mins
                              </div>
                            )}
                            {rule.thresholdValue && (
                              <div className="text-xs text-muted-foreground">
                                Threshold: {rule.thresholdValue}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <div className={`text-lg font-semibold ${
                              rule.points > 0 ? 'text-green-600' : 
                              rule.points < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {getPointsDisplay(rule)}
                              {rule.actionType === 'run' ? ' per run' : 
                               rule.actionType === 'dot_ball' ? ' per dot ball' :
                               rule.actionType === 'wicket' ? ' per wicket' : ''}
                            </div>
                            {rule.actionType === 'captain' || rule.actionType === 'vice_captain' ? (
                              <div className="text-xs text-muted-foreground">Multiplier</div>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-wrap gap-1">
                            {rule.matchFormats?.slice(0, 3).map((format) => (
                              <Badge key={format} variant="secondary" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                            {rule.matchFormats && rule.matchFormats.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{rule.matchFormats.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.isActive ? "default" : "secondary"}>
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant={rule.isLocked ? "destructive" : "outline"}>
                              {rule.isLocked ? "Locked" : "Editable"}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={rule.isActive} 
                              onCheckedChange={() => onToggleRule(rule.id)}
                              disabled={isLoading || rule.isLocked}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onToggleLock(rule.id)}
                              disabled={isLoading}
                            >
                              {rule.isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <LockOpen className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(rule)}
                              disabled={rule.isLocked || isLoading}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteRule(rule.id)}
                              disabled={rule.isLocked || isLoading}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Show filtered count */}
          {rules.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredRules.length} of {rules.length} rules
              {(selectedFormat !== "all" || selectedCategory !== "all") && (
                <span> (filtered)</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                    const defaultActionForCategory = actionTypes && actionTypes.length > 0 ? actionTypes[0] : (isFootball ? "goal_forward" : "run");
                    setRuleForm({ 
                        ...ruleForm, 
                        category: value, 
                        actionType: defaultActionForCategory,
                        points: getDefaultPoints(defaultActionForCategory)
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
                  onValueChange={handleActionTypeChange}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentActionTypes.length > 0 ? (
                      currentActionTypes.map((action) => (
                        <SelectItem key={action} value={action}>
                          {getActionDisplayName(action)} ({getDefaultPoints(action)} points)
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
              <Label htmlFor="points">
                {ruleForm.actionType === 'captain' || ruleForm.actionType === 'vice_captain' ? 'Multiplier' : 'Points'}
              </Label>
              <Input
                id="points"
                type="number"
                step="0.01"
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
                      onChange={(e) => setRuleForm({ ...ruleForm, minutesPlayed: Number.parseInt(e.target.value) || undefined })}
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
                {/* Strike Rate/Economy Rate thresholds */}
                {(ruleForm.actionType === 'strike_rate_bonus' || ruleForm.actionType === 'strike_rate_penalty' || 
                  ruleForm.actionType === 'economy_rate_bonus' || ruleForm.actionType === 'economy_rate_penalty') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="threshold-value">
                        {ruleForm.actionType?.includes('strike_rate') ? 'Strike Rate Threshold' : 'Economy Rate Threshold'}
                      </Label>
                      <Input
                        id="threshold-value"
                        type="number"
                        step="0.01"
                        placeholder={ruleForm.actionType?.includes('strike_rate') ? 
                          (ruleForm.actionType === 'strike_rate_bonus' ? "e.g., 70.00" : "e.g., 50.00") : 
                          (ruleForm.actionType === 'economy_rate_bonus' ? "e.g., 5.00" : "e.g., 9.00")}
                        value={ruleForm.thresholdValue || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, thresholdValue: Number.parseFloat(e.target.value) || undefined })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min-requirement">Minimum Requirement</Label>
                      <Input
                        id="min-requirement"
                        type="number"
                        placeholder={ruleForm.actionType?.includes('strike_rate') ? "e.g., 10 balls" : "e.g., 2 overs"}
                        value={ruleForm.minRequirement || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, minRequirement: Number.parseInt(e.target.value) || undefined })}
                        disabled={isSaving}
                      />
                    </div>
                  </>
                )}

                {/* Milestone thresholds */}
                {(ruleForm.actionType === 'thirty' || ruleForm.actionType === 'seventy_five' || 
                  ruleForm.actionType === 'half_century' || ruleForm.actionType === 'century' ||
                  ruleForm.actionType === 'three_wicket_haul' || ruleForm.actionType === 'four_wicket_haul' || 
                  ruleForm.actionType === 'five_wicket_haul') && (
                  <div className="space-y-2">
                    <Label htmlFor="min-value">Milestone Value</Label>
                    <Input
                      id="min-value"
                      type="number"
                      placeholder={
                        ruleForm.actionType === 'thirty' ? "30" : 
                        ruleForm.actionType === 'seventy_five' ? "75" :
                        ruleForm.actionType === 'half_century' ? "50" : 
                        ruleForm.actionType === 'century' ? "100" :
                        ruleForm.actionType === 'three_wicket_haul' ? "3" :
                        ruleForm.actionType === 'four_wicket_haul' ? "4" : "5"
                      }
                      value={ruleForm.minValue || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, minValue: Number.parseInt(e.target.value) || undefined })}
                      disabled={isSaving}
                    />
                  </div>
                )}

                {/* Wicket type selector */}
                {ruleForm.category === 'wicket_type' && (
                  <div className="space-y-2">
                    <Label htmlFor="wicket-type">Wicket Type</Label>
                    <Select
                      value={ruleForm.wicketType || 'bowled'}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, wicketType: value })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wicket type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bowled">Bowled</SelectItem>
                        <SelectItem value="lbw">LBW</SelectItem>
                        <SelectItem value="caught">Caught</SelectItem>
                        <SelectItem value="stumped">Stumped</SelectItem>
                        <SelectItem value="run_out">Run Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Exclude runout for wicket points */}
                {ruleForm.actionType === 'wicket' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exclude-runout"
                      checked={ruleForm.excludeRunout}
                      onCheckedChange={(checked) => setRuleForm({ ...ruleForm, excludeRunout: checked as boolean })}
                      disabled={isSaving}
                    />
                    <Label htmlFor="exclude-runout" className="text-sm font-normal">
                      Exclude run-out wickets from wicket points
                    </Label>
                  </div>
                )}

                {/* Boundary type for boundary points */}
                {ruleForm.actionType === 'boundary_four' || ruleForm.actionType === 'boundary_six' ? (
                  <div className="space-y-2">
                    <Label htmlFor="boundary-type">Boundary Type</Label>
                    <Select
                      value={ruleForm.boundaryType || 'any'}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, boundaryType: value })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select boundary type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Boundary</SelectItem>
                        <SelectItem value="ground">Ground Shot</SelectItem>
                        <SelectItem value="air">Air Shot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {/* Multiplier fields for cricket */}
                {ruleForm.category === 'batting' && (
                  <div className="space-y-2">
                    <Label htmlFor="batting-multiplier">Batting Point Multiplier</Label>
                    <Input
                      id="batting-multiplier"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.00"
                      value={ruleForm.battingPointMultiplier || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, battingPointMultiplier: Number.parseFloat(e.target.value) || undefined })}
                      disabled={isSaving}
                    />
                  </div>
                )}

                {ruleForm.category === 'bowling' && (
                  <div className="space-y-2">
                    <Label htmlFor="bowling-multiplier">Bowling Point Multiplier</Label>
                    <Input
                      id="bowling-multiplier"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.00"
                      value={ruleForm.bowlingPointMultiplier || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, bowlingPointMultiplier: Number.parseFloat(e.target.value) || undefined })}
                      disabled={isSaving}
                    />
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
              {isCricket && (
                <p className="text-xs text-muted-foreground mt-2">
                  • T20: 20 overs per innings<br/>
                  • ODI: 50 overs per innings<br/>
                  • Test: 5 days, 90 overs per day<br/>
                  • T10: 10 overs per innings
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={ruleForm.isActive}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
                  disabled={isSaving}
                />
                <Label htmlFor="is-active">Active Rule</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-locked"
                  checked={ruleForm.isLocked}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isLocked: checked })}
                  disabled={isSaving}
                />
                <Label htmlFor="is-locked">Lock Rule (Prevent Editing)</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-order">Display Order</Label>
              <Input
                id="display-order"
                type="number"
                placeholder="0"
                value={ruleForm.displayOrder}
                onChange={(e) => setRuleForm({ ...ruleForm, displayOrder: Number.parseInt(e.target.value) || 0 })}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the list
              </p>
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