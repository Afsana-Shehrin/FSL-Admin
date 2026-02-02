"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'

const supabase = getSupabase()

interface PlayerPosition {
  position_id: number
  position_name: string
  position_code: string
}

interface Formation {
  formation_id: number
  league_id: number
  sport_id: number
  formation_code: string
  formation_name: string
  position_distribution: Record<string, number>
  total_slots: number
  tactical_style: string | null
  description: string | null
  is_valid: boolean
  is_default: boolean
  is_active: boolean
  display_order: number
}

interface BudgetRule {
  budget_rule_id: number
  playing_size: number
  squad_size: number
  total_budget: number
}

interface FormationsTabProps {
  sportId: number
  leagueId: number
}

export default function FormationsTab({ sportId, leagueId }: FormationsTabProps) {
  const [formations, setFormations] = useState<Formation[]>([])
  const [positions, setPositions] = useState<PlayerPosition[]>([])
  const [budgetRules, setBudgetRules] = useState<BudgetRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null)
  const [formData, setFormData] = useState({
    formation_code: "",
    formation_name: "",
    tactical_style: "",
    description: "",
    position_distribution: {} as Record<string, number>,
    is_default: false,
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    fetchData()
  }, [sportId, leagueId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch formations
      const { data: formationsData, error: formationsError } = await supabase
        .from('formations')
        .select('*')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .order('display_order')

      if (formationsError) throw formationsError

      // Fetch positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('player_positions')
        .select('position_id, position_name, position_code')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .order('display_order')

      if (positionsError) throw positionsError

      // Fetch budget rules
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_rules')
        .select('budget_rule_id, playing_size, squad_size, total_budget')
        .eq('league_id', leagueId)
        .single()

      if (budgetError) {
        console.warn('No budget rules found for this league:', budgetError)
        toast.warning('Please configure budget rules for this league first')
      }

      setFormations(formationsData || [])
      setPositions(positionsData || [])
      setBudgetRules(budgetData)

      // Initialize position distribution if positions exist
      if (positionsData && positionsData.length > 0 && Object.keys(formData.position_distribution).length === 0) {
        const initialDistribution: Record<string, number> = {}
        positionsData.forEach(pos => {
          initialDistribution[pos.position_code] = 0
        })
        setFormData(prev => ({ ...prev, position_distribution: initialDistribution }))
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load formations')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalSlots = (distribution: Record<string, number>): number => {
    return Object.values(distribution).reduce((sum, count) => sum + count, 0)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.formation_code || !formData.formation_name) {
        toast.error('Please fill in all required fields')
        return
      }

      const totalSlots = calculateTotalSlots(formData.position_distribution)
      
      if (totalSlots === 0) {
        toast.error('Please set at least one position in the formation')
        return
      }

      // Validate against budget rules
      if (budgetRules) {
        if (totalSlots !== budgetRules.playing_size) {
          toast.error(
            `Formation must have exactly ${budgetRules.playing_size} positions to match league playing size. ` +
            `Current formation has ${totalSlots} positions.`
          )
          return
        }
      } else {
        toast.warning('No budget rules configured. Formation will be saved but may not work correctly.')
      }

      const formationData = {
        ...formData,
        sport_id: sportId,
        league_id: leagueId,
        total_slots: totalSlots,
        is_valid: true
      }

      if (editingFormation) {
        const { error } = await supabase
          .from('formations')
          .update(formationData)
          .eq('formation_id', editingFormation.formation_id)

        if (error) throw error
        toast.success('Formation updated successfully')
      } else {
        const { error } = await supabase
          .from('formations')
          .insert([formationData])

        if (error) throw error
        toast.success('Formation created successfully')
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving formation:', error)
      toast.error(error.message || 'Failed to save formation')
    }
  }

  const handleEdit = (formation: Formation) => {
    setEditingFormation(formation)
    setFormData({
      formation_code: formation.formation_code,
      formation_name: formation.formation_name,
      tactical_style: formation.tactical_style || "",
      description: formation.description || "",
      position_distribution: formation.position_distribution,
      is_default: formation.is_default,
      is_active: formation.is_active,
      display_order: formation.display_order
    })
    setDialogOpen(true)
  }

  const handleDelete = async (formationId: number) => {
    if (!confirm('Are you sure you want to delete this formation?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('formation_id', formationId)

      if (error) throw error
      toast.success('Formation deleted successfully')
      fetchData()
    } catch (error: any) {
      console.error('Error deleting formation:', error)
      toast.error('Failed to delete formation')
    }
  }

  const resetForm = () => {
    const initialDistribution: Record<string, number> = {}
    positions.forEach(pos => {
      initialDistribution[pos.position_code] = 0
    })
    
    setFormData({
      formation_code: "",
      formation_name: "",
      tactical_style: "",
      description: "",
      position_distribution: initialDistribution,
      is_default: false,
      is_active: true,
      display_order: 0
    })
    setEditingFormation(null)
  }

  const handlePositionCountChange = (positionCode: string, count: number) => {
    setFormData(prev => ({
      ...prev,
      position_distribution: {
        ...prev.position_distribution,
        [positionCode]: Math.max(0, count)
      }
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Formations</CardTitle>
            <CardDescription>
              Define valid formations for this league (e.g., 4-4-2, 3-5-2)
              {budgetRules && (
                <span className="block mt-1 text-sm font-medium text-primary">
                  ⚠️ Required: Formations must have exactly {budgetRules.playing_size} positions
                </span>
              )}
            </CardDescription>
          </div>
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true) }}
            disabled={positions.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Formation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Please define player positions first before creating formations.
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : formations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No formations defined yet. Click "Add Formation" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Distribution</TableHead>
                <TableHead>Total Slots</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formations.map((formation) => (
                <TableRow key={formation.formation_id}>
                  <TableCell className="font-mono text-sm">{formation.formation_code}</TableCell>
                  <TableCell className="font-medium">{formation.formation_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(formation.position_distribution).map(([code, count]) => (
                        count > 0 && (
                          <Badge key={code} variant="secondary" className="text-xs">
                            {code}: {count}
                          </Badge>
                        )
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formation.total_slots}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formation.tactical_style || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {formation.is_default && <Badge variant="default">Default</Badge>}
                      {formation.is_active ? (
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(formation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(formation.formation_id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFormation ? 'Edit Formation' : 'Add Formation'}
              </DialogTitle>
              <DialogDescription>
                Define the formation code, name, and position distribution
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formation_code">Formation Code *</Label>
                  <Input
                    id="formation_code"
                    placeholder="e.g., 4-4-2"
                    value={formData.formation_code}
                    onChange={(e) => setFormData({ ...formData, formation_code: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formation_name">Formation Name *</Label>
                  <Input
                    id="formation_name"
                    placeholder="e.g., Four-Four-Two"
                    value={formData.formation_name}
                    onChange={(e) => setFormData({ ...formData, formation_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tactical_style">Tactical Style</Label>
                <Input
                  id="tactical_style"
                  placeholder="e.g., Balanced, Attacking, Defensive"
                  value={formData.tactical_style}
                  onChange={(e) => setFormData({ ...formData, tactical_style: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the formation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Position Distribution *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {positions.map((position) => (
                    <div key={position.position_id} className="space-y-1">
                      <Label htmlFor={`pos-${position.position_code}`} className="text-sm">
                        {position.position_name} ({position.position_code})
                      </Label>
                      <Input
                        id={`pos-${position.position_code}`}
                        type="number"
                        min="0"
                        max="11"
                        value={formData.position_distribution[position.position_code] || 0}
                        onChange={(e) => handlePositionCountChange(position.position_code, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    Total Slots: {calculateTotalSlots(formData.position_distribution)}
                    {budgetRules && ` / ${budgetRules.playing_size} required`}
                  </span>
                  {budgetRules && (
                    <Badge 
                      variant={calculateTotalSlots(formData.position_distribution) === budgetRules.playing_size ? "default" : "destructive"}
                    >
                      {calculateTotalSlots(formData.position_distribution) === budgetRules.playing_size ? '✓ Valid' : '✗ Invalid'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Set as default</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                {editingFormation ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
