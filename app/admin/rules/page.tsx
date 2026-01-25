"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import TeamRulesTab from "./components/team-rules-tab"
import ScoringRulesTab from "./components/scoring-rules-tab"
import BudgetRulesTab from "./components/budget-rules-tab"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Interfaces
export interface Sport {
  id: string
  name: string
  icon: string
  isActive: boolean
}

export interface TeamRule {
  id: string
  formatName: string
  formatCode: string
  description: string
  totalPlayers: number
  playingXiRequired: number
  maxOverseasPlayers?: number
  maxPlayersFromSameTeam: number
  fantasyTeamSize: number
  captainMultiplier: number
  viceCaptainMultiplier: number
  totalCredit: number
  maxPlayersPerRealTeam: number
  transferBudgetPerMatch: number
  isActive: boolean
  
  // Cricket specific
  minBatsmen?: number
  maxBatsmen?: number
  minBowlers?: number
  maxBowlers?: number
  minAllRounders?: number
  maxAllRounders?: number
  minWicketKeepers?: number
  maxWicketKeepers?: number
  
  // Football specific
  minGoalkeepers?: number
  maxGoalkeepers?: number
  minDefenders?: number
  maxDefenders?: number
  minMidfielders?: number
  maxMidfielders?: number
  minForwards?: number
  maxForwards?: number
  
  // Match format specific
  maxOversPerInnings?: number
  matchDurationMinutes?: number
  powerplayOvers?: number
  superOverAllowed?: boolean
  daysLong?: number
  centuryBonus?: number
  halfCenturyBonus?: number
  fiveWicketBonus?: number
  fourWicketBonus?: number
  duckPoints?: number
  maidenOverPoints?: number
  dotBallPoints?: number
  catchPoints?: number
  stumpPoints?: number
  runOutPoints?: number
  
  // Other fields
  displayOrder: number
}

export interface ScoringRule {
  id: string
  sportId: string
  name: string
  description: string
  category: string
  actionType: string
  points: number
  minValue?: number
  maxValue?: number
  rangeMin?: number
  rangeMax?: number
  minRequirement?: number
  excludeRunout?: boolean
  boundaryType?: string
  position?: string
  minutesPlayed?: number
  goalsConcededInterval?: number
  isPenalty?: boolean

  // New cricket-specific fields
  wicketType?: string
  thresholdValue?: number
  bonusMultiplier?: number
  penaltyMultiplier?: number

  // Football scoring fields
  goalPoints?: number
  assistPoints?: number
  cleanSheetPoints?: number
  penaltySavePoints?: number
  penaltyMissPoints?: number
  yellowCardPoints?: number
  redCardPoints?: number
  ownGoalPoints?: number
  penaltyScoredPoints?: number
  freeKickGoalPoints?: number
  savePoints?: number
  penaltyConcededPoints?: number
  goalsConcededPoints?: number
  goalConcededIntervalPoints?: number
  tacklePoints?: number
  interceptionPoints?: number
  clearancePoints?: number
  blockPoints?: number
  lastManTacklePoints?: number
  keyPassPoints?: number
  successfulDribblePoints?: number
  crossPoints?: number
  throughBallPoints?: number
  shotOnTargetPoints?: number
  bigChanceMissedPoints?: number
  offsidePoints?: number
  minutesPlayedPoints?: number
  manOfMatchPoints?: number
  handballDecisionPoints?: number

  // Cricket scoring fields
  centuryBonus?: number
  halfCenturyBonus?: number
  fiveWicketBonus?: number
  fourWicketBonus?: number
  duckPoints?: number
  maidenOverPoints?: number
  dotBallPoints?: number
  catchPoints?: number
  stumpPoints?: number
  runOutPoints?: number
  // sportType?: string
  
  // Multipliers
  goalkeepingPointMultiplier?: number
  defendingPointMultiplier?: number
  midfieldPointMultiplier?: number
  attackingPointMultiplier?: number
  battingPointMultiplier?: number
  bowlingPointMultiplier?: number
  fieldingPointMultiplier?: number
  economyBonusMultiplier?: number
  strikeRateBonusMultiplier?: number

  // Database fields
  matchFormats: string[]
  isActive: boolean
  isLocked: boolean
  displayOrder: number
  formatId?: number
  sportType?: string
}

