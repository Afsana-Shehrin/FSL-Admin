"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'

const supabase = getSupabase()

interface PlayerPosition {
  position_id: number
  league_id: number
  sport_id: number
  position_name: string
  position_code: string
  min_required: number
  max_allowed: number
  display_order: number
  is_active: boolean
  created_at: string
}

interface PlayerPositionsTabProps {
  sportId: number
  leagueId: number
}

export default function PlayerPositionsTab({ sportId, leagueId }: PlayerPositionsTabProps) {
  const [positions, setPositions] = useState<PlayerPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PlayerPosition | null>(null)
  const [formData, setFormData] = useState({
    position_name: "",
    position_code: "",
    min_required: 0,
    max_allowed: 11,
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchPositions()
  }, [sportId, leagueId])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('player_positions')
        .select('*')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .order('display_order')

      if (error) throw error
      setPositions(data || [])
    } catch (error: any) {
      console.error('Error fetching positions:', error)
      toast.error('Failed to load player positions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.position_name || !formData.position_code) {
        toast.error('Please fill in all required fields')
        return
      }

      const positionData = {
        ...formData,
        sport_id: sportId,
        league_id: leagueId
      }

      if (editingPosition) {
        const { error } = await supabase
          .from('player_positions')
          .update(positionData)
          .eq('position_id', editingPosition.position_id)

        if (error) throw error
        toast.success('Position updated successfully')
      } else {
        const { error } = await supabase
          .from('player_positions')
          .insert([positionData])

        if (error) throw error
        toast.success('Position created successfully')
      }

      setDialogOpen(false)
      resetForm()
      fetchPositions()
    } catch (error: any) {
      console.error('Error saving position:', error)
      toast.error(error.message || 'Failed to save position')
    }
  }

  const handleEdit = (position: PlayerPosition) => {
    setEditingPosition(position)
    setFormData({
      position_name: position.position_name,
      position_code: position.position_code,
      min_required: position.min_required,
      max_allowed: position.max_allowed,
      display_order: position.display_order,
      is_active: position.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (positionId: number) => {
    if (!confirm('Are you sure you want to delete this position? This will affect all formations using it.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('player_positions')
        .delete()
        .eq('position_id', positionId)

      if (error) throw error
      toast.success('Position deleted successfully')
      fetchPositions()
    } catch (error: any) {
      console.error('Error deleting position:', error)
      toast.error('Failed to delete position')
    }
  }

  const resetForm = () => {
    setFormData({
      position_name: "",
      position_code: "",
      min_required: 0,
      max_allowed: 11,
      display_order: 0,
      is_active: true
    })
    setEditingPosition(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Player Positions</CardTitle>
            <CardDescription>
              Define player positions/roles for this league (e.g., GK, DEF, MID, FWD)
            </CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Position
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No positions defined yet. Click "Add Position" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Position Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Min Required</TableHead>
                <TableHead>Max Allowed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.position_id}>
                  <TableCell>{position.display_order}</TableCell>
                  <TableCell className="font-medium">{position.position_name}</TableCell>
                  <TableCell><code className="text-xs">{position.position_code}</code></TableCell>
                  <TableCell>{position.min_required}</TableCell>
                  <TableCell>{position.max_allowed}</TableCell>
                  <TableCell>
                    {position.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(position)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(position.position_id)}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPosition ? 'Edit Position' : 'Add Position'}
              </DialogTitle>
              <DialogDescription>
                Define the position name, code, and constraints
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position_name">Position Name</Label>
                <Input
                  id="position_name"
                  placeholder="e.g., Goalkeeper, Defender"
                  value={formData.position_name}
                  onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_code">Position Code</Label>
                <Input
                  id="position_code"
                  placeholder="e.g., GK, DEF, MID, FWD"
                  value={formData.position_code}
                  onChange={(e) => setFormData({ ...formData, position_code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_required">Min Required</Label>
                  <Input
                    id="min_required"
                    type="number"
                    min="0"
                    value={formData.min_required}
                    onChange={(e) => setFormData({ ...formData, min_required: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_allowed">Max Allowed</Label>
                  <Input
                    id="max_allowed"
                    type="number"
                    min="0"
                    value={formData.max_allowed}
                    onChange={(e) => setFormData({ ...formData, max_allowed: parseInt(e.target.value) })}
                  />
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                {editingPosition ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
