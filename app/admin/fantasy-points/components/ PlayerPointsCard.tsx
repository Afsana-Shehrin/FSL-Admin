"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, ChevronUp, Crown, Star, Trophy } from "lucide-react"
import { PlayerStats, PointsBreakdown } from "../lib/types"
import { PointsBreakdownModal } from "./PointsBreakdownModal"

interface PlayerPointsCardProps {
  player: PlayerStats
  breakdown?: PointsBreakdown
  onUpdate?: () => void
}

export function PlayerPointsCard({ player, breakdown, onUpdate }: PlayerPointsCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'batsman':
        return 'bg-blue-100 text-blue-800'
      case 'bowler':
        return 'bg-green-100 text-green-800'
      case 'all-rounder':
        return 'bg-purple-100 text-purple-800'
      case 'wicket-keeper':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`/api/player-image/${player.player_id}`} />
                <AvatarFallback>{getPlayerInitials(player.player_name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {player.player_name}
                  {player.is_captain && (
                    <Crown className="h-4 w-4 text-yellow-600" />
                  )}
                  {player.is_vice_captain && (
                    <Star className="h-4 w-4 text-gray-400" />
                  )}
                  {player.player_of_match && (
                    <Trophy className="h-4 w-4 text-amber-600" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getPositionColor(player.position)}>
                    {player.position}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    #{player.player_id}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {player.fantasy_points.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="text-center">
              <div className="text-sm font-medium">Runs</div>
              <div className="text-lg font-bold">{player.runs}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Wickets</div>
              <div className="text-lg font-bold">{player.wickets}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Catches</div>
              <div className="text-lg font-bold">{player.catches}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">SR</div>
              <div className="text-lg font-bold">{player.strike_rate.toFixed(1)}</div>
            </div>
          </div>

          {showDetails && (
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Balls:</span> {player.balls_faced}
                </div>
                <div>
                  <span className="text-muted-foreground">4s/6s:</span> {player.fours}/{player.sixes}
                </div>
                <div>
                  <span className="text-muted-foreground">Overs:</span> {player.overs || 0}
                </div>
                <div>
                  <span className="text-muted-foreground">Economy:</span> {player.economy_rate.toFixed(2)}
                </div>
                <div>
                  <span className="text-muted-foreground">Maidens:</span> {player.maidens}
                </div>
                <div>
                  <span className="text-muted-foreground">Run outs:</span> {player.run_outs}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 text-xs"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBreakdown(true)}
                className="h-8 text-xs"
              >
                View Breakdown
              </Button>
              {onUpdate && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onUpdate}
                  className="h-8 text-xs"
                >
                  Update Points
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {breakdown && (
        <PointsBreakdownModal
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          player={player}
          breakdown={breakdown}
        />
      )}
    </>
  )
}