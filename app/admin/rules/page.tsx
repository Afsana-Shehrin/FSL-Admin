"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Code } from "lucide-react"
import { rules, sports, type Rule } from "@/lib/dummy-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RulesPage() {
  const [rulesList, setRulesList] = useState<Rule[]>(rules)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [selectedSport, setSelectedSport] = useState(sports[0]?.id || "1")
  const [selectedCategory, setSelectedCategory] = useState<Rule["category"]>("team_composition")

  const sportPositions: Record<string, { label: string; key: string }[]> = {
    "1": [
      // Football
      { label: "Goalkeepers", key: "goalkeepers" },
      { label: "Defenders", key: "defenders" },
      { label: "Midfielders", key: "midfielders" },
      { label: "Forwards", key: "forwards" },
    ],
    "2": [
      // Cricket
      { label: "Wicket-keepers", key: "wicketKeepers" },
      { label: "Batsmen", key: "batsmen" },
      { label: "All-rounders", key: "allRounders" },
      { label: "Bowlers", key: "bowlers" },
    ],
    "3": [
      // Basketball
      { label: "Point Guards", key: "pointGuards" },
      { label: "Shooting Guards", key: "shootingGuards" },
      { label: "Small Forwards", key: "smallForwards" },
      { label: "Power Forwards", key: "powerForwards" },
      { label: "Centers", key: "centers" },
    ],
  }

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    // Team Composition fields
    maxPlayers: 15,
    minPlayers: 11,
    maxPlayersPerTeam: 3,
    // Football positions
    goalkeepers: 1,
    defenders: 5,
    midfielders: 5,
    forwards: 3,
    // Cricket positions
    wicketKeepers: 1,
    batsmen: 5,
    allRounders: 2,
    bowlers: 3,
    // Basketball positions
    pointGuards: 1,
    shootingGuards: 1,
    smallForwards: 1,
    powerForwards: 1,
    centers: 1,
    allowTransfers: true,
    transfersPerGameweek: 1,
    wildcardsAllowed: 2,
    // Scoring fields
    goalPoints: 4,
    assistPoints: 3,
    cleanSheetPoints: 4,
    penaltyMissed: -2,
    yellowCard: -1,
    redCard: -3,
    bonus: 3,
    runPoints: 1,
    boundary: 1,
    six: 2,
    wicket: 25,
    catch: 8,
    stumping: 12,
    runOut: 6,
    halfCentury: 8,
    century: 16,
    maiden: 12,
    pointScored: 1,
    rebound: 1.2,
    steal: 3,
    block: 3,
    turnover: -1,
    doubleDouble: 1.5,
    tripleDouble: 3,
    threePointer: 0.5,
    // Budget fields
    totalBudget: 100.0,
    currency: "M",
    minPlayerPrice: 4.0,
    maxPlayerPrice: 15.0,
  })

  const activeSports = sports.filter((s) => s.isActive)

  const getSportRules = (sportId: string, category: Rule["category"]) => {
    return rulesList.filter((r) => r.sportId === sportId && r.category === category)
  }

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule)
    const config = rule.config
    setFormData({
      name: rule.name,
      description: rule.description,
      isActive: rule.isActive,
      // Team Composition
      maxPlayers: config.maxPlayers || 15,
      minPlayers: config.minPlayers || 11,
      maxPlayersPerTeam: config.maxPlayersPerTeam || 3,
      goalkeepers: config.goalkeepers || 1,
      defenders: config.defenders || 5,
      midfielders: config.midfielders || 5,
      forwards: config.forwards || 3,
      wicketKeepers: config.wicketKeepers || 1,
      batsmen: config.batsmen || 5,
      allRounders: config.allRounders || 2,
      bowlers: config.bowlers || 3,
      pointGuards: config.pointGuards || 1,
      shootingGuards: config.shootingGuards || 1,
      smallForwards: config.smallForwards || 1,
      powerForwards: config.powerForwards || 1,
      centers: config.centers || 1,
      allowTransfers: config.allowTransfers !== false,
      transfersPerGameweek: config.transfersPerGameweek || 1,
      wildcardsAllowed: config.wildcardsAllowed || 2,
      // Scoring
      goalPoints: config.goalPoints || config.forward || 4,
      assistPoints: config.assistPoints || 3,
      cleanSheetPoints: config.cleanSheetPoints || 4,
      penaltyMissed: config.penaltyMissed || -2,
      yellowCard: config.yellowCard || -1,
      redCard: config.redCard || -3,
      bonus: config.bonus || 3,
      runPoints: config.runPoints || 1,
      boundary: config.boundary || 1,
      six: config.six || 2,
      wicket: config.wicket || 25,
      catch: config.catch || 8,
      stumping: config.stumping || 12,
      runOut: config.runOut || 6,
      halfCentury: config.halfCentury || 8,
      century: config.century || 16,
      maiden: config.maiden || 12,
      pointScored: config.pointScored || 1,
      rebound: config.rebound || 1.2,
      steal: config.steal || 3,
      block: config.block || 3,
      turnover: config.turnover || -1,
      doubleDouble: config.doubleDouble || 1.5,
      tripleDouble: config.tripleDouble || 3,
      threePointer: config.threePointer || 0.5,
      // Budget
      totalBudget: config.totalBudget || 100.0,
      currency: config.currency || "M",
      minPlayerPrice: config.minPlayerPrice || 4.0,
      maxPlayerPrice: config.maxPlayerPrice || 15.0,
    })
    setSelectedCategory(rule.category)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingRule(null)
    setFormData({
      name: "",
      description: "",
      isActive: true,
      maxPlayers: 15,
      minPlayers: 11,
      maxPlayersPerTeam: 3,
      goalkeepers: 1,
      defenders: 5,
      midfielders: 5,
      forwards: 3,
      wicketKeepers: 1,
      batsmen: 5,
      allRounders: 2,
      bowlers: 3,
      pointGuards: 1,
      shootingGuards: 1,
      smallForwards: 1,
      powerForwards: 1,
      centers: 1,
      allowTransfers: true,
      transfersPerGameweek: 1,
      wildcardsAllowed: 2,
      goalPoints: 4,
      assistPoints: 3,
      cleanSheetPoints: 4,
      penaltyMissed: -2,
      yellowCard: -1,
      redCard: -3,
      bonus: 3,
      runPoints: 1,
      boundary: 1,
      six: 2,
      wicket: 25,
      catch: 8,
      stumping: 12,
      runOut: 6,
      halfCentury: 8,
      century: 16,
      maiden: 12,
      pointScored: 1,
      rebound: 1.2,
      steal: 3,
      block: 3,
      turnover: -1,
      doubleDouble: 1.5,
      tripleDouble: 3,
      threePointer: 0.5,
      totalBudget: 100.0,
      currency: "M",
      minPlayerPrice: 4.0,
      maxPlayerPrice: 15.0,
    })
    setIsDialogOpen(true)
  }

  const buildConfig = () => {
    if (selectedCategory === "team_composition") {
      return {
        maxPlayers: formData.maxPlayers,
        minPlayers: formData.minPlayers,
        maxPlayersPerTeam: formData.maxPlayersPerTeam,
        goalkeepers: formData.goalkeepers,
        defenders: formData.defenders,
        midfielders: formData.midfielders,
        forwards: formData.forwards,
        wicketKeepers: formData.wicketKeepers,
        batsmen: formData.batsmen,
        allRounders: formData.allRounders,
        bowlers: formData.bowlers,
        pointGuards: formData.pointGuards,
        shootingGuards: formData.shootingGuards,
        smallForwards: formData.smallForwards,
        powerForwards: formData.powerForwards,
        centers: formData.centers,
        allowTransfers: formData.allowTransfers,
        transfersPerGameweek: formData.transfersPerGameweek,
        wildcardsAllowed: formData.wildcardsAllowed,
      }
    } else if (selectedCategory === "scoring") {
      if (selectedSport === "1") {
        return {
          goalPoints: formData.goalPoints,
          assistPoints: formData.assistPoints,
          cleanSheetPoints: formData.cleanSheetPoints,
          penaltyMissed: formData.penaltyMissed,
          yellowCard: formData.yellowCard,
          redCard: formData.redCard,
          bonus: formData.bonus,
        }
      } else if (selectedSport === "2") {
        return {
          runPoints: formData.runPoints,
          boundary: formData.boundary,
          six: formData.six,
          wicket: formData.wicket,
          catch: formData.catch,
          stumping: formData.stumping,
          runOut: formData.runOut,
          halfCentury: formData.halfCentury,
          century: formData.century,
          maiden: formData.maiden,
        }
      } else if (selectedSport === "3") {
        return {
          pointScored: formData.pointScored,
          rebound: formData.rebound,
          assist: formData.assist,
          steal: formData.steal,
          block: formData.block,
          turnover: formData.turnover,
          doubleDouble: formData.doubleDouble,
          tripleDouble: formData.tripleDouble,
          threePointer: formData.threePointer,
        }
      }
    } else {
      return {
        totalBudget: formData.totalBudget,
        currency: formData.currency,
        minPlayerPrice: formData.minPlayerPrice,
        maxPlayerPrice: formData.maxPlayerPrice,
      }
    }
  }

  const handleSave = () => {
    const config = buildConfig()

    if (editingRule) {
      setRulesList(
        rulesList.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: formData.name,
                description: formData.description,
                isActive: formData.isActive,
                config,
              }
            : r,
        ),
      )
    } else {
      const newRule: Rule = {
        id: String(rulesList.length + 1),
        name: formData.name,
        description: formData.description,
        category: selectedCategory,
        sportId: selectedSport,
        config,
        isActive: formData.isActive,
      }
      setRulesList([...rulesList, newRule])
    }
    setIsDialogOpen(false)
  }

  const toggleActive = (id: string) => {
    setRulesList(rulesList.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
  }

  const RuleCard = ({ rule }: { rule: Rule }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{rule.name}</CardTitle>
            <CardDescription>{rule.description}</CardDescription>
            <div className="mt-2">
              <Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={rule.isActive} onCheckedChange={() => toggleActive(rule.id)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="rounded-md bg-muted p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(rule.config).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRulesList(rulesList.filter((r) => r.id !== rule.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rules Configuration</h1>
          <p className="text-muted-foreground">Configure sport-specific team composition, scoring, and budget rules</p>
        </div>
      </div>

      <Tabs value={selectedSport} onValueChange={setSelectedSport} className="space-y-4">
        <TabsList>
          {activeSports.map((sport) => (
            <TabsTrigger key={sport.id} value={sport.id}>
              <span className="mr-2">{sport.icon}</span>
              {sport.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeSports.map((sport) => (
          <TabsContent key={sport.id} value={sport.id} className="space-y-4">
            <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Rule["category"])}>
              <TabsList>
                <TabsTrigger value="team_composition">Team Composition</TabsTrigger>
                <TabsTrigger value="scoring">Scoring Rules</TabsTrigger>
                <TabsTrigger value="budget">Budget Rules</TabsTrigger>
              </TabsList>

              <TabsContent value="team_composition" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Rule
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {getSportRules(sport.id, "team_composition").length > 0 ? (
                    getSportRules(sport.id, "team_composition").map((rule) => <RuleCard key={rule.id} rule={rule} />)
                  ) : (
                    <Card className="md:col-span-2">
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Code className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No team composition rules</h3>
                          <p className="text-sm text-muted-foreground">
                            Get started by creating your first team composition rule.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="scoring" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Scoring Rule
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {getSportRules(sport.id, "scoring").length > 0 ? (
                    getSportRules(sport.id, "scoring").map((rule) => <RuleCard key={rule.id} rule={rule} />)
                  ) : (
                    <Card className="md:col-span-2">
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Code className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No scoring rules</h3>
                          <p className="text-sm text-muted-foreground">
                            Get started by creating your first scoring rule.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="budget" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Budget Rule
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {getSportRules(sport.id, "budget").length > 0 ? (
                    getSportRules(sport.id, "budget").map((rule) => <RuleCard key={rule.id} rule={rule} />)
                  ) : (
                    <Card className="md:col-span-2">
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Code className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No budget rules</h3>
                          <p className="text-sm text-muted-foreground">
                            Get started by creating your first budget rule.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
            <DialogDescription>Configure the rule details using the form fields below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., Squad Size Rules"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="rule-active">Active Status</Label>
                <Switch
                  id="rule-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-description">Description</Label>
              <Textarea
                id="rule-description"
                placeholder="Describe the rule"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              {selectedCategory === "team_composition" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Team Composition Settings</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="max-players">Maximum Players</Label>
                      <Input
                        id="max-players"
                        type="number"
                        value={formData.maxPlayers}
                        onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-players">Minimum Players</Label>
                      <Input
                        id="min-players"
                        type="number"
                        value={formData.minPlayers}
                        onChange={(e) => setFormData({ ...formData, minPlayers: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-per-team">Max Per Team</Label>
                      <Input
                        id="max-per-team"
                        type="number"
                        value={formData.maxPlayersPerTeam}
                        onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className={`grid gap-4 md:grid-cols-${sportPositions[selectedSport]?.length || 4}`}>
                    {sportPositions[selectedSport]?.map((position) => (
                      <div key={position.key} className="space-y-2">
                        <Label htmlFor={position.key}>{position.label}</Label>
                        <Input
                          id={position.key}
                          type="number"
                          value={(formData as any)[position.key] || 0}
                          onChange={(e) => setFormData({ ...formData, [position.key]: Number(e.target.value) })}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="allow-transfers">Allow Transfers</Label>
                      <Switch
                        id="allow-transfers"
                        checked={formData.allowTransfers}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowTransfers: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transfers-per-gw">Transfers/Gameweek</Label>
                      <Input
                        id="transfers-per-gw"
                        type="number"
                        value={formData.transfersPerGameweek}
                        onChange={(e) => setFormData({ ...formData, transfersPerGameweek: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wildcards">Wildcards Allowed</Label>
                      <Input
                        id="wildcards"
                        type="number"
                        value={formData.wildcardsAllowed}
                        onChange={(e) => setFormData({ ...formData, wildcardsAllowed: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === "scoring" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Scoring Settings</h3>
                  {selectedSport === "1" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="goal-points">Goal Points</Label>
                          <Input
                            id="goal-points"
                            type="number"
                            value={formData.goalPoints}
                            onChange={(e) => setFormData({ ...formData, goalPoints: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assist-points">Assist Points</Label>
                          <Input
                            id="assist-points"
                            type="number"
                            value={formData.assistPoints}
                            onChange={(e) => setFormData({ ...formData, assistPoints: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clean-sheet">Clean Sheet Points</Label>
                          <Input
                            id="clean-sheet"
                            type="number"
                            value={formData.cleanSheetPoints}
                            onChange={(e) => setFormData({ ...formData, cleanSheetPoints: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="penalty-missed">Penalty Missed</Label>
                          <Input
                            id="penalty-missed"
                            type="number"
                            value={formData.penaltyMissed}
                            onChange={(e) => setFormData({ ...formData, penaltyMissed: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yellow-card">Yellow Card</Label>
                          <Input
                            id="yellow-card"
                            type="number"
                            value={formData.yellowCard}
                            onChange={(e) => setFormData({ ...formData, yellowCard: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="red-card">Red Card</Label>
                          <Input
                            id="red-card"
                            type="number"
                            value={formData.redCard}
                            onChange={(e) => setFormData({ ...formData, redCard: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bonus">Bonus Points</Label>
                          <Input
                            id="bonus"
                            type="number"
                            value={formData.bonus}
                            onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedSport === "2" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="run-points">Run Points</Label>
                          <Input
                            id="run-points"
                            type="number"
                            placeholder="1"
                            value={formData.runPoints}
                            onChange={(e) => setFormData({ ...formData, runPoints: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="boundary">Boundary Bonus (4s)</Label>
                          <Input
                            id="boundary"
                            type="number"
                            placeholder="1"
                            value={formData.boundary}
                            onChange={(e) => setFormData({ ...formData, boundary: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="six">Six Bonus</Label>
                          <Input
                            id="six"
                            type="number"
                            placeholder="2"
                            value={formData.six}
                            onChange={(e) => setFormData({ ...formData, six: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="wicket">Wicket Points</Label>
                          <Input
                            id="wicket"
                            type="number"
                            placeholder="25"
                            value={formData.wicket}
                            onChange={(e) => setFormData({ ...formData, wicket: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="catch">Catch Points</Label>
                          <Input
                            id="catch"
                            type="number"
                            placeholder="8"
                            value={formData.catch}
                            onChange={(e) => setFormData({ ...formData, catch: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stumping">Stumping Points</Label>
                          <Input
                            id="stumping"
                            type="number"
                            placeholder="12"
                            value={formData.stumping}
                            onChange={(e) => setFormData({ ...formData, stumping: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="run-out">Run Out Points</Label>
                          <Input
                            id="run-out"
                            type="number"
                            placeholder="6"
                            value={formData.runOut}
                            onChange={(e) => setFormData({ ...formData, runOut: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="half-century">Half Century Bonus</Label>
                          <Input
                            id="half-century"
                            type="number"
                            placeholder="8"
                            value={formData.halfCentury}
                            onChange={(e) => setFormData({ ...formData, halfCentury: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="century">Century Bonus</Label>
                          <Input
                            id="century"
                            type="number"
                            placeholder="16"
                            value={formData.century}
                            onChange={(e) => setFormData({ ...formData, century: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maiden">Maiden Over</Label>
                          <Input
                            id="maiden"
                            type="number"
                            placeholder="12"
                            value={formData.maiden}
                            onChange={(e) => setFormData({ ...formData, maiden: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedSport === "3" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="point-scored">Point Scored</Label>
                          <Input
                            id="point-scored"
                            type="number"
                            placeholder="1"
                            value={formData.pointScored}
                            onChange={(e) => setFormData({ ...formData, pointScored: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rebound">Rebound Points</Label>
                          <Input
                            id="rebound"
                            type="number"
                            placeholder="1.2"
                            value={formData.rebound}
                            onChange={(e) => setFormData({ ...formData, rebound: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assist">Assist Points</Label>
                          <Input
                            id="assist"
                            type="number"
                            placeholder="1.5"
                            value={formData.assist}
                            onChange={(e) => setFormData({ ...formData, assist: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="steal">Steal Points</Label>
                          <Input
                            id="steal"
                            type="number"
                            placeholder="3"
                            value={formData.steal}
                            onChange={(e) => setFormData({ ...formData, steal: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="block">Block Points</Label>
                          <Input
                            id="block"
                            type="number"
                            placeholder="3"
                            value={formData.block}
                            onChange={(e) => setFormData({ ...formData, block: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="turnover">Turnover Penalty</Label>
                          <Input
                            id="turnover"
                            type="number"
                            placeholder="-1"
                            value={formData.turnover}
                            onChange={(e) => setFormData({ ...formData, turnover: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="double-double">Double-Double Bonus</Label>
                          <Input
                            id="double-double"
                            type="number"
                            placeholder="1.5"
                            value={formData.doubleDouble}
                            onChange={(e) => setFormData({ ...formData, doubleDouble: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="triple-double">Triple-Double Bonus</Label>
                          <Input
                            id="triple-double"
                            type="number"
                            placeholder="3"
                            value={formData.tripleDouble}
                            onChange={(e) => setFormData({ ...formData, tripleDouble: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="three-pointer">3-Pointer Made Bonus</Label>
                          <Input
                            id="three-pointer"
                            type="number"
                            placeholder="0.5"
                            value={formData.threePointer}
                            onChange={(e) => setFormData({ ...formData, threePointer: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedCategory === "budget" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Budget Settings</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="total-budget">Total Budget</Label>
                      <Input
                        id="total-budget"
                        type="number"
                        step="0.1"
                        value={formData.totalBudget}
                        onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        placeholder="e.g., M, £, $"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="min-price">Min Player Price</Label>
                      <Input
                        id="min-price"
                        type="number"
                        step="0.1"
                        value={formData.minPlayerPrice}
                        onChange={(e) => setFormData({ ...formData, minPlayerPrice: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-price">Max Player Price</Label>
                      <Input
                        id="max-price"
                        type="number"
                        step="0.1"
                        value={formData.maxPlayerPrice}
                        onChange={(e) => setFormData({ ...formData, maxPlayerPrice: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingRule ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
