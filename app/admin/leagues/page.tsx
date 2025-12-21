"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LeaguesTab from "./leagues"
import SeasonsTab from "./seasons"

// Sports data - fetch from your database or use hardcoded
const sportsData = [
  { id: "all", name: "All Sports", icon: "🏆" },
  { id: "1", name: "Football", icon: "⚽" },
  { id: "2", name: "Cricket", icon: "🏏" },
  { id: "3", name: "Basketball", icon: "🏀" },
  { id: "4", name: "Kabaddi", icon: "🤼" }
]

export default function LeaguesPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leagues & Seasons</h1>
          <p className="text-muted-foreground">Manage leagues and their seasons</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {sportsData.map((sport) => (
              <Button
                key={sport.id}
                variant={selectedSport === sport.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport.id)}
                className="whitespace-nowrap"
              >
                {sport.icon} {sport.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leagues" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="leagues" className="flex-1 sm:flex-none">
            Leagues
          </TabsTrigger>
          <TabsTrigger value="seasons" className="flex-1 sm:flex-none">
            Seasons
          </TabsTrigger>
        </TabsList>

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