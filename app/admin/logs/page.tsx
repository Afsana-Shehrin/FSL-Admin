"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Clock, UserIcon, FileText } from "lucide-react"
import { activityLogs, type ActivityLog } from "@/lib/dummy-data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>(activityLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [filterEntity, setFilterEntity] = useState<string>("all")

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAction = filterAction === "all" || log.action === filterAction
    const matchesEntity = filterEntity === "all" || log.entity === filterEntity

    return matchesSearch && matchesAction && matchesEntity
  })

  const getActionBadge = (action: string) => {
    const variants = {
      created: "default",
      updated: "secondary",
      deleted: "destructive",
    } as const
    return variants[action as keyof typeof variants] || "secondary"
  }

  const getEntityIcon = (entity: string) => {
    const icons = {
      player: UserIcon,
      fixture: FileText,
      gameweek: Clock,
      team: UserIcon,
      league: FileText,
    }
    return icons[entity as keyof typeof icons] || FileText
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Monitor all admin actions and system changes</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Activity</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="player">Players</SelectItem>
                  <SelectItem value="fixture">Fixtures</SelectItem>
                  <SelectItem value="gameweek">Gameweeks</SelectItem>
                  <SelectItem value="team">Teams</SelectItem>
                  <SelectItem value="league">Leagues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const EntityIcon = getEntityIcon(log.entity)
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadge(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{log.entity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm">{log.details}</span>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-2" />
                      <p>No activity logs found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Actions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{new Set(logs.map((l) => l.userId)).size}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Active Entity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">{logs[0]?.entity || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">Most modified today</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
