import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Calculator, RefreshCw, Plus } from "lucide-react"

interface QuickActionsProps {
  onLock: () => void
  onScoring: () => void
  onStats: () => void
  onAddAction: () => void
  isProcessing?: boolean
}

export default function QuickActions({ 
  onLock, 
  onScoring, 
  onStats, 
  onAddAction,
  isProcessing = false 
}: QuickActionsProps) {
  const actions = [
    {
      title: "Trigger Gameweek Lock",
      description: "Lock current gameweek for team changes",
      icon: Lock,
      onClick: onLock,
    },
    {
      title: "Run Scoring Calculation",
      description: "Calculate points for completed fixtures",
      icon: Calculator,
      onClick: onScoring,
    },
    {
      title: "Update Player Stats",
      description: "Sync latest player statistics",
      icon: RefreshCw,
      onClick: onStats,
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quick Actions</CardTitle>
        <Button size="sm" variant="outline" onClick={onAddAction}>
          <Plus className="h-4 w-4 mr-1" />
          Add More
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                onClick={action.onClick}
                disabled={isProcessing}
                className="w-full text-left px-4 py-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <p className="font-medium">{action.title}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}