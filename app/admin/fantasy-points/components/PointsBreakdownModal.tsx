"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PlayerStats, PointsBreakdown } from "../lib/types"
import { 
  Target, 
  Sword, 
  Shield, 
  Trophy,
  Zap,
  Award,
  Skull,
  TrendingUp,
  TrendingDown
} from "lucide-react"

interface PointsBreakdownModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: PlayerStats
  breakdown: PointsBreakdown
}

export function PointsBreakdownModal({
  open,
  onOpenChange,
  player,
  breakdown
}: PointsBreakdownModalProps) {
  const getCategoryColor = (points: number) => {
    if (points > 0) return "text-green-600"
    if (points < 0) return "text-red-600"
    return "text-gray-600"
  }

  const categories = [
    {
      title: "Batting Points",
      icon: <Sword className="h-4 w-4" />,
      color: "bg-blue-500",
      items: [
        { label: "Runs Scored", value: breakdown.batting.runs },
        { label: "Boundaries (4s & 6s)", value: breakdown.batting.boundaries },
        { label: "Milestone Bonus", value: breakdown.batting.milestone },
        { label: "Strike Rate Bonus/Penalty", value: breakdown.batting.strikeRate },
        { label: "Duck Penalty", value: breakdown.batting.duck }
      ]
    },
    {
      title: "Bowling Points",
      icon: <Target className="h-4 w-4" />,
      color: "bg-green-500",
      items: [
        { label: "Wickets Taken", value: breakdown.bowling.wickets },
        { label: "Bowled/LBW Bonus", value: breakdown.bowling.wicketType },
        { label: "Maiden Overs", value: breakdown.bowling.maiden },
        { label: "Wicket Milestone Bonus", value: breakdown.bowling.wicketMilestone },
        { label: "Economy Rate Bonus/Penalty", value: breakdown.bowling.economy }
      ]
    },
    {
      title: "Fielding Points",
      icon: <Shield className="h-4 w-4" />,
      color: "bg-amber-500",
      items: [
        { label: "Catches", value: breakdown.fielding.catches },
        { label: "Stumpings", value: breakdown.fielding.stumpings },
        { label: "Run Outs", value: breakdown.fielding.runouts }
      ]
    },
    {
      title: "Special Bonuses",
      icon: <Award className="h-4 w-4" />,
      color: "bg-purple-500",
      items: [
        { label: "Captain Bonus", value: breakdown.captainBonus },
        { label: "Vice-Captain Bonus", value: breakdown.viceCaptainBonus },
        { label: "Player of the Match", value: breakdown.playerOfMatch }
      ]
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Points Breakdown: {player.player_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Points Summary */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <div className="text-sm text-muted-foreground">Total Fantasy Points</div>
                  <div className="text-4xl font-bold text-primary">
                    {breakdown.total.toFixed(1)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg">
                    Rank: #{player.position}
                  </Badge>
                  <Badge className="text-lg bg-primary">
                    <Zap className="h-4 w-4 mr-2" />
                    Performance Score
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Distribution Chart */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCategoryColor(breakdown.batting.runs + breakdown.batting.boundaries + breakdown.batting.milestone)}`}>
                    {(breakdown.batting.runs + breakdown.batting.boundaries + breakdown.batting.milestone).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Batting</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCategoryColor(breakdown.bowling.wickets + breakdown.bowling.wicketType + breakdown.bowling.maiden)}`}>
                    {(breakdown.bowling.wickets + breakdown.bowling.wicketType + breakdown.bowling.maiden).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Bowling</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCategoryColor(breakdown.fielding.catches + breakdown.fielding.stumpings + breakdown.fielding.runouts)}`}>
                    {(breakdown.fielding.catches + breakdown.fielding.stumpings + breakdown.fielding.runouts).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Fielding</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCategoryColor(breakdown.captainBonus + breakdown.viceCaptainBonus + breakdown.playerOfMatch)}`}>
                    {(breakdown.captainBonus + breakdown.viceCaptainBonus + breakdown.playerOfMatch).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Special</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-4">
            {categories.map((category, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-full ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <h3 className="font-semibold">{category.title}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {item.label}
                          </span>
                          {item.value < 0 && (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          {item.value > 0 && (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <Badge
                          variant={item.value >= 0 ? "default" : "destructive"}
                          className="font-mono"
                        >
                          {item.value >= 0 ? "+" : ""}{item.value.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Player Stats Summary */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Player Match Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{player.runs}</div>
                  <div className="text-sm text-muted-foreground">Runs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{player.wickets}</div>
                  <div className="text-sm text-muted-foreground">Wickets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{player.catches}</div>
                  <div className="text-sm text-muted-foreground">Catches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{player.strike_rate.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Strike Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}