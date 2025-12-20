"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Edit2, Trash2, Plus } from "lucide-react"
import { Sport, SportFormData } from "./types"
import SportDialog from "./SportDialog"

interface SportsTabProps {
  sportsList: Sport[]
  onToggleSportStatus: (sportId: string) => void
  onEditSport: (sport: Sport) => void
  onDeleteSport: (sportId: string) => void
  onSaveSport: (sportFormData: SportFormData, editingSport: Sport | null) => void
}

export default function SportsTab({
  sportsList,
  onToggleSportStatus,
  onEditSport,
  onDeleteSport,
  onSaveSport
}: SportsTabProps) {
  const [isSportDialogOpen, setIsSportDialogOpen] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)
  const [sportFormData, setSportFormData] = useState<SportFormData>({
    name: "",
    icon: "",
    isActive: true
  })

  const handleCreateSport = () => {
    setEditingSport(null)
    setSportFormData({ name: "", icon: "", isActive: true })
    setIsSportDialogOpen(true)
  }

  const handleEditSport = (sport: Sport) => {
    setEditingSport(sport)
    setSportFormData({ name: sport.name, icon: sport.icon, isActive: sport.isActive })
    setIsSportDialogOpen(true)
    onEditSport(sport)
  }

  const handleSaveSport = () => {
    onSaveSport(sportFormData, editingSport)
    setIsSportDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Sports Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Create and manage sports for your fantasy platform</p>
          </div>
          <SportDialog
            open={isSportDialogOpen}
            onOpenChange={setIsSportDialogOpen}
            sportFormData={sportFormData}
            setSportFormData={setSportFormData}
            editingSport={editingSport}
            onSave={handleSaveSport}
            onCreate={handleCreateSport}
          />
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Sport Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sportsList.map((sport) => (
                  <TableRow key={sport.id}>
                    <TableCell>
                      <div className="text-2xl">{sport.icon}</div>
                    </TableCell>
                    <TableCell className="font-medium">{sport.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={sport.isActive}
                          onCheckedChange={() => onToggleSportStatus(sport.id)}
                        />
                        <Badge variant={sport.isActive ? "default" : "secondary"}>
                          {sport.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSport(sport)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteSport(sport.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {sportsList.map((sport) => (
              <Card key={sport.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{sport.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{sport.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={sport.isActive}
                        onCheckedChange={() => onToggleSportStatus(sport.id)}
                        className="scale-75"
                      />
                      <Badge variant={sport.isActive ? "default" : "secondary"} className="text-xs">
                        {sport.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditSport(sport)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDeleteSport(sport.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}