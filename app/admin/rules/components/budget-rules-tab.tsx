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
import { Checkbox } from "@/components/ui/checkbox"
import { BudgetRule } from "../page"

interface BudgetRulesTabProps {
  sportName: string
  sportId: string
  rules: BudgetRule[]
  isLoading: boolean
  onAddRule: (rule: BudgetRule) => Promise<void>
  onEditRule: (rule: BudgetRule) => void
  onDeleteRule: (id: string) => Promise<void>
  onToggleRule: (id: string) => Promise<void>
  onToggleLock: (id: string) => Promise<void>
}

export default function BudgetRulesTab({
  sportName,
  sportId,
  rules,
  isLoading,
  onAddRule,
  onDeleteRule,
  onToggleRule,
  onToggleLock
}: BudgetRulesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BudgetRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isFootball = useMemo(() => sportName.toLowerCase().includes('football'), [sportName])
  const isCricket = useMemo(() => sportName.toLowerCase().includes('cricket'), [sportName])

  const defaultMatchFormats = useMemo(() => 
    isFootball 
      ? ['Standard League Match (90-Minute)'] 
      : ['T20', 'ODI', 'Test', 'T10'],
    [isFootball]
  )

  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    totalBudget: 100,
    minPlayerPrice: 1,
    maxPlayerPrice: 15,
    transferBudget: 5,
    matchFormats: defaultMatchFormats as string[],
    isActive: true,
    isLocked: false,
    displayOrder: 0
  })

  const handleOpenDialog = (rule?: BudgetRule) => {
    if (rule) {
      setEditingRule(rule)
      setRuleForm({
        name: rule.name || "",
        description: rule.description || "",
        totalBudget: rule.totalBudget || 100,
        minPlayerPrice: rule.minPlayerPrice || 1,
        maxPlayerPrice: rule.maxPlayerPrice || 15,
        transferBudget: rule.transferBudget || 5,
        matchFormats: rule.matchFormats || defaultMatchFormats,
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        isLocked: rule.isLocked !== undefined ? rule.isLocked : false,
        displayOrder: rule.displayOrder || 0
      })
    } else {
      setEditingRule(null)
      setRuleForm({
        name: "",
        description: "",
        totalBudget: 100,
        minPlayerPrice: 1,
        maxPlayerPrice: 15,
        transferBudget: 5,
        matchFormats: defaultMatchFormats,
        isActive: true,
        isLocked: false,
        displayOrder: rules.length
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
      const newRule: BudgetRule = {
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

  // Get match formats based on sport
  const sportMatchFormats = useMemo(() => 
    isFootball 
      ? ['Standard League Match (90-Minute)', 'Knockout Match (Cup Format)', 'Extra-Time Match (120-Minute)']
      : ['T20', 'ODI', 'Test', 'T10'],
    [isFootball]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <p className="text-sm text-muted-foreground">Configure budget rules for {sportName}</p>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Budget Rule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No budget rules configured. Click "Add Budget Rule" to create one.
          </p>
        ) : (
          rules.map((rule) => (
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
                  <p className="text-sm font-medium">Budget Settings:</p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Budget:</span>
                      <span className="font-medium">${rule.totalBudget.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Player Price:</span>
                      <span className="font-medium">${rule.minPlayerPrice.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Player Price:</span>
                      <span className="font-medium">${rule.maxPlayerPrice.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transfer Budget:</span>
                      <span className="font-medium">${rule.transferBudget.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Display Order:</span>
                      <span className="font-medium">{rule.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Match Formats:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.matchFormats.map((format) => (
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
          ))
        )}
      </div>

      {/* Budget Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Budget Rule" : "Add Budget Rule"}</DialogTitle>
            <DialogDescription>Set budget constraints for {sportName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="budget-rule-name">Rule Name</Label>
              <Input
                id="budget-rule-name"
                placeholder="e.g., Standard Budget Rules"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-rule-desc">Description</Label>
              <Textarea
                id="budget-rule-desc"
                placeholder="Describe this budget rule"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-budget">Total Budget (M)</Label>
              <Input
                id="total-budget"
                type="number"
                value={ruleForm.totalBudget}
                onChange={(e) => setRuleForm({ ...ruleForm, totalBudget: Number.parseFloat(e.target.value) || 100 })}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-player-price">Min Player Price (M)</Label>
                <Input
                  id="min-player-price"
                  type="number"
                  value={ruleForm.minPlayerPrice}
                  onChange={(e) => setRuleForm({ ...ruleForm, minPlayerPrice: Number.parseFloat(e.target.value) || 1 })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-player-price">Max Player Price (M)</Label>
                <Input
                  id="max-player-price"
                  type="number"
                  value={ruleForm.maxPlayerPrice}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxPlayerPrice: Number.parseFloat(e.target.value) || 15 })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-budget">Transfer Budget (M)</Label>
              <Input
                id="transfer-budget"
                type="number"
                value={ruleForm.transferBudget}
                onChange={(e) => setRuleForm({ ...ruleForm, transferBudget: Number.parseFloat(e.target.value) || 5 })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-order">Display Order</Label>
              <Input
                id="display-order"
                type="number"
                value={ruleForm.displayOrder}
                onChange={(e) => setRuleForm({ ...ruleForm, displayOrder: Number.parseInt(e.target.value) || 0 })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Match Formats</Label>
              <div className="flex flex-wrap gap-2">
                {sportMatchFormats.map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={`budget-format-${format.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={ruleForm.matchFormats.includes(format)}
                      onCheckedChange={() => handleMatchFormatToggle(format)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`budget-format-${format.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm font-normal">
                      {format}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

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