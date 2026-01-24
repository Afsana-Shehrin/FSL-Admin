"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LeaguesTab from "./leagues"
import SeasonsTab from "./seasons"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Type for Sport
type Sport = {
  sport_id: number
  sport_name: string
  sport_code: string
  icon_url: string
  is_active: boolean
  display_order: number
  created_at: string
}

export default function LeaguesPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch sports from database
  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('sports')
          .select('*')
          .order('display_order')
        
        if (error) throw error
        
        setSports(data || [])
        
        // Set default sport to first one if available
        if (data && data.length > 0 && selectedSport === "all") {
          setSelectedSport(data[0].sport_id.toString())
        }
      } catch (error) {
        console.error('Error fetching sports:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSports()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leagues & Seasons</h1>
          <p className="text-muted-foreground">Manage leagues and their seasons</p>
        </div>
      </div>

      <Tabs defaultValue="leagues" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="leagues" className="flex-1 sm:flex-none">
            Leagues
          </TabsTrigger>
          <TabsTrigger value="seasons" className="flex-1 sm:flex-none">
            Seasons
          </TabsTrigger>
        </TabsList>
          
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading sports...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {/* "All Sports" option */}
                <Button
                  key="all"
                  variant={selectedSport === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport("all")}
                  className="whitespace-nowrap"
                >
                  All Sports
                </Button>
                
                {/* Sports from database */}
                {sports
                  .filter(sport => sport.is_active) // Only show active sports
                  .map((sport) => (
                    <Button
                      key={sport.sport_id}
                      variant={selectedSport === sport.sport_id.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSport(sport.sport_id.toString())}
                      className="whitespace-nowrap"
                    >
                      {sport.sport_name}
                    </Button>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>

        <TabsContent value="leagues" className="space-y-4">
          <LeaguesTab selectedSport={selectedSport} />
        </TabsContent>

        <TabsContent value="seasons" className="space-y-4">
          <SeasonsTab selectedSport={selectedSport} />
        </TabsContent>
      </Tabs>
    </div>
  )
}