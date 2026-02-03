"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'
import { Alert, AlertDescription } from "@/components/ui/alert"

const supabase = getSupabase()

interface BudgetRule {
  budget_rule_id: number
  league_id: number
  sport_id: number
  total_budget: number
  squad_size: number
  playing_size: number
  bench_size: number
  min_teams_required: number
  max_players_per_team: number
  captain_multiplier: number
  vice_captain_multiplier: number
  additional_rules: Record<string, any>
  created_at: string
}

interface BudgetRulesTabProps {
  sportId: number
  leagueId: number
}

export default function BudgetRulesTab({ sportId, leagueId }: BudgetRulesTabProps) {
  const [budgetRule, setBudgetRule] = useState<BudgetRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    total_budget: 100,
    squad_size: 15,
    playing_size: 11,
    min_teams_required: 3,
    max_players_per_team: 7,
    captain_multiplier: 2.0,
    vice_captain_multiplier: 1.5
  })

  useEffect(() => {
    fetchBudgetRule()
  }, [sportId, leagueId])

  const fetchBudgetRule = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('budget_rules')
        .select('*')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setBudgetRule(data)
        setFormData({
          total_budget: parseFloat(data.total_budget),
          squad_size: data.squad_size,
          playing_size: data.playing_size,
          min_teams_required: data.min_teams_required,
          max_players_per_team: data.max_players_per_team,
          captain_multiplier: parseFloat(data.captain_multiplier),
          vice_captain_multiplier: parseFloat(data.vice_captain_multiplier)
        })
      }
    } catch (error: any) {
      console.error('Error fetching budget rule:', error)
      toast.error('Failed to load budget rules')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      // Validate
      if (formData.squad_size <= formData.playing_size) {
        toast.error('Squad size must be greater than playing size')
        return
      }

      if (formData.total_budget <= 0) {
        toast.error('Total budget must be greater than 0')
        return
      }

      const ruleData = {
        ...formData,
        sport_id: sportId,
        league_id: leagueId,
        additional_rules: {}
      }

      if (budgetRule) {
        // Update existing
        const { error } = await supabase
          .from('budget_rules')
          .update(ruleData)
          .eq('budget_rule_id', budgetRule.budget_rule_id)

        if (error) throw error
        toast.success('Budget rules updated successfully')
      } else {
        // Create new
        const { error } = await supabase
          .from('budget_rules')
          .insert([ruleData])

        if (error) throw error
        toast.success('Budget rules created successfully')
      }

      fetchBudgetRule()
    } catch (error: any) {
      console.error('Error saving budget rule:', error)
      toast.error(error.message || 'Failed to save budget rules')
    } finally {
      setSaving(false)
    }
  }

  const benchSize = formData.squad_size - formData.playing_size

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget & Squad Rules</CardTitle>
        <CardDescription>
          Define budget constraints and squad composition rules for this league
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These rules define team composition constraints for users building their fantasy teams.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Budget</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="total_budget">Total Budget (Credits)</Label>
                  <Input
                    id="total_budget"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total budget available for team selection
                  </p>
                </div>
              </div>

              {/* Squad Size Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Squad Size</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="squad_size">Total Squad Size</Label>
                  <Input
                    id="squad_size"
                    type="number"
                    min="11"
                    max="20"
                    value={formData.squad_size}
                    onChange={(e) => setFormData({ ...formData, squad_size: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total players in squad (playing + bench)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playing_size">Playing Squad Size</Label>
                  <Input
                    id="playing_size"
                    type="number"
                    min="11"
                    max="15"
                    value={formData.playing_size}
                    onChange={(e) => setFormData({ ...formData, playing_size: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of players in starting XI
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Bench Size:</span> {benchSize} players
                  </p>
                </div>
              </div>

              {/* Team Constraints */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Constraints</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="min_teams_required">Min Teams Required</Label>
                  <Input
                    id="min_teams_required"
                    type="number"
                    min="2"
                    max="10"
                    value={formData.min_teams_required}
                    onChange={(e) => setFormData({ ...formData, min_teams_required: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum number of different teams players must be from
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_players_per_team">Max Players Per Team</Label>
                  <Input
                    id="max_players_per_team"
                    type="number"
                    min="1"
                    max="11"
                    value={formData.max_players_per_team}
                    onChange={(e) => setFormData({ ...formData, max_players_per_team: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum players allowed from a single team
                  </p>
                </div>
              </div>

              {/* Captain/Vice-Captain Multipliers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Point Multipliers</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="captain_multiplier">Captain Multiplier</Label>
                  <Input
                    id="captain_multiplier"
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={formData.captain_multiplier}
                    onChange={(e) => setFormData({ ...formData, captain_multiplier: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Points multiplier for captain (e.g., 2.0 = 2x points)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vice_captain_multiplier">Vice-Captain Multiplier</Label>
                  <Input
                    id="vice_captain_multiplier"
                    type="number"
                    step="0.1"
                    min="1"
                    max="2"
                    value={formData.vice_captain_multiplier}
                    onChange={(e) => setFormData({ ...formData, vice_captain_multiplier: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Points multiplier for vice-captain (e.g., 1.5 = 1.5x points)
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Rules Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Budget:</span>
                  <span className="font-medium">{formData.total_budget} Credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Squad Composition:</span>
                  <span className="font-medium">{formData.playing_size} Playing + {benchSize} Bench</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Diversity:</span>
                  <span className="font-medium">Min {formData.min_teams_required} teams, Max {formData.max_players_per_team}/team</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Captain Bonus:</span>
                  <span className="font-medium">{formData.captain_multiplier}x (C), {formData.vice_captain_multiplier}x (VC)</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSubmit} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : budgetRule ? 'Update Rules' : 'Create Rules'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
