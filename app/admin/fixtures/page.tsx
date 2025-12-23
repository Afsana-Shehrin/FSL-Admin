"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FixturesTab from "./components/fixtures-tab"
import GameweeksTab from "./components/gameweeks-tab"

export default function FixturesPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fixtures & Gameweeks</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage fixtures, gameweeks, and match schedules</p>
        </div>
      </div>

      <Tabs defaultValue="fixtures" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="gameweeks">Gameweeks</TabsTrigger>
        </TabsList>

        <TabsContent value="fixtures">
          <FixturesTab />
        </TabsContent>

        <TabsContent value="gameweeks">
          <GameweeksTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}