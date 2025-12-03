"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Calendar, LogIn, Shield, ShieldOff } from "lucide-react" // Removed Trash2
import { users, type User, type UserStatus } from "@/lib/dummy-data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function UsersPage() {
  const [usersList, setUsersList] = useState<User[]>(users)
  const [searchQuery, setSearchQuery] = useState("")
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [blockReason, setBlockReason] = useState("")

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleUserStatus = (userId: string, newStatus: UserStatus) => {
    setUsersList(usersList.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const handleBlockUser = (user: User) => {
    setSelectedUser(user)
    setIsBlockDialogOpen(true)
  }

  const confirmBlockUser = () => {
    if (selectedUser) {
      toggleUserStatus(selectedUser.id, "blocked")
      // Here you would typically send an API request to block the user
      console.log(`Blocked user ${selectedUser.name} for reason: ${blockReason}`)
      setBlockReason("")
      setIsBlockDialogOpen(false)
    }
  }

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      active: "default",
      blocked: "destructive",
      inactive: "secondary",
    } as const
    return variants[status] || "default"
  }

  const getStatusIcon = (status: UserStatus) => {
    switch(status) {
      case 'active': return <Shield className="h-4 w-4 text-green-500" />
      case 'blocked': return <ShieldOff className="h-4 w-4 text-red-500" />
      default: return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getTeamsText = (teams: number) => {
    return teams === 0 ? "No teams" : `${teams} team${teams !== 1 ? 's' : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts, permissions, and restrictions</p>
        </div>
        {/* No buttons in header - just the title */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <Badge variant={getStatusBadge(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTeamsText(user.teams)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {user.createdAt}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LogIn className="h-3 w-3 text-muted-foreground" />
                      {user.lastLogin}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === "active" ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleBlockUser(user)}
                        >
                          Block
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, "active")}
                        >
                          Unblock
                        </Button>
                      )}
                      {/* Delete button removed */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Block User Dialog */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User: {selectedUser?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This action will prevent the user from logging in. They will see a "Permission denied due to violation of rules" message.
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
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBlockReason("")
              setIsBlockDialogOpen(false)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBlockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}