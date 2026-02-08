"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Edit2, Plus, Trash2, Search, Filter, ShieldOff, ShieldCheck, Mail, Phone, Calendar } from "lucide-react"
import { Admin } from "./types"
import AddAdminDialog from "./AddAdminDialog"
import EditAdminDialog from "./EditAdminDialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminsTabProps {
  admins: Admin[]
  currentUserRole: string
  onToggleStatus: (adminId: string) => void
  onAddAdmin: (admin: { name: string; email: string; role: string; status: "active" | "inactive" }) => Promise<void>
  onEditAdmin: (admin: Admin) => void
  onSaveEdit: (admin: Admin) => Promise<void>
  onDeleteAdmin: (adminId: string) => Promise<void>
  fetchAdmins: () => Promise<void>
}

export default function AdminsTab({
  admins,
  currentUserRole,
  onToggleStatus,
  onAddAdmin,
  onEditAdmin,
  onSaveEdit,
  onDeleteAdmin,
  fetchAdmins
}: AdminsTabProps) {
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const handleEditAdmin = (admin: Admin) => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can edit admin accounts")
      return
    }

    setCurrentAdmin(admin)
    setIsEditAdminOpen(true)
  }

  const handleDeleteAdmin = async (adminId: string) => {
    setDeletingAdminId(adminId)
    try {
      await onDeleteAdmin(adminId)
    } finally {
      setDeletingAdminId(null)
    }
  }

  const handleSaveEdit = async (updatedAdmin: Admin) => {
    await onSaveEdit(updatedAdmin)
    setIsEditAdminOpen(false)
  }

  // Helper function to get status
  const getStatus = (admin: Admin) => {
    return admin.admin.is_active ? 'active' : 'inactive'
  }

  // Filter admins based on search and status
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = searchQuery === "" ||
      admin.admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.admin.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.admin.role?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && admin.admin.is_active) ||
      (statusFilter === "inactive" && !admin.admin.is_active)

    return matchesSearch && matchesStatus
  })

  // Fixed: Handle undefined values
  const getInitials = (name?: string): string => {
    if (!name) return "AD"
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super admin': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'admin': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'viewer': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg lg:text-xl">Admins ({filteredAdmins.length})</CardTitle>
              <CardDescription>Manage admin accounts and their permissions</CardDescription>
              {currentUserRole !== "Super Admin" && (
                <p className="text-sm text-muted-foreground mt-2">Only Super Admins can manage this section</p>
              )}
            </div>
            
            {/* Mobile Filters Button */}
            <div className="block lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search admins..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex-1 min-w-[140px] max-w-[180px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Add Admin Button */}
                {currentUserRole === "Super Admin" && (
                  <Button 
                    onClick={() => setIsAddAdminOpen(true)} 
                    className="flex-shrink-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Filters Dropdown */}
          {isMobileFiltersOpen && (
            <div className="mt-4 lg:hidden space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Mobile Add Admin Button */}
                {currentUserRole === "Super Admin" && (
                  <Button 
                    onClick={() => setIsAddAdminOpen(true)} 
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Mobile Add Admin Button (when filters are hidden) */}
          {currentUserRole === "Super Admin" && (
            <div className="lg:hidden mt-4">
              <Button 
                onClick={() => setIsAddAdminOpen(true)} 
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
            {filteredAdmins.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No admins found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? 'Try adjusting your filters'
                      : 'Add your first admin using the "Add Admin" button'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border min-w-full">
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Mobile No</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.map((admin) => (
                        <TableRow key={admin.admin.admin_id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={admin.admin.image || ""} alt={admin.admin.full_name} />
                              <AvatarFallback className="text-xs">
                                {getInitials(admin.admin.full_name || admin.admin.username)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="truncate max-w-[180px]">{admin.admin.full_name || admin.admin.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{admin.admin.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2 max-w-[150px]">
                              <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{admin.admin.phone || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Badge variant="outline">
                                {admin.admin.role || 'Viewer'}
                              </Badge>
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
                                    ? "cursor-pointer hover:opacity-80 text-xs"
                                    : "cursor-not-allowed opacity-60 text-xs"
                                }
                              >
                                <div className="flex items-center gap-1">
                                  {getStatus(admin) === "active" ? (
                                    <ShieldCheck className="h-3 w-3" />
                                  ) : (
                                    <ShieldOff className="h-3 w-3" />
                                  )}
                                  {getStatus(admin)}
                                </div>
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {currentUserRole === "Super Admin" ? (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditAdmin(admin)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteAdmin(admin.admin.admin_id)}
                                    disabled={deletingAdminId === admin.admin.admin_id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {deletingAdminId === admin.admin.admin_id ? "Deleting..." : "Delete"}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-not-allowed">
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-not-allowed text-red-600">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-3 p-3">
                  {filteredAdmins.map((admin) => (
                    <div key={admin.admin.admin_id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={admin.admin.image || ""} alt={admin.admin.full_name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(admin.admin.full_name || admin.admin.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{admin.admin.full_name || admin.admin.username}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{admin.admin.email}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile Status Badge */}
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
                            <div className="flex items-center gap-1">
                              {getStatus(admin) === "active" ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <ShieldOff className="h-3 w-3" />
                              )}
                              {getStatus(admin)}
                            </div>
                          </Badge>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Mobile</p>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm font-medium">{admin.admin.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Role</p>
                          <Badge variant="outline" >
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {admin.admin.role || 'Viewer'}
                            </div>
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Last Login</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{admin.admin.last_login_formatted || 'Never'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        {currentUserRole === "Super Admin" ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAdmin(admin)}
                              className="flex-1"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.admin.admin_id)}
                              disabled={deletingAdminId === admin.admin.admin_id}
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {deletingAdminId === admin.admin.admin_id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled className="flex-1 opacity-50 bg-transparent">
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" disabled className="flex-1 opacity-50 bg-transparent text-red-600">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  )
}