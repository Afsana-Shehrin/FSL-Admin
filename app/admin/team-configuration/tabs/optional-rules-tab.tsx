"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Info } from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'
import { Alert, AlertDescription } from "@/components/ui/alert"

const supabase = getSupabase()

interface OptionalRulesTabProps {
  sportId: number
  leagueId: number
}

interface OptionalRules {
  max_players_per_country?: number
  max_players_per_club?: number
  min_player_price?: number
  max_player_price?: number
  allow_multi_position_players?: boolean
  require_unique_jersey_numbers?: boolean
  min_player_matches_played?: number
  custom_rules?: Record<string, any>
}

export default function OptionalRulesTab({ sportId, leagueId }: OptionalRulesTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [budgetRule, setBudgetRule] = useState<any>(null)
  const [optionalRules, setOptionalRules] = useState<OptionalRules>({})
  
  // Toggle states for optional rules
  const [enableCountryLimit, setEnableCountryLimit] = useState(false)
  const [enableClubLimit, setEnableClubLimit] = useState(false)
  const [enablePriceRange, setEnablePriceRange] = useState(false)
  const [enableMultiPosition, setEnableMultiPosition] = useState(false)
  const [enableUniqueJersey, setEnableUniqueJersey] = useState(false)
  const [enableMatchesPlayed, setEnableMatchesPlayed] = useState(false)

  useEffect(() => {
    fetchOptionalRules()
  }, [sportId, leagueId])

  const fetchOptionalRules = async () => {
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
        const rules = data.additional_rules || {}
        setOptionalRules(rules)
        
        // Set toggle states based on existing rules
        setEnableCountryLimit(!!rules.max_players_per_country)
        setEnableClubLimit(!!rules.max_players_per_club)
        setEnablePriceRange(!!(rules.min_player_price || rules.max_player_price))
        setEnableMultiPosition(rules.allow_multi_position_players === true)
        setEnableUniqueJersey(rules.require_unique_jersey_numbers === true)
        setEnableMatchesPlayed(!!rules.min_player_matches_played)
      }
    } catch (error: any) {
      console.error('Error fetching optional rules:', error)
      toast.error('Failed to load optional rules')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Build the additional_rules object based on enabled toggles
      const rules: OptionalRules = {}
      
      if (enableCountryLimit && optionalRules.max_players_per_country) {
        rules.max_players_per_country = optionalRules.max_players_per_country
      }
      
      if (enableClubLimit && optionalRules.max_players_per_club) {
        rules.max_players_per_club = optionalRules.max_players_per_club
      }
      
      if (enablePriceRange) {
        if (optionalRules.min_player_price) rules.min_player_price = optionalRules.min_player_price
        if (optionalRules.max_player_price) rules.max_player_price = optionalRules.max_player_price
      }
      
      if (enableMultiPosition) {
        rules.allow_multi_position_players = true
      }
      
      if (enableUniqueJersey) {
        rules.require_unique_jersey_numbers = true
      }
      
      if (enableMatchesPlayed && optionalRules.min_player_matches_played) {
        rules.min_player_matches_played = optionalRules.min_player_matches_played
      }

      if (budgetRule) {
        const { error } = await supabase
          .from('budget_rules')
          .update({ additional_rules: rules })
          .eq('budget_rule_id', budgetRule.budget_rule_id)

        if (error) throw error
        toast.success('Optional rules updated successfully')
      } else {
        toast.error('Please create budget rules first')
        return
      }

      fetchOptionalRules()
    } catch (error: any) {
      console.error('Error saving optional rules:', error)
      toast.error(error.message || 'Failed to save optional rules')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optional Rules</CardTitle>
        <CardDescription>
          Configure optional constraints that admins can enable or disable per league
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !budgetRule ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please create budget rules first before configuring optional rules.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These are optional rules. Enable only the ones you want to apply to this league.
              </AlertDescription>
            </Alert>

            {/* Country Limit */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enableCountryLimit}
                        onCheckedChange={setEnableCountryLimit}
                      />
                      <Label className="text-base font-semibold">
                        Maximum Players Per Country
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Limit how many players from the same country can be selected
                    </p>
                  </div>
                </div>
                {enableCountryLimit && (
                  <div className="ml-10 space-y-2">
                    <Label htmlFor="max_country">Max Players</Label>
                    <Input
                      id="max_country"
                      type="number"
                      min="1"
                      max="15"
                      value={optionalRules.max_players_per_country || 5}
                      onChange={(e) => setOptionalRules({ ...optionalRules, max_players_per_country: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Club Limit */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enableClubLimit}
                        onCheckedChange={setEnableClubLimit}
                      />
                      <Label className="text-base font-semibold">
                        Maximum Players Per Club
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Additional club limit (separate from team limit in budget rules)
                    </p>
                  </div>
                </div>
                {enableClubLimit && (
                  <div className="ml-10 space-y-2">
                    <Label htmlFor="max_club">Max Players</Label>
                    <Input
                      id="max_club"
                      type="number"
                      min="1"
                      max="11"
                      value={optionalRules.max_players_per_club || 3}
                      onChange={(e) => setOptionalRules({ ...optionalRules, max_players_per_club: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Range */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enablePriceRange}
                        onCheckedChange={setEnablePriceRange}
                      />
                      <Label className="text-base font-semibold">
                        Player Price Range
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Set minimum and maximum price constraints for players
                    </p>
                  </div>
                </div>
                {enablePriceRange && (
                  <div className="ml-10 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_price">Min Price</Label>
                      <Input
                        id="min_price"
                        type="number"
                        step="0.1"
                        min="0"
                        value={optionalRules.min_player_price || 0}
                        onChange={(e) => setOptionalRules({ ...optionalRules, min_player_price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_price">Max Price</Label>
                      <Input
                        id="max_price"
                        type="number"
                        step="0.1"
                        min="0"
                        value={optionalRules.max_player_price || 20}
                        onChange={(e) => setOptionalRules({ ...optionalRules, max_player_price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multi-Position Players */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enableMultiPosition}
                    onCheckedChange={setEnableMultiPosition}
                  />
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">
                      Allow Multi-Position Players
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Players can be selected for multiple positions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unique Jersey Numbers */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enableUniqueJersey}
                    onCheckedChange={setEnableUniqueJersey}
                  />
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">
                      Require Unique Jersey Numbers
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Each player must have a unique jersey number
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Minimum Matches Played */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enableMatchesPlayed}
                        onCheckedChange={setEnableMatchesPlayed}
                      />
                      <Label className="text-base font-semibold">
                        Minimum Matches Played
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Players must have played a minimum number of matches
                    </p>
                  </div>
                </div>
                {enableMatchesPlayed && (
                  <div className="ml-10 space-y-2">
                    <Label htmlFor="min_matches">Min Matches</Label>
                    <Input
                      id="min_matches"
                      type="number"
                      min="0"
                      max="50"
                      value={optionalRules.min_player_matches_played || 1}
                      onChange={(e) => setOptionalRules({ ...optionalRules, min_player_matches_played: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Optional Rules'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