export interface BudgetRule {
  id: string
  sportId: string
  name: string
  description: string
  totalBudget: number
  minPlayerPrice: number
  maxPlayerPrice: number
  transferBudget: number
  matchFormats: string[]
  isActive: boolean
  isLocked: boolean
  displayOrder: number
}

// Constants
export const CRICKET_MATCH_FORMATS = ['T20', 'ODI', 'Test', 'T10'] as const;
export const FOOTBALL_MATCH_FORMATS = ['Standard League Match (90-Minute)', 'Knockout Match (Cup Format)', 'Extra-Time Match (120-Minute)'];

export const getMatchFormatsForSport = (sportName: string) => {
  const sport = sportName.toLowerCase();
  if (sport.includes('football')) {
    return FOOTBALL_MATCH_FORMATS;
  } else if (sport.includes('cricket')) {
    return CRICKET_MATCH_FORMATS;
  }
  return CRICKET_MATCH_FORMATS;
};

// ========== API FUNCTIONS ==========

// Fetch team rules from match_formats tables
export const fetchTeamRules = async (sportId: string, sportName: string) => {
  try {
    let data: any[] = []
    let error: any = null
    
    if (sportName.toLowerCase().includes('cricket')) {
      const result = await supabase
        .from('match_formats_cricket')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      data = result.data || []
      error = result.error
    } else if (sportName.toLowerCase().includes('football')) {
      const result = await supabase
        .from('match_formats_football')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      data = result.data || []
      error = result.error
    }
    
    if (error) throw error
    
    // Transform data to TeamRule interface
    return data.map(format => transformToTeamRule(format, sportName))
  } catch (error) {
    console.error("Error fetching team rules:", error)
    return []
  }
}

// Transform database format to TeamRule interface
const transformToTeamRule = (format: any, sportName: string): TeamRule => {
  const isCricket = sportName.toLowerCase().includes('cricket')
  const isFootball = sportName.toLowerCase().includes('football')
  
  const baseRule: TeamRule = {
    id: format.format_id.toString(),
    formatName: format.format_name,
    formatCode: format.format_code,
    description: format.description || '',
    totalPlayers: format.total_players || 11,
    playingXiRequired: format.playing_xi_required || 11,
    maxPlayersFromSameTeam: format.max_players_from_same_team || 7,
    fantasyTeamSize: format.fantasy_team_size || 11,
    captainMultiplier: parseFloat(format.captain_multiplier) || 2.0,
    viceCaptainMultiplier: parseFloat(format.vice_captain_multiplier) || 1.5,
    totalCredit: parseFloat(format.total_budget) || 100.00,
    maxPlayersPerRealTeam: format.max_players_per_real_team || (isFootball ? 3 : 7),
    transferBudgetPerMatch: parseFloat(format.transfer_budget) || 5.00,
    isActive: format.is_active !== undefined ? format.is_active : true,
    displayOrder: format.display_order || 0
  }
  
  // Add cricket specific fields
  if (isCricket) {
    baseRule.maxOverseasPlayers = format.max_overseas_players || 4
    baseRule.minBatsmen = format.min_batsmen || 3
    baseRule.maxBatsmen = format.max_batsmen || 6
    baseRule.minBowlers = format.min_bowlers || 3
    baseRule.maxBowlers = format.max_bowlers || 6
    baseRule.minAllRounders = format.min_all_rounders || 1
    baseRule.maxAllRounders = format.max_all_rounders || 4
    baseRule.minWicketKeepers = format.min_wicket_keepers || 1
    baseRule.maxWicketKeepers = format.max_wicket_keepers || 4
    
    // Cricket format specific
    baseRule.maxOversPerInnings = format.max_overs_per_innings
    baseRule.powerplayOvers = format.powerplay_overs
    baseRule.superOverAllowed = format.super_over_allowed
    baseRule.daysLong = format.days_long || 1
    baseRule.centuryBonus = format.century_bonus || 25
    baseRule.halfCenturyBonus = format.half_century_bonus || 10
    baseRule.fiveWicketBonus = format.five_wicket_bonus || 25
    baseRule.fourWicketBonus = format.four_wicket_bonus || 10
    baseRule.duckPoints = format.duck_points || -5
    baseRule.maidenOverPoints = format.maiden_over_points || 5
    baseRule.dotBallPoints = parseFloat(format.dot_ball_points) || 0.5
    baseRule.catchPoints = format.catch_points || 10
    baseRule.stumpPoints = format.stump_points || 15
    baseRule.runOutPoints = format.run_out_points || 15
  }
  
  // Add football specific fields
  if (isFootball) {
    baseRule.minGoalkeepers = format.min_goalkeepers || 1
    baseRule.maxGoalkeepers = format.max_goalkeepers || 1
    baseRule.minDefenders = format.min_defenders || 3
    baseRule.maxDefenders = format.max_defenders || 5
    baseRule.minMidfielders = format.min_midfielders || 3
    baseRule.maxMidfielders = format.max_midfielders || 5
    baseRule.minForwards = format.min_forwards || 1
    baseRule.maxForwards = format.max_forwards || 3
    
    // Football format specific
    baseRule.matchDurationMinutes = format.match_duration_minutes || 90
  }
  
  return baseRule
}

