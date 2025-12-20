"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Database } from "lucide-react"

export default function SystemTab() {
  return (
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
  )
}