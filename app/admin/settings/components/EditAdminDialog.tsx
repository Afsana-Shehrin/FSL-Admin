"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Admin } from "./types"

interface EditAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin: Admin
  onSave: (admin: Admin) => Promise<void>
  fetchAdmins: () => Promise<void>
}

export default function EditAdminDialog({ open, onOpenChange, admin, onSave, fetchAdmins }: EditAdminDialogProps) {
  const [editedAdmin, setEditedAdmin] = useState<Admin>(admin)

  useEffect(() => {
    setEditedAdmin(admin)
  }, [admin])

  const handleSave = async () => {
    await onSave(editedAdmin)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>Update admin account details and permissions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={editedAdmin.admin.full_name || ''}
              onChange={(e) => setEditedAdmin({ 
                ...editedAdmin, 
                admin: { ...editedAdmin.admin, full_name: e.target.value } 
              })}
              placeholder="Enter admin name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={editedAdmin.admin.email}
              onChange={(e) => setEditedAdmin({ 
                ...editedAdmin, 
                admin: { ...editedAdmin.admin, email: e.target.value } 
              })}
              placeholder="admin@example.com"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={editedAdmin.admin.role || 'Viewer'}
              onValueChange={(value: any) => setEditedAdmin({ 
                ...editedAdmin, 
                admin: { ...editedAdmin.admin, role: value } 
              })}
            >
              <SelectTrigger id="edit-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}