// Save team rule to appropriate table
export const saveTeamRule = async (rule: TeamRule, sportName: string) => {
  try {
    const isCricket = sportName.toLowerCase().includes('cricket')
    const isFootball = sportName.toLowerCase().includes('football')
    
    const formatData: any = {
      format_name: rule.formatName,
      format_code: rule.formatCode,
      description: rule.description,
      total_players: rule.totalPlayers,
      playing_xi_required: rule.playingXiRequired,
      max_players_from_same_team: rule.maxPlayersFromSameTeam,
      fantasy_team_size: rule.fantasyTeamSize,
      captain_multiplier: rule.captainMultiplier,
      vice_captain_multiplier: rule.viceCaptainMultiplier,
      total_budget: rule.totalCredit,
      max_players_per_real_team: rule.maxPlayersPerRealTeam,
      transfer_budget: rule.transferBudgetPerMatch,
      is_active: rule.isActive,
      display_order: rule.displayOrder
    }
    
    // Add cricket specific fields
    if (isCricket) {
      formatData.max_overseas_players = rule.maxOverseasPlayers || 4
      formatData.min_batsmen = rule.minBatsmen || 3
      formatData.max_batsmen = rule.maxBatsmen || 6
      formatData.min_bowlers = rule.minBowlers || 3
      formatData.max_bowlers = rule.maxBowlers || 6
      formatData.min_all_rounders = rule.minAllRounders || 1
      formatData.max_all_rounders = rule.maxAllRounders || 4
      formatData.min_wicket_keepers = rule.minWicketKeepers || 1
      formatData.max_wicket_keepers = rule.maxWicketKeepers || 4
      
      // Cricket format specific
      formatData.max_overs_per_innings = rule.maxOversPerInnings
      formatData.powerplay_overs = rule.powerplayOvers
      formatData.super_over_allowed = rule.superOverAllowed
      formatData.days_long = rule.daysLong || 1
      formatData.century_bonus = rule.centuryBonus || 25
      formatData.half_century_bonus = rule.halfCenturyBonus || 10
      formatData.five_wicket_bonus = rule.fiveWicketBonus || 25
      formatData.four_wicket_bonus = rule.fourWicketBonus || 10
      formatData.duck_points = rule.duckPoints || -5
      formatData.maiden_over_points = rule.maidenOverPoints || 5
      formatData.dot_ball_points = rule.dotBallPoints || 0.5
      formatData.catch_points = rule.catchPoints || 10
      formatData.stump_points = rule.stumpPoints || 15
      formatData.run_out_points = rule.runOutPoints || 15
    }
    
    // Add football specific fields
    if (isFootball) {
      formatData.min_goalkeepers = rule.minGoalkeepers || 1
      formatData.max_goalkeepers = rule.maxGoalkeepers || 1
      formatData.min_defenders = rule.minDefenders || 3
      formatData.max_defenders = rule.maxDefenders || 5
      formatData.min_midfielders = rule.minMidfielders || 3
      formatData.max_midfielders = rule.maxMidfielders || 5
      formatData.min_forwards = rule.minForwards || 1
      formatData.max_forwards = rule.maxForwards || 3
      
      // Football format specific
      formatData.match_duration_minutes = rule.matchDurationMinutes || 90
    }
    
    let tableName = ''
    if (isCricket) tableName = 'match_formats_cricket'
    if (isFootball) tableName = 'match_formats_football'
    
    if (!tableName) throw new Error('Unknown sport')
    
    // Check if this is an update or insert
    if (rule.id && rule.id !== "") {
      // Update existing format
      const { data, error } = await supabase
        .from(tableName)
        .update(formatData)
        .eq('format_id', parseInt(rule.id))
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new format
      const { data, error } = await supabase
        .from(tableName)
        .insert([formatData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving team rule:", error)
    throw error
  }
}

// Delete team rule from appropriate table
export const deleteTeamRule = async (id: string, sportName: string) => {
  try {
    let tableName = ''
    if (sportName.toLowerCase().includes('cricket')) {
      tableName = 'match_formats_cricket'
    } else if (sportName.toLowerCase().includes('football')) {
      tableName = 'match_formats_football'
    }
    
    if (!tableName) throw new Error('Unknown sport')
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('format_id', parseInt(id))

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting team rule:", error)
    throw error
  }
}

// ========== SCORING RULES API ==========

// Helper function to get format ID from format name
const getFormatIdFromName = async (formatName: string, sportName: string): Promise<number> => {
  try {
    const isCricket = sportName.toLowerCase().includes('cricket')
    const tableName = isCricket ? 'match_formats_cricket' : 'match_formats_football'
    
    const { data, error } = await supabase
      .from(tableName)
      .select('format_id')
      .eq('format_name', formatName)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data?.format_id || 1 // Default to 1 if not found
  } catch (error) {
    console.error("Error getting format ID:", error)
    return 1 // Default fallback
  }
}

// Helper function to get format name from format ID
const getFormatNameFromId = async (formatId: number, sportName: string): Promise<string> => {
  try {
    const isCricket = sportName.toLowerCase().includes('cricket')
    const tableName = isCricket ? 'match_formats_cricket' : 'match_formats_football'
    
    const { data, error } = await supabase
      .from(tableName)
      .select('format_name')
      .eq('format_id', formatId)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data?.format_name || `Format ${formatId}`
  } catch (error) {
    console.error("Error getting format name:", error)
    return `Format ${formatId}`
  }
}

// Fetch scoring rules from scoring_rules table
export const fetchScoringRules = async (sportId: string, sportName: string) => {
  try {
    const sportsIdNum = parseInt(sportId);    
    const { data, error } = await supabase
      .from('scoring_rules')
      .select('*')
      .eq('sports_id', sportsIdNum)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    
    // Transform data to ScoringRule interface
    const rules = await Promise.all((data || []).map(async (rule: { format_id: any; id: any; name: any; description: any; category: any; action_type: any; points: any; min_value: any; max_value: any; range_min: any; range_max: any; min_requirement: any; exclude_runout: any; boundary_type: any; position: any; minutes_played: any; goals_conceded_interval: any; is_penalty: any; wicket_type: any; threshold_value: any; bonus_multiplier: any; penalty_multiplier: any; batting_point_multiplier: any; bowling_point_multiplier: any; fielding_point_multiplier: any; economy_bonus_multiplier: any; strike_rate_bonus_multiplier: any; is_active: any; is_locked: any; display_order: any; sport_type: any }) => {
      // Get format name for each format ID
      const formatNames = await Promise.all(
        [rule.format_id].map(async (id) => await getFormatNameFromId(id, sportName))
      )
      
      return {
        id: rule.id,
        sportId: sportId,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        actionType: rule.action_type,
        points: rule.points,
        minValue: rule.min_value,
        maxValue: rule.max_value,
        rangeMin: rule.range_min,
        rangeMax: rule.range_max,
        minRequirement: rule.min_requirement,
        excludeRunout: rule.exclude_runout,
        boundaryType: rule.boundary_type,
        position: rule.position,
        minutesPlayed: rule.minutes_played,
        goalsConcededInterval: rule.goals_conceded_interval,
        isPenalty: rule.is_penalty,
        wicketType: rule.wicket_type,
        thresholdValue: rule.threshold_value,
        bonusMultiplier: rule.bonus_multiplier,
        penaltyMultiplier: rule.penalty_multiplier,
        battingPointMultiplier: rule.batting_point_multiplier,
        bowlingPointMultiplier: rule.bowling_point_multiplier,
        fieldingPointMultiplier: rule.fielding_point_multiplier,
        economyBonusMultiplier: rule.economy_bonus_multiplier,
        strikeRateBonusMultiplier: rule.strike_rate_bonus_multiplier,
        matchFormats: formatNames,
        isActive: rule.is_active,
        isLocked: rule.is_locked,
        displayOrder: rule.display_order,
        formatId: rule.format_id,
        
      }
    }))
    
    return rules
  } catch (error) {
    console.error("Error fetching scoring rules:", error)
    return []
  }
}

// Save scoring rule to scoring_rules table
export const saveScoringRule = async (rule: ScoringRule, sportName: string) => {
  try {
    const isCricket = sportName.toLowerCase().includes('cricket')
    const isFootball = sportName.toLowerCase().includes('football')
    
    // Get format ID from the first match format
    const firstFormat = rule.matchFormats[0]
    const formatId = rule.formatId || await getFormatIdFromName(firstFormat, sportName)
    
    // Create the update/insert data for scoring_rules table
    const scoringRuleData: any = {
      format_id: formatId,
      sports_id: parseInt(rule.sportId),      
      name: rule.name,
      description: rule.description,
      category: rule.category,
      action_type: rule.actionType,
      points: rule.points,
      min_value: rule.minValue,
      max_value: rule.maxValue,
      range_min: rule.rangeMin,
      range_max: rule.rangeMax,
      min_requirement: rule.minRequirement,
      exclude_runout: rule.excludeRunout,
      boundary_type: rule.boundaryType,
      position: rule.position,
      minutes_played: rule.minutesPlayed,
      goals_conceded_interval: rule.goalsConcededInterval,
      is_penalty: rule.isPenalty,
      wicket_type: rule.wicketType,
      threshold_value: rule.thresholdValue,
      bonus_multiplier: rule.bonusMultiplier,
      penalty_multiplier: rule.penaltyMultiplier,
      batting_point_multiplier: rule.battingPointMultiplier,
      bowling_point_multiplier: rule.bowlingPointMultiplier,
      fielding_point_multiplier: rule.fieldingPointMultiplier,
      economy_bonus_multiplier: rule.economyBonusMultiplier,
      strike_rate_bonus_multiplier: rule.strikeRateBonusMultiplier,
      is_active: rule.isActive,
      is_locked: rule.isLocked,
      display_order: rule.displayOrder
    }

    // Check if this is an update or insert
    if (rule.id && rule.id !== "") {
      // Update existing scoring rule
      const { data, error } = await supabase
        .from('scoring_rules')
        .update(scoringRuleData)
        .eq('id', rule.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new scoring rule
      const { data, error } = await supabase
        .from('scoring_rules')
        .insert([scoringRuleData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving scoring rule:", error)
    throw error
  }
}

// Delete scoring rule from scoring_rules table
export const deleteScoringRule = async (id: string, sportName: string) => {
  try {
    const { error } = await supabase
      .from('scoring_rules')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting scoring rule:", error)
    throw error
  }
}

// ========== BUDGET RULES API ==========

// Fetch budget rules from match_formats tables
export const fetchBudgetRules = async (sportId: string, sportName: string) => {
  try {
    let data: any[] = []
    let error: any = null
    
    if (sportName.toLowerCase().includes('cricket')) {
      const result = await supabase
        .from('match_formats_cricket')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      data = result.data || []
      error = result.error
    } else if (sportName.toLowerCase().includes('football')) {
      const result = await supabase
        .from('match_formats_football')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      data = result.data || []
      error = result.error
    }
    
    if (error) throw error
    
    // Transform data to BudgetRule interface
    return data.map(format => transformToBudgetRule(format, sportName, sportId))
  } catch (error) {
    console.error("Error fetching budget rules:", error)
    return []
  }
}

const transformToBudgetRule = (format: any, sportName: string, sportId: string): BudgetRule => {
  return {
    id: format.format_id.toString(),
    sportId: sportId,
    name: format.budget_rule_name || `${format.format_name} Budget Rules`,
    description: format.description || `Budget rules for ${format.format_name}`,
    totalBudget: parseFloat(format.total_budget) || 100.00,
    minPlayerPrice: parseFloat(format.min_player_price) || 1.00,
    maxPlayerPrice: parseFloat(format.max_player_price) || 15.00,
    transferBudget: parseFloat(format.transfer_budget) || 5.00,
    matchFormats: [format.format_name],
    isActive: format.is_active !== undefined ? format.is_active : true,
    isLocked: false, // Not in your table, default to false
    displayOrder: format.display_order || 0
  }
}

// Save budget rule (update match_formats table)
export const saveBudgetRule = async (rule: BudgetRule, sportName: string) => {
  try {
    const isCricket = sportName.toLowerCase().includes('cricket')
    const isFootball = sportName.toLowerCase().includes('football')
    
    const updateData: any = {
      budget_rule_name: rule.name,
      total_budget: rule.totalBudget,
      min_player_price: rule.minPlayerPrice,
      max_player_price: rule.maxPlayerPrice,
      transfer_budget: rule.transferBudget
    }
    
    let tableName = ''
    if (isCricket) {
      tableName = 'match_formats_cricket'
    } else if (isFootball) {
      tableName = 'match_formats_football'
    }
    
    if (!tableName) throw new Error('Unknown sport')
    
    if (rule.id && rule.id !== "") {
      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('format_id', parseInt(rule.id))
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // For new rules, create a new format entry
      const formatData: any = {
        format_name: rule.name,
        format_code: rule.name.toLowerCase().replace(/\s+/g, '_'),
        description: rule.description,
        total_budget: rule.totalBudget,
        min_player_price: rule.minPlayerPrice,
        max_player_price: rule.maxPlayerPrice,
        transfer_budget: rule.transferBudget,
        is_active: rule.isActive,
        display_order: rule.displayOrder
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([formatData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving budget rule:", error)
    throw error
  }
}

// Delete budget rule (deactivate in match_formats table)
export const deleteBudgetRule = async (id: string, sportName: string) => {
  try {
    let tableName = ''
    if (sportName.toLowerCase().includes('cricket')) {
      tableName = 'match_formats_cricket'
    } else if (sportName.toLowerCase().includes('football')) {
      tableName = 'match_formats_football'
    }
    
    if (!tableName) throw new Error('Unknown sport')
    
    // Instead of deleting, deactivate the format
    const { error } = await supabase
      .from(tableName)
      .update({ is_active: false })
      .eq('format_id', parseInt(id))

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting budget rule:", error)
    throw error
  }
}

// ========== MAIN COMPONENT ==========

export default function RulesPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [selectedSportName, setSelectedSportName] = useState<string>("")
  const [activeTab, setActiveTab] = useState("team")
  const [isLoading, setIsLoading] = useState(false)

  // Rules state
  const [teamRules, setTeamRules] = useState<TeamRule[]>([])
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>([])

  // Load sports from database
  useEffect(() => {
    const loadSports = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('sports')
          .select('sport_id, sport_name, sport_code, icon_url, is_active')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (error) throw error

        const transformedSports: Sport[] = (data || []).map((sport: any) => ({
          id: sport.sport_id.toString(),
          name: sport.sport_name,
          icon: sport.icon_url || (sport.sport_name === 'Cricket' ? '🏏' : '⚽'),
          isActive: sport.is_active
        }))

        setSports(transformedSports)
        
        if (transformedSports.length > 0) {
          const lastSelectedSport = localStorage.getItem("last_selected_sport")
          if (lastSelectedSport && transformedSports.some(s => s.id === lastSelectedSport)) {
            const sport = transformedSports.find(s => s.id === lastSelectedSport)
            if (sport) {
              setSelectedSport(sport.id)
              setSelectedSportName(sport.name)
            }
          } else {
            setSelectedSport(transformedSports[0].id)
            setSelectedSportName(transformedSports[0].name)
          }
        }
      } catch (error) {
        console.error("Error loading sports:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSports()
  }, [])

  // Load rules from database when sport changes
  useEffect(() => {
    if (!selectedSport || !selectedSportName) return;

    const loadRules = async () => {
      setIsLoading(true);
      try {
        // Load all rules in parallel
        const [teamData, scoringData, budgetData] = await Promise.all([
          fetchTeamRules(selectedSport, selectedSportName),
          fetchScoringRules(selectedSport, selectedSportName),
          fetchBudgetRules(selectedSport, selectedSportName)
        ]);

        // Add debug logging
        console.log('Scoring rules loaded:', scoringData?.length || 0);
        console.log('Sample scoring rules:', scoringData?.slice(0, 5) || []);
        console.log('=== DEBUG: Scoring Rules Loading ===');
        console.log('Selected Sport ID:', selectedSport);
        console.log('Selected Sport Name:', selectedSportName);
        console.log('Scoring rules loaded:', scoringData?.length || 0);


        if (scoringData && scoringData.length > 0) {
        console.log('First scoring rule sample:', scoringData[0]);
        console.log('All scoring rules categories:', scoringData.map((r: { category: any }) => r.category));
      } else {
        console.log('No scoring rules found. Checking database...');
        // You might want to add a direct database check here
      }
        
        setTeamRules(teamData || [])
        setScoringRules(scoringData || [])
        setBudgetRules(budgetData || [])

      } catch (error) {
        console.error("Error loading rules:", error);
        setTeamRules([])
        setScoringRules([])
        setBudgetRules([])
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, [selectedSport, selectedSportName]);

  // Handle sport selection
  const handleSportSelect = useCallback((sportId: string) => {
    const sport = sports.find(s => s.id === sportId)
    if (sport) {
      setSelectedSport(sport.id)
      setSelectedSportName(sport.name)
      localStorage.setItem("last_selected_sport", sport.id)
    }
  }, [sports])

  // Filter rules by selected sport
  const filteredTeamRules = teamRules
  const filteredScoringRules = scoringRules
  const filteredBudgetRules = budgetRules

  // Team Rule Handlers
  const handleDeleteTeamRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match format?")) return;
    
    try {
      setIsLoading(true);
      await deleteTeamRule(id, selectedSportName);
      setTeamRules(teamRules.filter((r) => r.id !== id))
    } catch (error) {
      console.error("Failed to delete team rule:", error);
      alert("Failed to delete format. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleTeamRule = async (id: string) => {
    const rule = teamRules.find(r => r.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, isActive: !rule.isActive };
    
    try {
      setIsLoading(true);
      await saveTeamRule(updatedRule, selectedSportName);
      setTeamRules(teamRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update team rule:", error);
      alert("Failed to update format status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Add team rule handler
  const handleAddTeamRule = async (rule: TeamRule) => {
    try {
      setIsLoading(true);
      await saveTeamRule(rule, selectedSportName);
      const refreshed = await fetchTeamRules(selectedSport, selectedSportName);
      setTeamRules(refreshed);
    } catch (error) {
      console.error("Failed to add team rule:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Scoring Rule Handlers
  const handleDeleteScoringRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scoring rule?")) return;
    
    try {
      setIsLoading(true);
      await deleteScoringRule(id, selectedSportName);
      setScoringRules(scoringRules.filter((r) => r.id !== id))
    } catch (error) {
      console.error("Failed to delete scoring rule:", error);
      alert("Failed to delete rule. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleScoringRule = async (id: string) => {
    const rule = scoringRules.find(r => r.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, isActive: !rule.isActive };
    
    try {
      setIsLoading(true);
      await saveScoringRule(updatedRule, selectedSportName);
      setScoringRules(scoringRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update scoring rule:", error);
      alert("Failed to update rule status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleScoringRuleLock = async (id: string) => {
    const rule = scoringRules.find(r => r.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, isLocked: !rule.isLocked };
    
    try {
      setIsLoading(true);
      await saveScoringRule(updatedRule, selectedSportName);
      setScoringRules(scoringRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to toggle scoring rule lock:", error);
      alert("Failed to toggle lock status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Budget Rule Handlers
  const handleDeleteBudgetRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget rule?")) return;
    
    try {
      setIsLoading(true);
      await deleteBudgetRule(id, selectedSportName);
      setBudgetRules(budgetRules.filter((r) => r.id !== id))
    } catch (error) {
      console.error("Failed to delete budget rule:", error);
      alert("Failed to delete rule. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleBudgetRule = async (id: string) => {
    const rule = budgetRules.find(r => r.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, isActive: !rule.isActive };
    
    try {
      setIsLoading(true);
      await saveBudgetRule(updatedRule, selectedSportName);
      setBudgetRules(budgetRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update budget rule:", error);
      alert("Failed to update rule status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleBudgetRuleLock = async (id: string) => {
    const rule = budgetRules.find(r => r.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, isLocked: !rule.isLocked };
    
    try {
      setIsLoading(true);
      await saveBudgetRule(updatedRule, selectedSportName);
      setBudgetRules(budgetRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to toggle budget rule lock:", error);
      alert("Failed to toggle lock status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Add handlers
  const handleAddScoringRule = async (rule: ScoringRule) => {
    try {
      setIsLoading(true);
      await saveScoringRule(rule, selectedSportName);
      const refreshed = await fetchScoringRules(selectedSport, selectedSportName);
      setScoringRules(refreshed);
    } catch (error) {
      console.error("Failed to add scoring rule:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBudgetRule = async (rule: BudgetRule) => {
    try {
      setIsLoading(true);
      await saveBudgetRule(rule, selectedSportName);
      const refreshed = await fetchBudgetRules(selectedSport, selectedSportName);
      setBudgetRules(refreshed);
    } catch (error) {
      console.error("Failed to add budget rule:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshRules = async () => {
    if (!selectedSport || !selectedSportName) return;
    
    try {
      setIsLoading(true);
      const [teamData, scoringData, budgetData] = await Promise.all([
        fetchTeamRules(selectedSport, selectedSportName),
        fetchScoringRules(selectedSport, selectedSportName),
        fetchBudgetRules(selectedSport, selectedSportName)
      ]);

      setTeamRules(teamData || [])
      setScoringRules(scoringData || [])
      setBudgetRules(budgetData || [])
    } catch (error) {
      console.error("Failed to refresh rules:", error);
      alert("Failed to refresh rules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Add loading indicator
  if (isLoading && !selectedSport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sports...</p>
        </div>
      </div>
    );
  }

  if (sports.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No sports available. Please add sports first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fantasy Rules Configuration</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure match formats and rules for each sport
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshRules}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Sport Selection */}
      <div className="flex flex-wrap gap-2">
        {sports.map((sport) => (
          <Button
            key={sport.id}
            variant={selectedSport === sport.id ? "default" : "outline"}
            onClick={() => handleSportSelect(sport.id)}
            className="gap-2"
            disabled={isLoading}
          >
            {sport.name}
          </Button>
        ))}
      </div>

      {!selectedSport ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Please select a sport to configure rules.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="team">Match Formats & Team Composition</TabsTrigger>
            <TabsTrigger value="scoring">Scoring Rules</TabsTrigger>
            <TabsTrigger value="budget">Budget Rules</TabsTrigger>
          </TabsList>

          {/* Team Composition Tab */}
          <TabsContent value="team">
            <TeamRulesTab
              sportName={selectedSportName}
              sportId={selectedSport}
              rules={filteredTeamRules}
              isLoading={isLoading}
              onAddRule={handleAddTeamRule}
              onEditRule={() => {/* handled in component */}}
              onDeleteRule={handleDeleteTeamRule}
              onToggleRule={handleToggleTeamRule}
            />
          </TabsContent>

          {/* Scoring Rules Tab */}
          <TabsContent value="scoring">
            <ScoringRulesTab
              sportName={selectedSportName}
              sportId={selectedSport}
              rules={filteredScoringRules}
              isLoading={isLoading}
              onAddRule={handleAddScoringRule}
              onEditRule={() => {/* handled in component */}}
              onDeleteRule={handleDeleteScoringRule}
              onToggleRule={handleToggleScoringRule}
              onToggleLock={handleToggleScoringRuleLock}
            />
          </TabsContent>

          {/* Budget Rules Tab */}
          <TabsContent value="budget">
            <BudgetRulesTab
              sportName={selectedSportName}
              sportId={selectedSport}
              rules={filteredBudgetRules}
              isLoading={isLoading}
              onAddRule={handleAddBudgetRule}
              onEditRule={() => {/* handled in component */}}
              onDeleteRule={handleDeleteBudgetRule}
              onToggleRule={handleToggleBudgetRule}
              onToggleLock={handleToggleBudgetRuleLock}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}