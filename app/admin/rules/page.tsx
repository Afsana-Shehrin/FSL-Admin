"use client"

import { useState, useEffect } from "react"
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
  sportId: string
  name: string
  description: string
  totalCredits: number
  maxPlayersPerTeam: number
  minWicketkeepers: number
  maxWicketkeepers: number
  minBatsmen: number
  maxBatsmen: number
  minAllrounders: number
  maxAllrounders: number
  minBowlers: number
  maxBowlers: number
  totalPlayers: number
  matchFormats: string[]
  captainMultiplier: number
  viceCaptainMultiplier: number
  isActive: boolean
  isLocked: boolean
  minGoalkeepers?: number
  maxGoalkeepers?: number
  minDefenders?: number
  maxDefenders?: number
  minMidfielders?: number
  maxMidfielders?: number
  minForwards?: number
  maxForwards?: number
  maxPlayersPerRealTeam?: number
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
  matchFormats: string[]
  isActive: boolean
  isLocked: boolean
  position?: string
  minutesPlayed?: number
  goalsConcededInterval?: number
  isPenalty?: boolean
}

export interface BudgetRule {
  id: string
  sportId: string
  name: string
  description: string
  totalBudget: number
  minPlayerPrice: number
  maxPlayerPrice: number
  matchFormats: string[]
  isActive: boolean
  isLocked: boolean
}

// Constants
export const CRICKET_MATCH_FORMATS = ['T20', 'ODI', 'Test', 'T10'] as const;
export const FOOTBALL_MATCH_FORMATS = ['Standard League Match (90-Minute)', 'Knockout Match (Cup Format)', 'Extra-Time Match (120-Minute)'];
export const SCORING_CATEGORIES = ['batting', 'bowling', 'fielding', 'economy', 'strike_rate'] as const;
export const ACTION_TYPES = {
  batting: ['run', 'boundary_four', 'boundary_six', 'milestone', 'duck'],
  bowling: ['wicket', 'milestone', 'maiden'],
  fielding: ['catch', 'stumping', 'run_out', 'assisted_run_out'],
  economy: ['range'],
  strike_rate: ['range']
} as const;
export const getMatchFormatsForSport = (sportName: string) => {
  const sport = sportName.toLowerCase();
  if (sport.includes('football')) {
    return FOOTBALL_MATCH_FORMATS;
  } else if (sport.includes('cricket')) {
    return CRICKET_MATCH_FORMATS;
  }
  return CRICKET_MATCH_FORMATS; // default
};

