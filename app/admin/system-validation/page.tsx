"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LeagueReadiness {
  league_id: number
  league_name: string
  sport_id: number
  sport_name: string
  league_active: boolean
  has_active_season: boolean
  has_budget_rules: boolean
  has_formations: boolean
  has_positions: boolean
  has_teams: boolean
  has_players: boolean
  has_validation_rules: boolean
  is_ready: boolean
}

export default function SystemValidationPage() {
  const [readiness, setReadiness] = useState<LeagueReadiness[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, ready: 0, notReady: 0 })
  const router = useRouter()

  const fetchReadiness = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/league-readiness')
      const data = await response.json()
      setReadiness(data.leagues || [])
      setSummary(data.summary || { total: 0, ready: 0, notReady: 0 })
    } catch (error) {
      console.error('Error fetching readiness:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReadiness()
  }, [])

  const createSeason = async (leagueId: number, sportId: number) => {
    try {
      const response = await fetch('/api/admin/league-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, sportId })
      })
      
      if (response.ok) {
        alert('Season created successfully!')
        fetchReadiness()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating season:', error)
      alert('Failed to create season')
    }
  }

  const createValidationRules = async (leagueId: number, sportId: number) => {
    try {
      const response = await fetch('/api/admin/league-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, sportId, action: 'create_validation_rules' })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Success! Created ${result.rulesCount} validation rules`)
        fetchReadiness()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating validation rules:', error)
      alert('Failed to create validation rules')
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Validation</h1>
          <p className="text-muted-foreground">Check if your leagues are ready for users</p>
        </div>
        <Button onClick={fetchReadiness} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Leagues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Not Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.notReady}</div>
          </CardContent>
        </Card>
      </div>

      {/* League Status */}
      <Card>
        <CardHeader>
          <CardTitle>League Status</CardTitle>
          <CardDescription>
            All leagues need: Active Season, Budget Rules, Formations, Positions, Teams, Players, and Validation Rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readiness.map((league) => (
              <Card key={league.league_id} className={league.is_ready ? 'border-green-500' : 'border-red-500'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{league.league_name}</CardTitle>
                      <CardDescription>
                        {league.sport_name} (Sport ID: {league.sport_id}, League ID: {league.league_id})
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {league.is_ready ? (
                        <Badge className="bg-green-600">Ready</Badge>
                      ) : (
                        <Badge variant="destructive">Not Ready</Badge>
                      )}
                      {!league.league_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_active_season} />
                      <span className="text-sm">Active Season</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_budget_rules} />
                      <span className="text-sm">Budget Rules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_formations} />
                      <span className="text-sm">Formations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_positions} />
                      <span className="text-sm">Positions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_teams} />
                      <span className="text-sm">Teams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_players} />
                      <span className="text-sm">Players</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={league.has_validation_rules} />
                      <span className="text-sm">Validation Rules</span>
                    </div>
                  </div>

                  {!league.is_ready && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                            Missing Configuration
                          </p>
                          <div className="space-y-1">
                            {!league.has_active_season && (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  ❌ No active season - Users can't save teams!
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => createSeason(league.league_id, league.sport_id)}
                                >
                                  Create Season
                                </Button>
                              </div>
                            )}
                            {!league.has_budget_rules && (
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ❌ No budget rules - Go to <button onClick={() => router.push('/admin/budget-rules')} className="underline">Budget Rules</button>
                              </p>
                            )}
                            {!league.has_formations && (
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ❌ No formations - Go to <button onClick={() => router.push('/admin/formations')} className="underline">Formations</button>
                              </p>
                            )}
                            {!league.has_positions && (
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ❌ No positions - Go to <button onClick={() => router.push('/admin/positions')} className="underline">Positions</button>
                              </p>
                            )}
                            {!league.has_teams && (
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ❌ No teams - Go to <button onClick={() => router.push('/admin/teams')} className="underline">Teams</button>
                              </p>
                            )}
                            {!
                            {!league.has_validation_rules && league.has_budget_rules && (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  ⚠️ No validation rules - Auto-create based on budget rules
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => createValidationRules(league.league_id, league.sport_id)}
                                >
                                  Create Rules
                                </Button>
                              </div>
                            )}league.has_players && (
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ❌ No players - Go to <button onClick={() => router.push('/admin/players')} className="underline">Players</button>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
