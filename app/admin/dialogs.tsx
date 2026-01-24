"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, CheckCircle, XCircle } from "lucide-react"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Gameweek {
  gameweek_id: number
  gameweek_number: number
  gameweek_name: string
  deadline_time: string
  start_date: string
  end_date: string
  is_current: boolean
  is_finished: boolean // This is used as lock status
  season: {
    season_name: string
    league: {
      league_name: string
      sport: {
        sport_name: string
      }
    }
  }
}

interface DashboardDialogsProps {
  lockDialogOpen: boolean
  setLockDialogOpen: (open: boolean) => void
}

export default function DashboardDialogs({
  lockDialogOpen,
  setLockDialogOpen,
}: DashboardDialogsProps) {
  const { toast } = useToast()
  
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [selectedGameweek, setSelectedGameweek] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (lockDialogOpen) {
      fetchCurrentGameweeks()
    }
  }, [lockDialogOpen])

  async function fetchCurrentGameweeks() {
    try {
      setIsFetching(true)
      
      // Fetch ONLY current gameweeks (is_current = true)
      const { data: gameweeksData, error: gameweeksError } = await supabase
        .from('gameweeks')
        .select('*')
        .eq('is_current', true) // Only fetch current gameweeks
        .order('deadline_time', { ascending: true })

      if (gameweeksError) throw gameweeksError

      if (!gameweeksData || gameweeksData.length === 0) {
        setGameweeks([])
        return
      }

      // For each gameweek, fetch season/league/sport info
      const gameweeksWithDetails = await Promise.all(
        gameweeksData.map(async (gameweek: any) => {
          // Fetch season
          const { data: seasonData } = await supabase
            .from('seasons')
            .select('season_name, league_id')
            .eq('season_id', gameweek.season_id)
            .single()

          let leagueName = 'Unknown League'
          let sportName = 'Unknown Sport'
          
          if (seasonData) {
            // Fetch league
            const { data: leagueData } = await supabase
              .from('leagues')
              .select('league_name, sport_id')
              .eq('league_id', seasonData.league_id)
              .single()

            if (leagueData) {
              leagueName = leagueData.league_name
              
              // Fetch sport
              const { data: sportData } = await supabase
                .from('sports')
                .select('sport_name')
                .eq('sport_id', leagueData.sport_id)
                .single()

              if (sportData) {
                sportName = sportData.sport_name
              }
            }
          }

          return {
            gameweek_id: gameweek.gameweek_id,
            gameweek_number: gameweek.gameweek_number,
            gameweek_name: gameweek.gameweek_name,
            deadline_time: gameweek.deadline_time,
            start_date: gameweek.start_date,
            end_date: gameweek.end_date,
            is_current: gameweek.is_current,
            is_finished: gameweek.is_finished, // Using this as lock status
            season: {
              season_name: seasonData?.season_name || 'Unknown Season',
              league: {
                league_name: leagueName,
                sport: {
                  sport_name: sportName
                }
              }
            }
          }
        })
      )

      setGameweeks(gameweeksWithDetails)
      
      if (gameweeksWithDetails.length > 0 && !selectedGameweek) {
        setSelectedGameweek(gameweeksWithDetails[0].gameweek_id.toString())
      }

    } catch (error) {
      console.error('Error fetching gameweeks:', error)
      toast({
        title: "Error",
        description: "Failed to fetch current gameweeks",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handleGameweekCurrentToggle = async () => {
    if (!selectedGameweek) {
      toast({
        title: "Error",
        description: "Please select a gameweek",
        variant: "destructive",
      })
      return
    }

    const gameweekId = parseInt(selectedGameweek)
    const selectedGameweekData = gameweeks.find(gw => gw.gameweek_id === gameweekId)
    
    if (!selectedGameweekData) {
      toast({
        title: "Error",
        description: "Gameweek not found",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newCurrentStatus = !selectedGameweekData.is_current

      // Update the gameweek current status
      const { error: updateError } = await supabase
        .from('gameweeks')
        .update({ is_current: newCurrentStatus })
        .eq('gameweek_id', gameweekId)

      if (updateError) throw updateError

      // Update local state
      setGameweeks(prev => prev.map(gw => 
        gw.gameweek_id === gameweekId 
          ? { ...gw, is_current: newCurrentStatus }
          : gw
      ))

      toast({
        title: newCurrentStatus ? "Gameweek Set as Current" : "Gameweek Removed from Current",
        description: `${selectedGameweekData.gameweek_name || `Gameweek ${selectedGameweekData.gameweek_number}`} is ${newCurrentStatus ? 'now the current gameweek' : 'no longer current'}.`,
      })

      // Refresh the list - after removing from current, it won't show in the list
      fetchCurrentGameweeks()

    } catch (error) {
      console.error('Error updating gameweek current status:', error)
      toast({
        title: "Error",
        description: "Failed to update gameweek current status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGameweekLock = async () => {
    if (!selectedGameweek) {
      toast({
        title: "Error",
        description: "Please select a gameweek",
        variant: "destructive",
      })
      return
    }

    const gameweekId = parseInt(selectedGameweek)
    const selectedGameweekData = gameweeks.find(gw => gw.gameweek_id === gameweekId)
    
    if (!selectedGameweekData) {
      toast({
        title: "Error",
        description: "Gameweek not found",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const isFinished = selectedGameweekData.is_finished
      const newLockStatus = !isFinished

      // Update the gameweek lock status using is_finished field
      const { error: updateError } = await supabase
        .from('gameweeks')
        .update({ is_finished: newLockStatus })
        .eq('gameweek_id', gameweekId)

      if (updateError) throw updateError

      // Update local state
      setGameweeks(prev => prev.map(gw => 
        gw.gameweek_id === gameweekId 
          ? { ...gw, is_finished: newLockStatus }
          : gw
      ))

      toast({
        title: newLockStatus ? "Gameweek Locked" : "Gameweek Unlocked",
        description: `${selectedGameweekData.gameweek_name || `Gameweek ${selectedGameweekData.gameweek_number}`} has been ${newLockStatus ? 'locked' : 'unlocked'}. Team changes are now ${newLockStatus ? 'disabled' : 'enabled'}.`,
      })

      // Refresh the list
      fetchCurrentGameweeks()

    } catch (error) {
      console.error('Error updating gameweek lock status:', error)
      toast({
        title: "Error",
        description: "Failed to update gameweek lock status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const selectedGameweekData = gameweeks.find(gw => gw.gameweek_id.toString() === selectedGameweek)

  return (
    <>
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Current Gameweeks</DialogTitle>
            <DialogDescription>
              Manage current gameweeks - remove from current or lock/unlock.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isFetching ? (
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : gameweeks.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gameweek">Select Gameweek</Label>
                  <Select value={selectedGameweek} onValueChange={setSelectedGameweek}>
                    <SelectTrigger id="gameweek">
                      <SelectValue placeholder="Choose gameweek..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gameweeks.map((gameweek) => (
                        <SelectItem key={gameweek.gameweek_id} value={gameweek.gameweek_id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{gameweek.gameweek_name || `Gameweek ${gameweek.gameweek_number}`}</span>
                            <Badge variant="default" className="h-5 text-xs bg-blue-600">
                              Current
                            </Badge>
                            {gameweek.is_finished ? (
                              <Badge variant="destructive" className="h-5 text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Locked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="h-5 text-xs">
                                <Unlock className="h-3 w-3 mr-1" />
                                Unlocked
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGameweekData && (
                  <div className="space-y-3 p-3 border rounded-md bg-secondary/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">
                        {selectedGameweekData.gameweek_name || `Gameweek ${selectedGameweekData.gameweek_number}`}
                      </h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <span>Sport:</span>
                          <span className="font-medium">{selectedGameweekData.season.league.sport.sport_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>League:</span>
                          <span className="font-medium">{selectedGameweekData.season.league.league_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Season:</span>
                          <span className="font-medium">{selectedGameweekData.season.season_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Start:</span>
                          <div className="font-medium">{formatDate(selectedGameweekData.start_date)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End:</span>
                          <div className="font-medium">{formatDate(selectedGameweekData.end_date)}</div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Deadline:</span>
                        <div className="font-medium">{formatDateTime(selectedGameweekData.deadline_time)}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Current Status:</span>
                        <Badge variant="default" className="h-6 text-xs bg-blue-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Currently Active
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Lock Status:</span>
                        {selectedGameweekData.is_finished ? (
                          <Badge variant="destructive" className="h-6 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Currently Locked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-6 text-xs">
                            <Unlock className="h-3 w-3 mr-1" />
                            Currently Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No current gameweeks found.</p>
                <p className="text-xs mt-1">Mark gameweeks as current in your database first.</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLockDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            
            {gameweeks.length > 0 && selectedGameweek && (
              <>
                <Button 
                  onClick={handleGameweekCurrentToggle} 
                  disabled={isLoading}
                  variant="default"
                  className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isLoading ? "Processing..." : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Remove from Current
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleGameweekLock} 
                  disabled={isLoading}
                  variant={selectedGameweekData?.is_finished ? "outline" : "default"}
                  className={`w-full sm:w-auto ${selectedGameweekData?.is_finished ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                >
                  {isLoading ? "Processing..." : selectedGameweekData?.is_finished ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Gameweek
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Gameweek
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}