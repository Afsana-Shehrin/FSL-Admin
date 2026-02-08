"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ScoringRulesTab from "./components/scoring-rules-tab"
import { getSupabase } from '@/lib/supabase/working-client'

// Initialize Supabase client
const supabase = getSupabase()

// Interfaces
export interface Sport {
  id: string
  name: string
  icon: string
  isActive: boolean
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

export default function RulesPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedSport, setSelectedSport] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])

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

  // Load scoring rules from database when sport changes
  useEffect(() => {
    if (!selectedSport) return;

    const loadRules = async () => {
      setIsLoading(true);
      try {
        const scoringData = await fetchScoringRules(selectedSport).catch(() => []);

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

      } catch (error) {
        console.error("Error loading scoring rules:", error);
        // Load from localStorage as fallback
        const storedScoringRules = localStorage.getItem("scoring_rules_v2");
        if (storedScoringRules) setScoringRules(JSON.parse(storedScoringRules));
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, [selectedSport]);

  // Keep localStorage as backup
  useEffect(() => {
    if (scoringRules.length > 0) {
      localStorage.setItem("scoring_rules_v2", JSON.stringify(scoringRules));
    }
  }, [scoringRules]);

  const getCurrentSport = () => sports.find((s) => s.id === selectedSport)

  // Filter scoring rules by selected sport
  const filteredScoringRules = scoringRules.filter((r) => r.sportId === selectedSport)

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

  // Add scoring rule handler
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

  // Refresh scoring rules
  const handleRefreshRules = async () => {
    if (!selectedSport) return;
    
    setIsLoading(true);
    try {
      const scoringData = await fetchScoringRules(selectedSport);
      setScoringRules(scoringData);
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
          <p className="mt-4 text-muted-foreground">Loading scoring rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scoring Rules Configuration</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure sport-specific scoring rules for fantasy leagues
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

      {/* Scoring Rules Component */}
      <ScoringRulesTab
        sportName={getCurrentSport()?.name || ""}
        sportId={selectedSport}
        rules={filteredScoringRules}
        isLoading={isLoading}
        onAddRule={handleAddScoringRule}
        onDeleteRule={handleDeleteScoringRule}
        onToggleRule={handleToggleScoringRule}
        onToggleLock={handleToggleScoringRuleLock} onEditRule={function (rule: ScoringRule): void {
          throw new Error("Function not implemented.")
        } }      />
    </div>
  )
}