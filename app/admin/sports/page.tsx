"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, GripVertical } from "lucide-react"
import { sports, type Sport } from "@/lib/dummy-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"

export default function SportsPage() {
  const [sportsList, setSportsList] = useState<Sport[]>(sports)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    displayOrder: 0,
    isActive: true,
  })

  const filteredSports = sportsList.filter((sport) => sport.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport)
    setFormData({
      name: sport.name,
      icon: sport.icon,
      displayOrder: sport.displayOrder,
      isActive: sport.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingSport(null)
    setFormData({
      name: "",
      icon: "",
      displayOrder: sportsList.length + 1,
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingSport) {
      setSportsList(sportsList.map((s) => (s.id === editingSport.id ? { ...s, ...formData } : s)))
    } else {
      const newSport: Sport = {
        id: String(sportsList.length + 1),
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setSportsList([...sportsList, newSport])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setSportsList(sportsList.filter((s) => s.id !== id))
  }

  const toggleActive = (id: string) => {
    setSportsList(sportsList.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sports Management</h1>
          <p className="text-muted-foreground">Manage sports available in your fantasy platform</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSport ? "Edit Sport" : "Add New Sport"}</DialogTitle>
              <DialogDescription>
                {editingSport ? "Update the sport details below." : "Add a new sport to your platform."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sport Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Football"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji or URL)</Label>
                <Input
                  id="icon"
                  placeholder="⚽ or /icon.svg"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingSport ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sports</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sports..."
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSports.map((sport) => (
                <TableRow key={sport.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  </TableCell>
                  <TableCell>
                    <div className="text-2xl">{sport.icon}</div>
                  </TableCell>
                  <TableCell className="font-medium">{sport.name}</TableCell>
                  <TableCell>{sport.displayOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={sport.isActive} onCheckedChange={() => toggleActive(sport.id)} />
                      <Badge variant={sport.isActive ? "default" : "secondary"}>
                        {sport.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{sport.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sport)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sport.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
