"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'

const supabase = getSupabase()

interface ValidationRule {
  validation_id: number
  league_id: number
  sport_id: number
  validation_type: string
  validation_name: string
  error_code: string
  error_message_template: string
  severity: string
  execution_order: number
  is_active: boolean
}

interface ValidationRulesTabProps {
  sportId: number
  leagueId: number
}

const VALIDATION_TYPES = [
  { value: 'budget', label: 'Budget Validation' },
  { value: 'position', label: 'Position Validation' },
  { value: 'team_composition', label: 'Team Composition' },
  { value: 'formation', label: 'Formation Validation' },
  { value: 'player_eligibility', label: 'Player Eligibility' },
  { value: 'custom', label: 'Custom Rule' }
]

export default function ValidationRulesTab({ sportId, leagueId }: ValidationRulesTabProps) {
  const [rules, setRules] = useState<ValidationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null)
  const [formData, setFormData] = useState({
    validation_type: "position",
    validation_name: "",
    error_code: "",
    error_message_template: "",
    severity: "blocking",
    execution_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchRules()
  }, [sportId, leagueId])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('validation_rules')
        .select('*')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .order('execution_order')

      if (error) throw error
      setRules(data || [])
    } catch (error: any) {
      console.error('Error fetching validation rules:', error)
      toast.error('Failed to load validation rules')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.validation_name || !formData.error_code) {
        toast.error('Please fill in all required fields')
        return
      }

      const ruleData = {
        ...formData,
        sport_id: sportId,
        league_id: leagueId
      }

      if (editingRule) {
        const { error } = await supabase
          .from('validation_rules')
          .update(ruleData)
          .eq('validation_id', editingRule.validation_id)

        if (error) throw error
        toast.success('Validation rule updated successfully')
      } else {
        const { error } = await supabase
          .from('validation_rules')
          .insert([ruleData])

        if (error) throw error
        toast.success('Validation rule created successfully')
      }

      setDialogOpen(false)
      resetForm()
      fetchRules()
    } catch (error: any) {
      console.error('Error saving validation rule:', error)
      toast.error(error.message || 'Failed to save validation rule')
    }
  }

  const handleEdit = (rule: ValidationRule) => {
    setEditingRule(rule)
    setFormData({
      validation_type: rule.validation_type,
      validation_name: rule.validation_name,
      error_code: rule.error_code,
      error_message_template: rule.error_message_template,
      severity: rule.severity,
      execution_order: rule.execution_order,
      is_active: rule.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (validationId: number) => {
    if (!confirm('Are you sure you want to delete this validation rule?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('validation_rules')
        .delete()
        .eq('validation_id', validationId)

      if (error) throw error
      toast.success('Validation rule deleted successfully')
      fetchRules()
    } catch (error: any) {
      console.error('Error deleting validation rule:', error)
      toast.error('Failed to delete validation rule')
    }
  }

  const resetForm = () => {
    setFormData({
      validation_type: "position",
      validation_name: "",
      error_code: "",
      error_message_template: "",
      severity: "blocking",
      execution_order: 0,
      is_active: true
    })
    setEditingRule(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Validation Rules</CardTitle>
            <CardDescription>
              Define validation rules for team building and selection
            </CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No validation rules defined yet. Click "Add Rule" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Error Code</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.validation_id}>
                  <TableCell>{rule.execution_order}</TableCell>
                  <TableCell className="capitalize">{rule.validation_type.replace('_', ' ')}</TableCell>
                  <TableCell className="font-medium">{rule.validation_name}</TableCell>
                  <TableCell><code className="text-xs">{rule.error_code}</code></TableCell>
                  <TableCell>
                    <span className={rule.severity === 'blocking' ? 'text-red-600' : 'text-yellow-600'}>
                      {rule.severity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {rule.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.validation_id)}>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Validation Rule' : 'Add Validation Rule'}
              </DialogTitle>
              <DialogDescription>
                Define a validation rule to enforce team building constraints
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validation_type">Validation Type *</Label>
                  <Select
                    value={formData.validation_type}
                    onValueChange={(value) => setFormData({ ...formData, validation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALIDATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocking">Blocking</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validation_name">Rule Name *</Label>
                <Input
                  id="validation_name"
                  placeholder="e.g., Minimum defenders required"
                  value={formData.validation_name}
                  onChange={(e) => setFormData({ ...formData, validation_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error_code">Error Code *</Label>
                <Input
                  id="error_code"
                  placeholder="e.g., MIN_DEF_REQUIRED"
                  value={formData.error_code}
                  onChange={(e) => setFormData({ ...formData, error_code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error_message_template">Error Message Template *</Label>
                <Textarea
                  id="error_message_template"
                  placeholder="e.g., You must select at least {min} defenders"
                  value={formData.error_message_template}
                  onChange={(e) => setFormData({ ...formData, error_message_template: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="execution_order">Execution Order</Label>
                <Input
                  id="execution_order"
                  type="number"
                  min="0"
                  value={formData.execution_order}
                  onChange={(e) => setFormData({ ...formData, execution_order: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers execute first
                </p>
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
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
