"use client"

import { useRef } from "react"
import { useEffect } from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Database, Plus, Edit2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Admin {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("")
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [isViewMode, setIsViewMode] = useState(false)
  const [newAdmin, setNewAdmin] = useState<Admin>({
    id: "",
    name: "",
    email: "",
    role: "Editor",
    status: "active",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const adminEmail = localStorage.getItem("adminEmail") || process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_EMAIL
  setCurrentUserEmail(adminEmail)
    
    // Get admins from localStorage or initialize with afsanashehrin@gmail.com as Super Admin
    let storedAdmins = JSON.parse(localStorage.getItem("loggedInAdmins") || "[]")
    
    // Check if afsanashehrin@gmail.com already exists
    const hasDefaultAdmin = storedAdmins.some((admin: Admin) => 
      admin.email === process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_EMAIL
    )
    
    // If not, add it as Super Admin
    if (!hasDefaultAdmin) {
      const defaultAdmin: Admin = {
        id: "default_super_admin",
        name: process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_NAME || "Super Admin",
        email: process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_EMAIL,
        role: process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_ROLE || "Super Admin",
        status: "active"
      }
      storedAdmins = [defaultAdmin, ...storedAdmins]
      localStorage.setItem("loggedInAdmins", JSON.stringify(storedAdmins))
    }
    
    // Ensure afsanashehrin@gmail.com has a profile
    if (!localStorage.getItem("admin_profile_afsanashehrin@gmail.com")) {
      localStorage.setItem(
        "admin_profile_afsanashehrin@gmail.com",
        JSON.stringify({
          phone: "",
          profilePicture: null,
        })
      )
    }
    
    // Set state
    setAdmins(storedAdmins)
    
    // Set current user role
    const currentUser = storedAdmins.find((admin: Admin) => admin.email === adminEmail)
    if (currentUser) {
      setCurrentUserRole(currentUser.role)
    } else {
      // If current user not found in admins, default to Super Admin for afsanashehrin@gmail.com
      if (adminEmail === "afsanashehrin@gmail.com") {
        setCurrentUserRole("Super Admin")
      }
    }
  }, [])

  const handleAddAdmin = () => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can add new admins")
      return
    }

    if (!newAdmin.name || !newAdmin.email) {
      alert("Please fill in all required fields")
      return
    }
    
    // Check if admin with this email already exists
    const adminExists = admins.some(admin => admin.email.toLowerCase() === newAdmin.email.toLowerCase())
    if (adminExists) {
      alert("An admin with this email already exists")
      return
    }
    
    const adminToAdd = {
      ...newAdmin,
      id: Date.now().toString(),
    }
    const updatedAdmins = [...admins, adminToAdd]
    setAdmins(updatedAdmins)
    localStorage.setItem("loggedInAdmins", JSON.stringify(updatedAdmins))
    
    // Create default profile for new admin
    const defaultProfile = {
      phone: "",
      profilePicture: null
    }
    localStorage.setItem(`admin_profile_${newAdmin.email}`, JSON.stringify(defaultProfile))
    
    setIsAddAdminOpen(false)
    setNewAdmin({
      id: "",
      name: "",
      email: "",
      role: "Editor",
      status: "active",
    })
    alert("Admin added successfully!")
  }

  const handleToggleStatus = (adminId: string) => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can change admin status")
      return
    }

    const adminToToggle = admins.find(admin => admin.id === adminId)
    
    // Prevent deactivating yourself
    if (adminToToggle?.email === currentUserEmail) {
      alert("You cannot deactivate your own account")
      return
    }

    const updatedAdmins = admins.map((admin) =>
      admin.id === adminId ? { ...admin, status: admin.status === "active" ? "inactive" : "active" } : admin,
    )
    setAdmins(updatedAdmins)
    localStorage.setItem("loggedInAdmins", JSON.stringify(updatedAdmins))
    alert("Admin status updated successfully!")
  }

  const handleEditAdmin = (admin: Admin) => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can edit admin accounts")
      return
    }

    setCurrentAdmin(admin)
    setIsViewMode(false)
    setIsEditAdminOpen(true)
  }

  const handleSaveEdit = () => {
    if (!currentAdmin) return
    
    // Check if email is being changed
    const originalAdmin = admins.find(admin => admin.id === currentAdmin.id)
    if (originalAdmin && originalAdmin.email !== currentAdmin.email) {
      alert("Cannot change admin email. Please delete and create a new admin instead.")
      return
    }
    
    const updatedAdmins = admins.map((admin) => (admin.id === currentAdmin.id ? currentAdmin : admin))
    setAdmins(updatedAdmins)
    localStorage.setItem("loggedInAdmins", JSON.stringify(updatedAdmins))
    setIsEditAdminOpen(false)
    alert("Admin updated successfully!")
  }

  const isCurrentUser = (adminEmail: string) => {
    return adminEmail === currentUserEmail
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage admin accounts, permissions, and system settings</p>
      </div>

      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Admins</CardTitle>
                  <CardDescription>Manage admin accounts and their permissions</CardDescription>
                  {currentUserRole !== "Super Admin" && (
                    <p className="text-sm text-muted-foreground mt-2">Only Super Admins can manage this section</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Logged in as: <span className="font-medium">{currentUserEmail}</span> ({currentUserRole})
                  </p>
                </div>
                {currentUserRole === "Super Admin" && (
                  <Button onClick={() => setIsAddAdminOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile No</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => {
                    const adminProfile =
                      typeof window !== "undefined"
                        ? JSON.parse(localStorage.getItem(`admin_profile_${admin.email}`) || "{}")
                        : {}
                    const profilePicture = adminProfile.profilePicture || null
                    const phoneNumber = adminProfile.phone || "N/A"

                    return (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {profilePicture ? (
                              <img
                                src={profilePicture || "/placeholder.svg"}
                                alt={admin.name || admin.email}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="font-medium">
                              {admin.name ||
                                admin.email.split("@")[0].charAt(0).toUpperCase() + admin.email.split("@")[0].slice(1)}
                              {isCurrentUser(admin.email) && (
                                <span className="ml-2 text-xs text-primary"></span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell className="text-muted-foreground">{phoneNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            {admin.role}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleStatus(admin.id)}
                            disabled={currentUserRole !== "Super Admin" || isCurrentUser(admin.email)}
                          >
                            <Badge
                              variant={admin.status === "active" ? "default" : "secondary"}
                              className={
                                currentUserRole === "Super Admin" && !isCurrentUser(admin.email)
                                  ? "cursor-pointer hover:opacity-80"
                                  : "cursor-not-allowed opacity-60"
                              }
                            >
                              {admin.status}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {currentUserRole === "Super Admin" ? (
                              <Button variant="ghost" size="sm" onClick={() => handleEditAdmin(admin)}>
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-not-allowed">
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Player Updates</Label>
                  <p className="text-sm text-muted-foreground">Get notified when player data changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fixture Updates</Label>
                  <p className="text-sm text-muted-foreground">Alerts for fixture status changes</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-muted-foreground">Critical system notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Advanced system settings and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable maintenance mode for system updates</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatic daily database backups</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">Show detailed error messages</p>
                </div>
                <Switch />
              </div>
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <Label>Database</Label>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      Backup Now
                    </Button>
                    <Button variant="outline">Clear Cache</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent>
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
              <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
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
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <Select
                value={newAdmin.status}
                onValueChange={(value: "active" | "inactive") => setNewAdmin({ ...newAdmin, status: value })}
              >
                <SelectTrigger id="add-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin}>Add Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAdminOpen} onOpenChange={setIsEditAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin account information
            </DialogDescription>
          </DialogHeader>
          {currentAdmin && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={currentAdmin.name}
                  onChange={(e) => setCurrentAdmin({ ...currentAdmin, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={currentAdmin.email}
                  disabled={true}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={currentAdmin.role}
                  onValueChange={(value) => setCurrentAdmin({ ...currentAdmin, role: value })}
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
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={currentAdmin.status}
                  onValueChange={(value: "active" | "inactive") => setCurrentAdmin({ ...currentAdmin, status: value })}
                  disabled={isCurrentUser(currentAdmin.email)}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {isCurrentUser(currentAdmin.email) && (
                  <p className="text-xs text-muted-foreground mt-1">Cannot change your own status</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAdminOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}