export const MATCH_FORMATS = CRICKET_MATCH_FORMATS;
// Team Rules API
export const fetchTeamRules = async (sportId: string) => {
  try {
    const { data, error } = await supabase
      .from('team_composition_rules')
      .select('*')
      .eq('sport_id', sportId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching team rules:", error)
    throw error
  }
};

export const saveTeamRule = async (rule: TeamRule) => {
  try {
    const ruleData = {
      sport_id: parseInt(rule.sportId),
      rule_name: rule.name,
      description: rule.description,
      total_credits: rule.totalCredits,
      max_players_per_team: rule.maxPlayersPerTeam,
      min_wicketkeepers: rule.minWicketkeepers,
      max_wicketkeepers: rule.maxWicketkeepers,
      min_batsmen: rule.minBatsmen,
      max_batsmen: rule.maxBatsmen,
      min_allrounders: rule.minAllrounders,
      max_allrounders: rule.maxAllrounders,
      min_bowlers: rule.minBowlers,
      max_bowlers: rule.maxBowlers,
      total_players: rule.totalPlayers,
      match_formats: rule.matchFormats,
      captain_multiplier: rule.captainMultiplier,
      vice_captain_multiplier: rule.viceCaptainMultiplier,
      is_active: rule.isActive,
      is_locked: rule.isLocked,
      updated_at: new Date().toISOString()
    }

    // Check if this is an update or insert
    if (rule.id && rule.id !== "") {
      // Update existing rule
      const { data, error } = await supabase
        .from('team_composition_rules')
        .update(ruleData)
        .eq('rule_id', parseInt(rule.id))
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new rule
      const { data, error } = await supabase
        .from('team_composition_rules')
        .insert([ruleData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving team rule:", error)
    throw error
  }
};

export const deleteTeamRule = async (id: string) => {
  try {
    const { error } = await supabase
      .from('team_composition_rules')
      .delete()
      .eq('rule_id', parseInt(id))

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting team rule:", error)
    throw error
  }
};

// Scoring Rules API
export const fetchScoringRules = async (sportId: string) => {
  try {
    const { data, error } = await supabase
      .from('scoring_rules')
      .select('*')
      .eq('sport_id', sportId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching scoring rules:", error)
    throw error
  }
};

export const saveScoringRule = async (rule: ScoringRule) => {
  try {
    const ruleData = {
      sport_id: parseInt(rule.sportId),
      rule_name: rule.name,
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
      match_formats: rule.matchFormats,
      is_active: rule.isActive,
      is_locked: rule.isLocked,
      updated_at: new Date().toISOString()
    }

    // Check if this is an update or insert
    if (rule.id && rule.id !== "") {
      const { data, error } = await supabase
        .from('scoring_rules')
        .update(ruleData)
        .eq('rule_id', parseInt(rule.id))
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('scoring_rules')
        .insert([ruleData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving scoring rule:", error)
    throw error
  }
};

export const deleteScoringRule = async (id: string) => {
  try {
    const { error } = await supabase
      .from('scoring_rules')
      .delete()
      .eq('rule_id', parseInt(id))

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting scoring rule:", error)
    throw error
  }
};

// Budget Rules API
export const fetchBudgetRules = async (sportId: string) => {
  try {
    const { data, error } = await supabase
      .from('new_budget_rules')
      .select('*')
      .eq('sport_id', sportId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching budget rules:", error)
    throw error
  }
};

export const saveBudgetRule = async (rule: BudgetRule) => {
  try {
    const ruleData = {
      sport_id: parseInt(rule.sportId),
      rule_name: rule.name,
      description: rule.description,
      total_budget: rule.totalBudget,
      min_player_price: rule.minPlayerPrice,
      max_player_price: rule.maxPlayerPrice,
      match_formats: rule.matchFormats,
      is_active: rule.isActive,
      is_locked: rule.isLocked,
      updated_at: new Date().toISOString()
    }

    // Check if this is an update or insert
    if (rule.id && rule.id !== "") {
      const { data, error } = await supabase
        .from('new_budget_rules')
        .update(ruleData)
        .eq('rule_id', parseInt(rule.id))
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('new_budget_rules')
        .insert([ruleData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving budget rule:", error)
    throw error
  }
};

export const deleteBudgetRule = async (id: string) => {
  try {
    const { error } = await supabase
      .from('new_budget_rules')
      .delete()
      .eq('rule_id', parseInt(id))

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting budget rule:", error)
    throw error
  }
};

export default function RulesPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedSport, setSelectedSport] = useState("")
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

        const transformedSports: Sport[] = (data || []).map((sport: { sport_id: { toString: () => any }; sport_name: string; icon_url: any; is_active: any }) => ({
          id: sport.sport_id.toString(),
          name: sport.sport_name,
          icon: sport.icon_url || (sport.sport_name === 'Cricket' ? '🏏' : '⚽'),
          isActive: sport.is_active
        }))

        setSports(transformedSports)
        
        if (transformedSports.length > 0) {
          const lastSelectedSport = localStorage.getItem("last_selected_sport")
          if (lastSelectedSport && transformedSports.some(s => s.id === lastSelectedSport)) {
            setSelectedSport(lastSelectedSport)
          } else {
            setSelectedSport(transformedSports[0].id)
          }
        }
      } catch (error) {
        console.error("Error loading sports:", error)
        // Fallback to localStorage
        const storedSports = localStorage.getItem("sports_list")
        if (storedSports) {
          try {
            const parsed = JSON.parse(storedSports) as Sport[]
            const activeSports = parsed.filter((s) => s.isActive)
            setSports(activeSports)
            if (activeSports.length > 0) {
              setSelectedSport(activeSports[0].id)
            }
          } catch (e) {
            console.error("Error parsing stored sports:", e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadSports()
  }, [])

  // Save selected sport
  useEffect(() => {
    if (selectedSport) {
      localStorage.setItem("last_selected_sport", selectedSport)
    }
  }, [selectedSport])

  // Load rules from database when sport changes
  useEffect(() => {
    if (!selectedSport) return;

    const loadRules = async () => {
      setIsLoading(true);
      try {
        // Load all rules in parallel
        const [teamData, scoringData, budgetData] = await Promise.all([
          fetchTeamRules(selectedSport).catch(() => []),
          fetchScoringRules(selectedSport).catch(() => []),
          fetchBudgetRules(selectedSport).catch(() => [])
        ]);

        // Transform database data to match frontend interface
        setTeamRules(teamData.map((rule: any) => ({
          id: rule.rule_id.toString(),
          sportId: rule.sport_id.toString(),
          name: rule.rule_name,
          description: rule.description || '',
          totalCredits: parseFloat(rule.total_credits) || 100,
          maxPlayersPerTeam: rule.max_players_per_team || 7,
          minWicketkeepers: rule.min_wicketkeepers || 1,
          maxWicketkeepers: rule.max_wicketkeepers || 2,
          minBatsmen: rule.min_batsmen || 3,
          maxBatsmen: rule.max_batsmen || 6,
          minAllrounders: rule.min_allrounders || 1,
          maxAllrounders: rule.max_allrounders || 4,
          minBowlers: rule.min_bowlers || 3,
          maxBowlers: rule.max_bowlers || 6,
          totalPlayers: rule.total_players || 11,
          matchFormats: rule.match_formats || ['T20', 'ODI', 'Test', 'T10'],
          captainMultiplier: parseFloat(rule.captain_multiplier) || 2.0,
          viceCaptainMultiplier: parseFloat(rule.vice_captain_multiplier) || 1.5,
          isActive: rule.is_active ?? true,
          isLocked: rule.is_locked ?? false
        })));

        setScoringRules(scoringData.map((rule: any) => ({
          id: rule.rule_id.toString(),
          sportId: rule.sport_id.toString(),
          name: rule.rule_name,
          description: rule.description || '',
          category: rule.category,
          actionType: rule.action_type,
          points: rule.points || 0,
          minValue: rule.min_value,
          maxValue: rule.max_value,
          rangeMin: rule.range_min,
          rangeMax: rule.range_max,
          minRequirement: rule.min_requirement,
          excludeRunout: rule.exclude_runout || false,
          boundaryType: rule.boundary_type,
          matchFormats: rule.match_formats || ['T20', 'ODI', 'Test', 'T10'],
          isActive: rule.is_active ?? true,
          isLocked: rule.is_locked ?? false
        })));

        setBudgetRules(budgetData.map((rule: any) => ({
          id: rule.rule_id.toString(),
          sportId: rule.sport_id.toString(),
          name: rule.rule_name,
          description: rule.description || '',
          totalBudget: parseFloat(rule.total_budget) || 100,
          minPlayerPrice: parseFloat(rule.min_player_price) || 1,
          maxPlayerPrice: parseFloat(rule.max_player_price) || 15,
          matchFormats: rule.match_formats || ['T20', 'ODI', 'Test', 'T10'],
          isActive: rule.is_active ?? true,
          isLocked: rule.is_locked ?? false
        })));

      } catch (error) {
        console.error("Error loading rules:", error);
        // Load from localStorage as fallback
        const storedTeamRules = localStorage.getItem("team_rules_v2");
        const storedScoringRules = localStorage.getItem("scoring_rules_v2");
        const storedBudgetRules = localStorage.getItem("budget_rules_v2");

        if (storedTeamRules) setTeamRules(JSON.parse(storedTeamRules));
        if (storedScoringRules) setScoringRules(JSON.parse(storedScoringRules));
        if (storedBudgetRules) setBudgetRules(JSON.parse(storedBudgetRules));
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, [selectedSport]);

  // Keep localStorage as backup
  useEffect(() => {
    if (teamRules.length > 0) {
      localStorage.setItem("team_rules_v2", JSON.stringify(teamRules));
    }
  }, [teamRules]);

  useEffect(() => {
    if (scoringRules.length > 0) {
      localStorage.setItem("scoring_rules_v2", JSON.stringify(scoringRules));
    }
  }, [scoringRules]);

  useEffect(() => {
    if (budgetRules.length > 0) {
      localStorage.setItem("budget_rules_v2", JSON.stringify(budgetRules));
    }
  }, [budgetRules]);

  const getCurrentSport = () => sports.find((s) => s.id === selectedSport)

  // Filter rules by selected sport
  const filteredTeamRules = teamRules.filter((r) => r.sportId === selectedSport)
  const filteredScoringRules = scoringRules.filter((r) => r.sportId === selectedSport)
  const filteredBudgetRules = budgetRules.filter((r) => r.sportId === selectedSport)

  // Team Rule Handlers
  const handleDeleteTeamRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team rule?")) return;
    
    try {
      setIsLoading(true);
      await deleteTeamRule(id);
      setTeamRules(teamRules.filter((r) => r.id !== id))
    } catch (error) {
      console.error("Failed to delete team rule:", error);
      alert("Failed to delete rule. Please try again.");
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
      await saveTeamRule(updatedRule);
      setTeamRules(teamRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update team rule:", error);
      alert("Failed to update rule status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleTeamRuleLock = async (id: string) => {
    const rule = teamRules.find(r => r.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, isLocked: !rule.isLocked };
    
    try {
      setIsLoading(true);
      await saveTeamRule(updatedRule);
      setTeamRules(teamRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update team rule lock:", error);
      alert("Failed to update rule lock. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Scoring Rule Handlers
  const handleDeleteScoringRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scoring rule?")) return;
    
    try {
      setIsLoading(true);
      await deleteScoringRule(id);
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
      await saveScoringRule(updatedRule);
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
      await saveScoringRule(updatedRule);
      setScoringRules(scoringRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update scoring rule lock:", error);
      alert("Failed to update rule lock. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Budget Rule Handlers
  const handleDeleteBudgetRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget rule?")) return;
    
    try {
      setIsLoading(true);
      await deleteBudgetRule(id);
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
      await saveBudgetRule(updatedRule);
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
      await saveBudgetRule(updatedRule);
      setBudgetRules(budgetRules.map((r) => (r.id === id ? updatedRule : r)))
    } catch (error) {
      console.error("Failed to update budget rule lock:", error);
      alert("Failed to update rule lock. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Add rule handlers
  const handleAddTeamRule = async (rule: TeamRule) => {
    try {
      setIsLoading(true);
      await saveTeamRule(rule);
      const refreshed = await fetchTeamRules(selectedSport);
      setTeamRules(refreshed);
    } catch (error) {
      console.error("Failed to add team rule:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScoringRule = async (rule: ScoringRule) => {
    try {
      setIsLoading(true);
      await saveScoringRule(rule);
      const refreshed = await fetchScoringRules(selectedSport);
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
      await saveBudgetRule(rule);
      const refreshed = await fetchBudgetRules(selectedSport);
      setBudgetRules(refreshed);
    } catch (error) {
      console.error("Failed to add budget rule:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh all rules
  const handleRefreshRules = async () => {
    if (!selectedSport) return;
    
    setIsLoading(true);
    try {
      const [teamData, scoringData, budgetData] = await Promise.all([
        fetchTeamRules(selectedSport),
        fetchScoringRules(selectedSport),
        fetchBudgetRules(selectedSport)
      ]);
      
      setTeamRules(teamData);
      setScoringRules(scoringData);
      setBudgetRules(budgetData);
    } catch (error) {
      console.error("Failed to refresh rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading rules...</p>
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
            Configure sport-specific fantasy league rules for team composition, scoring, and budget
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshRules}
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
            onClick={() => setSelectedSport(sport.id)}
            className="gap-2"
          >
            
            {sport.name}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Team Composition</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Rules</TabsTrigger>
          <TabsTrigger value="budget">Budget Rules</TabsTrigger>
        </TabsList>

        {/* Team Composition Tab */}
        <TabsContent value="team">
          <TeamRulesTab
            sportName={getCurrentSport()?.name || ""}
            sportId={selectedSport}
            rules={filteredTeamRules}
            isLoading={isLoading}
            onAddRule={handleAddTeamRule}
            onEditRule={() => {/* handled in component */}}
            onDeleteRule={handleDeleteTeamRule}
            onToggleRule={handleToggleTeamRule}
            onToggleLock={handleToggleTeamRuleLock}
          />
        </TabsContent>

        {/* Scoring Rules Tab */}
        <TabsContent value="scoring">
          <ScoringRulesTab
            sportName={getCurrentSport()?.name || ""}
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
            sportName={getCurrentSport()?.name || ""}
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
    </div>
  )
}