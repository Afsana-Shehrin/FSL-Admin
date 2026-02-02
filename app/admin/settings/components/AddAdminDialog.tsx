"use client"

import { useState } from "react"
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

interface AddAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddAdmin: (admin: { name: string; email: string; role: string; status: "active" | "inactive" }) => Promise<void>
  fetchAdmins: () => Promise<void>
}

export default function AddAdminDialog({ open, onOpenChange, onAddAdmin, fetchAdmins }: AddAdminDialogProps) {
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "Editor" as "Super Admin" | "Manager" | "Editor" | "Viewer",
    status: "active" as "active" | "inactive"
  })

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      alert("Please fill in all required fields")
      return
    }

    await onAddAdmin(newAdmin)
    setNewAdmin({
      name: "",
      email: "",
      role: "Editor",
      status: "active"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogDescription>Create a new admin account with specific permissions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              placeholder="Enter admin name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-email">Email Address</Label>
            <Input
              id="add-email"
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-role">Role</Label>
            <Select value={newAdmin.role} onValueChange={(value: any) => setNewAdmin({ ...newAdmin, role: value })}>
              <SelectTrigger id="add-role">
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
          <Button onClick={handleAddAdmin} className="w-full sm:w-auto">
            Add Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}