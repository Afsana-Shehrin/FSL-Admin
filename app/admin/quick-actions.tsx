"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Calculator, BarChart ,CheckCircle} from "lucide-react"

interface QuickActionsProps {
  onLock: () => void
  onSetCurrent?: () => void
  onScoring?: () => void
  onStats?: () => void
}

export default function QuickActions({ onLock, onSetCurrent, onScoring, onStats }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button 
            onClick={onLock} 
            variant="outline" 
            className="w-full justify-start h-auto py-3 px-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">Trigger Gameweek Lock</div>
                <div className="text-sm text-muted-foreground">
                  Lock current gameweek for team changes
                </div>
              </div>
            </div>
          </Button>
           {onSetCurrent && (
            <Button 
              onClick={onSetCurrent} 
              variant="outline" 
              className="w-full justify-start h-auto py-3 px-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <CheckCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Set Current Gameweek</div>
                  <div className="text-sm text-muted-foreground">
                    Mark a gameweek as active/current
                  </div>
                </div>
              </div>
            </Button>
          )}

          {onScoring && (
            <Button 
              onClick={onScoring} 
              variant="outline" 
              className="w-full justify-start h-auto py-3 px-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Run Scoring Calculation</div>
                  <div className="text-sm text-muted-foreground">
                    Calculate points for completed fixtures
                  </div>
                </div>
              </div>
            </Button>
          )}

          {onStats && (
            <Button 
              onClick={onStats} 
              variant="outline" 
              className="w-full justify-start h-auto py-3 px-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <BarChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Update Player Stats</div>
                  <div className="text-sm text-muted-foreground">
                    Sync latest player statistics
                  </div>
                </div>
              </div>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}