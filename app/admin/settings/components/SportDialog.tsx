"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"
import { Sport, SportFormData } from "./types"

interface SportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sportFormData: SportFormData
  setSportFormData: (data: SportFormData) => void
  editingSport: Sport | null
  onSave: () => void
  onCreate: () => void
}

export default function SportDialog({
  open,
  onOpenChange,
  sportFormData,
  setSportFormData,
  editingSport,
  onSave,
  onCreate
}: SportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sport
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingSport ? "Edit Sport" : "Add New Sport"}</DialogTitle>
          <DialogDescription>
            {editingSport ? "Update sport details" : "Create a new sport for your fantasy platform"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sport-name">Sport Name</Label>
            <Input
              id="sport-name"
              placeholder="e.g., Basketball, Tennis, Rugby"
              value={sportFormData.name}
              onChange={(e) => setSportFormData({ ...sportFormData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sport-icon">Icon (Emoji)</Label>
            <Input
              id="sport-icon"
              placeholder="e.g., 🏀, 🎾, 🏉"
              value={sportFormData.icon}
              onChange={(e) => setSportFormData({ ...sportFormData, icon: e.target.value })}
              maxLength={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sport-active">Active Status</Label>
            <Switch
              id="sport-active"
              checked={sportFormData.isActive}
              onCheckedChange={(checked) => setSportFormData({ ...sportFormData, isActive: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>{editingSport ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}