"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js'
=======
import { getSupabase } from '@/lib/supabase/working-client'
>>>>>>> otherrepo/main
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, User, Shield, ShieldOff, Calendar, Phone, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<<<<<<< HEAD
// Initialize Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)
=======
// Initialize Supabase client
const supabase = getSupabase()
>>>>>>> otherrepo/main

// Define User type based on your database schema
interface DatabaseUser {
  user_id: number
  username: string | null
  email: string
  phone: string | null
  password_hash: string | null
  full_name: string | null
  profile_image_url: string | null
  country_code: string | null
  state_code: string | null
  is_verified: boolean | null
  is_active: boolean | null
  created_at: string
  auth_user_id: string | null
}

export default function UsersPage() {
  const { toast } = useToast()
  const [usersList, setUsersList] = useState<DatabaseUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<DatabaseUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null)
  const [blockReason, setBlockReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Check if Supabase is properly configured
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables!')
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers()
  }, [])

  // Apply filters when search or status changes
  useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, usersList])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setUsersList(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...usersList]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        if (statusFilter === "active") return user.is_active === true
        if (statusFilter === "inactive") return user.is_active === false
        if (statusFilter === "verified") return user.is_verified === true
        if (statusFilter === "unverified") return user.is_verified === false
        return true
      })
    }

    setFilteredUsers(filtered)
  }

  const toggleUserStatus = async (userId: number, isActive: boolean, reason?: string) => {
    try {
      setIsActionLoading(true)
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: isActive,
          ...(reason && { block_reason: reason })
        })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // Update local state
      setUsersList(prev => prev.map(user => 
        user.user_id === userId ? { ...user, is_active: isActive } : user
      ))

      toast({
        title: isActive ? "User Unblocked" : "User Blocked",
        description: isActive 
          ? "User has been successfully unblocked and can now access the platform."
          : "User has been blocked and cannot access the platform.",
      })

      return true
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBlockUser = (user: DatabaseUser) => {
    setSelectedUser(user)
    setIsBlockDialogOpen(true)
  }

  const confirmBlockUser = async () => {
    if (selectedUser) {
      const success = await toggleUserStatus(selectedUser.user_id, false, blockReason)
      if (success) {
        setBlockReason("")
        setIsBlockDialogOpen(false)
      }
    }
  }

  const handleDeleteUser = (user: DatabaseUser) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      try {
        setIsActionLoading(true)
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('user_id', selectedUser.user_id)

        if (error) {
          throw error
        }

        // Update local state
        setUsersList(prev => prev.filter(user => user.user_id !== selectedUser.user_id))

        toast({
          title: "User Deleted",
          description: `${selectedUser.full_name || selectedUser.email} has been permanently deleted.`,
        })

        setIsDeleteDialogOpen(false)
      } catch (error) {
        console.error('Error deleting user:', error)
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const getStatusBadge = (isActive: boolean | null) => {
    return isActive ? "default" : "destructive"
  }

  const getStatusIcon = (isActive: boolean | null) => {
    return isActive ? 
      <Shield className="h-4 w-4 text-green-500" /> : 
      <ShieldOff className="h-4 w-4 text-red-500" />
  }

  const getStatusText = (isActive: boolean | null) => {
    return isActive ? "Active" : "Blocked"
  }

  const getVerificationIcon = (isVerified: boolean | null) => {
    return isVerified ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-muted-foreground" />
  }

  const getInitials = (fullName: string | null, email: string) => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts, permissions, and restrictions</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Users: {usersList.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Blocked</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {usersList.length} users
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <User className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No users found</p>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery ? 'Try a different search term' : 'No users match the selected filters'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profile_image_url || ""} alt={user.full_name || user.email} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.full_name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{user.full_name || "No name"}</span>
                              {user.username && (
                                <span className="text-sm text-muted-foreground">@{user.username}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No phone</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(user.is_active)}
                              <Badge variant={getStatusBadge(user.is_active)}>
                                {getStatusText(user.is_active)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getVerificationIcon(user.is_verified)}
                              <span className="text-sm">
                                {user.is_verified ? "Verified" : "Unverified"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {user.is_active ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleBlockUser(user)}
                                  disabled={isActionLoading}
                                >
                                  <ShieldOff className="h-3 w-3 mr-1" />
                                  Block
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.user_id, true)}
                                  disabled={isActionLoading}
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Unblock
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isActionLoading}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Block User Dialog */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Block User: {selectedUser?.full_name || selectedUser?.email}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will prevent the user from logging in and accessing the platform. 
              They will see a "Permission denied due to violation of rules" message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="block-reason">Reason for blocking (optional)</Label>
            <Textarea
              id="block-reason"
              placeholder="Enter reason for blocking..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setBlockReason("")
                setIsBlockDialogOpen(false)
              }}
              disabled={isActionLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBlockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                "Block User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User: {selectedUser?.full_name || selectedUser?.email}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}