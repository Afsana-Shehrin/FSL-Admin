"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Edit2, Plus } from "lucide-react"
import { Admin } from "./types"
import AddAdminDialog from "./AddAdminDialog"
import EditAdminDialog from "./EditAdminDialog"

interface AdminsTabProps {
  admins: Admin[]
  currentUserRole: string
  onToggleStatus: (adminId: string) => void
  onAddAdmin: (admin: { name: string; email: string; role: string; status: "active" | "inactive" }) => Promise<void>
  onEditAdmin: (admin: Admin) => void
  onSaveEdit: (admin: Admin) => Promise<void>
  fetchAdmins: () => Promise<void>
}

export default function AdminsTab({
  admins,
  currentUserRole,
  onToggleStatus,
  onAddAdmin,
  onEditAdmin,
  onSaveEdit,
  fetchAdmins
}: AdminsTabProps) {
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)

  const handleEditAdmin = (admin: Admin) => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can edit admin accounts")
      return
    }

    setCurrentAdmin(admin)
    setIsEditAdminOpen(true)
  }

  const handleSaveEdit = async (updatedAdmin: Admin) => {
    await onSaveEdit(updatedAdmin)
    setIsEditAdminOpen(false)
  }

  // Helper function to get status
  const getStatus = (admin: Admin) => {
    return admin.admin.is_active ? 'active' : 'inactive'
  }

  // Helper function to get last login (you'll need to add this to your interface if needed)
  const getLastLogin = (admin: Admin) => {
    // You might need to fetch this separately or add to your Admin interface
    return 'Never' // Placeholder
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Admins</CardTitle>
              <CardDescription>Manage admin accounts and their permissions</CardDescription>
              {currentUserRole !== "Super Admin" && (
                <p className="text-sm text-muted-foreground mt-2">Only Super Admins can manage this section</p>
              )}
            </div>
            {currentUserRole === "Super Admin" && (
              <Button onClick={() => setIsAddAdminOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
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
                {admins.map((admin) => (
                  <TableRow key={admin.admin.admin_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.admin.image ? (
                          <img
                            src={admin.admin.image || "/placeholder.svg"}
                            alt={admin.admin.full_name || admin.admin.email}
                            className="h-8 w-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <span className="font-medium">{admin.admin.full_name || admin.admin.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>{admin.admin.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.admin.phone || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {admin.admin.role || 'Viewer'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onToggleStatus(admin.admin.admin_id)}
                        disabled={currentUserRole !== "Super Admin"}
                      >
                        <Badge
                          variant={getStatus(admin) === "active" ? "default" : "secondary"}
                          className={
                            currentUserRole === "Super Admin"
                              ? "cursor-pointer hover:opacity-80"
                              : "cursor-not-allowed opacity-60"
                          }
                        >
                          {getStatus(admin)}
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
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {admins.map((admin) => (
              <Card key={admin.admin.admin_id} className="p-4">
                <div className="flex items-start gap-3">
                  {admin.admin.image ? (
                    <img
                      src={admin.admin.image || "/placeholder.svg"}
                      alt={admin.admin.full_name || admin.admin.email}
                      className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-base">{admin.admin.full_name || admin.admin.username}</h3>
                        <p className="text-sm text-muted-foreground truncate">{admin.admin.email}</p>
                      </div>
                      <button
                        onClick={() => onToggleStatus(admin.admin.admin_id)}
                        disabled={currentUserRole !== "Super Admin"}
                      >
                        <Badge
                          variant={getStatus(admin) === "active" ? "default" : "secondary"}
                          className={
                            currentUserRole === "Super Admin"
                              ? "cursor-pointer hover:opacity-80 text-xs"
                              : "cursor-not-allowed opacity-60 text-xs"
                          }
                        >
                          {getStatus(admin)}
                        </Badge>
                      </button>
                    </div>
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{admin.admin.role || 'Viewer'}</span>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-medium">Mobile:</span> {admin.admin.phone || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last login: {getLastLogin(admin)}
                      </div>
                    </div>
                    {currentUserRole === "Super Admin" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAdmin(admin)}
                        className="w-full"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Admin
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="w-full opacity-50 bg-transparent">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Admin
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddAdminDialog
        open={isAddAdminOpen}
        onOpenChange={setIsAddAdminOpen}
        onAddAdmin={onAddAdmin}
        fetchAdmins={fetchAdmins}
      />

      {currentAdmin && (
        <EditAdminDialog
          open={isEditAdminOpen}
          onOpenChange={setIsEditAdminOpen}
          admin={currentAdmin}
          onSave={handleSaveEdit}
          fetchAdmins={fetchAdmins}
        />
      )}
    </>
  )
}