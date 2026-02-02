"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Upload, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'
import { Alert, AlertDescription } from "@/components/ui/alert"

const supabase = getSupabase()

interface Formation {
  formation_id: number
  formation_code: string
  formation_name: string
  position_distribution: Record<string, number>
}

interface PlayerPosition {
  position_id: number
  position_name: string
  position_code: string
}

interface FormationLayout {
  layout_id: number
  formation_id: number
  device_type: string
  canvas_width: number
  canvas_height: number
  background_image_url: string | null
}

interface PositionSlot {
  slot_id?: number
  layout_id: number
  position_id: number
  slot_index: number
  x_coordinate: number
  y_coordinate: number
  position_code?: string
}

interface FormationLayoutsTabProps {
  sportId: number
  leagueId: number
}

const DEVICE_TYPES = [
  { value: 'desktop', label: 'Desktop', width: 800, height: 600 },
  { value: 'tablet', label: 'Tablet', width: 600, height: 800 },
  { value: 'mobile', label: 'Mobile', width: 400, height: 600 }
]

export default function FormationLayoutsTab({ sportId, leagueId }: FormationLayoutsTabProps) {
  const [formations, setFormations] = useState<Formation[]>([])
  const [positions, setPositions] = useState<PlayerPosition[]>([])
  const [layouts, setLayouts] = useState<FormationLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  
  const [selectedFormation, setSelectedFormation] = useState<number | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<string>('desktop')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [currentLayout, setCurrentLayout] = useState<FormationLayout | null>(null)
  const [positionSlots, setPositionSlots] = useState<PositionSlot[]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [sportId, leagueId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch formations
      const { data: formationsData, error: formationsError } = await supabase
        .from('formations')
        .select('*')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .order('display_order')

      if (formationsError) throw formationsError

      // Fetch positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('player_positions')
        .select('*')
        .eq('sport_id', sportId)
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .order('display_order')

      if (positionsError) throw positionsError

      // Fetch layouts
      const { data: layoutsData, error: layoutsError } = await supabase
        .from('formation_layouts')
        .select('*')
        .in('formation_id', formationsData?.map(f => f.formation_id) || [])

      if (layoutsError) throw layoutsError

      setFormations(formationsData || [])
      setPositions(positionsData || [])
      setLayouts(layoutsData || [])

      if (formationsData && formationsData.length > 0) {
        setSelectedFormation(formationsData[0].formation_id)
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load formation data')
    } finally {
      setLoading(false)
    }
  }

  const openLayoutEditor = async (formation: Formation, deviceType: string) => {
    // Find existing layout
    const existingLayout = layouts.find(
      l => l.formation_id === formation.formation_id && l.device_type === deviceType
    )

    const device = DEVICE_TYPES.find(d => d.value === deviceType)!

    if (existingLayout) {
      setCurrentLayout(existingLayout)
      setBackgroundImage(existingLayout.background_image_url)
      
      // Fetch position slots
      const { data: slotsData, error } = await supabase
        .from('position_slots')
        .select('*')
        .eq('layout_id', existingLayout.layout_id)

      if (!error && slotsData) {
        setPositionSlots(slotsData)
      }
    } else {
      // Create new layout structure
      setCurrentLayout({
        layout_id: 0,
        formation_id: formation.formation_id,
        device_type: deviceType,
        canvas_width: device.width,
        canvas_height: device.height,
        background_image_url: null
      })
      
      // Generate initial position slots based on formation
      const slots: PositionSlot[] = []
      let slotIndex = 0
      
      Object.entries(formation.position_distribution).forEach(([posCode, count]) => {
        const position = positions.find(p => p.position_code === posCode)
        if (position && count > 0) {
          for (let i = 0; i < count; i++) {
            slots.push({
              layout_id: 0,
              position_id: position.position_id,
              slot_index: slotIndex++,
              x_coordinate: 50, // Default center
              y_coordinate: 20 + (slotIndex * 10), // Spread vertically
              position_code: posCode
            })
          }
        }
      })
      
      setPositionSlots(slots)
      setBackgroundImage(null)
    }

    setSelectedDevice(deviceType)
    setEditorOpen(true)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || positionSlots.length === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    // Find the slot being positioned (first one with default position)
    const slotToPosition = positionSlots.find(s => s.x_coordinate === 50 && s.y_coordinate > 15)
    
    if (slotToPosition) {
      const updatedSlots = positionSlots.map(slot =>
        slot.slot_index === slotToPosition.slot_index
          ? { ...slot, x_coordinate: x, y_coordinate: y }
          : slot
      )
      setPositionSlots(updatedSlots)
      toast.success(`Positioned ${slotToPosition.position_code} slot ${slotToPosition.slot_index + 1}`)
    }
  }

  const saveLayout = async () => {
    try {
      if (!currentLayout) return

      const device = DEVICE_TYPES.find(d => d.value === selectedDevice)!

      // Save or update layout
      let layoutId = currentLayout.layout_id

      if (layoutId === 0) {
        // Create new layout
        const { data: layoutData, error: layoutError } = await supabase
          .from('formation_layouts')
          .insert([{
            formation_id: currentLayout.formation_id,
            device_type: selectedDevice,
            canvas_width: device.width,
            canvas_height: device.height,
            background_image_url: backgroundImage
          }])
          .select()
          .single()

        if (layoutError) throw layoutError
        layoutId = layoutData.layout_id
      } else {
        // Update existing layout
        const { error: layoutError } = await supabase
          .from('formation_layouts')
          .update({
            background_image_url: backgroundImage
          })
          .eq('layout_id', layoutId)

        if (layoutError) throw layoutError
      }

      // Delete existing slots and recreate
      await supabase
        .from('position_slots')
        .delete()
        .eq('layout_id', layoutId)

      // Insert new slots
      const slotsToInsert = positionSlots.map(slot => ({
        layout_id: layoutId,
        position_id: slot.position_id,
        slot_index: slot.slot_index,
        x_coordinate: slot.x_coordinate,
        y_coordinate: slot.y_coordinate
      }))

      const { error: slotsError } = await supabase
        .from('position_slots')
        .insert(slotsToInsert)

      if (slotsError) throw slotsError

      toast.success('Formation layout saved successfully')
      setEditorOpen(false)
      fetchData()
    } catch (error: any) {
      console.error('Error saving layout:', error)
      toast.error(error.message || 'Failed to save layout')
    }
  }

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !editorOpen) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    if (backgroundImage) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        drawSlots(ctx, canvas)
      }
      img.src = backgroundImage
    } else {
      // Draw default field background
      ctx.fillStyle = '#2d5016'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawSlots(ctx, canvas)
    }
  }, [backgroundImage, positionSlots, editorOpen])

  const drawSlots = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    positionSlots.forEach(slot => {
      const x = (slot.x_coordinate / 100) * canvas.width
      const y = (slot.y_coordinate / 100) * canvas.height

      // Draw circle
      ctx.beginPath()
      ctx.arc(x, y, 20, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw position code
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(slot.position_code || 'POS', x, y)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formation Layouts</CardTitle>
        <CardDescription>
          Create visual layouts for formations on different devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : formations.length === 0 ? (
          <Alert>
            <AlertDescription>
              Please create formations first before designing layouts.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Click on formations below to create or edit their visual layouts for different devices.
              </AlertDescription>
            </Alert>

            {formations.map(formation => {
              const hasDesktop = layouts.some(l => l.formation_id === formation.formation_id && l.device_type === 'desktop')
              const hasTablet = layouts.some(l => l.formation_id === formation.formation_id && l.device_type === 'tablet')
              const hasMobile = layouts.some(l => l.formation_id === formation.formation_id && l.device_type === 'mobile')

              return (
                <Card key={formation.formation_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{formation.formation_code} - {formation.formation_name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {Object.entries(formation.position_distribution)
                            .filter(([, count]) => count > 0)
                            .map(([code, count]) => `${code}: ${count}`)
                            .join(' | ')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      {DEVICE_TYPES.map(device => {
                        const hasLayout = device.value === 'desktop' ? hasDesktop :
                                        device.value === 'tablet' ? hasTablet : hasMobile
                        return (
                          <Button
                            key={device.value}
                            variant={hasLayout ? "default" : "outline"}
                            size="sm"
                            onClick={() => openLayoutEditor(formation, device.value)}
                          >
                            {hasLayout ? <Eye className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                            {device.label}
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Layout Editor Dialog */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Formation Layout Editor</DialogTitle>
              <DialogDescription>
                Click on the canvas to position player slots. Upload a background image for the field.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Background
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Badge variant="secondary">
                  Device: {DEVICE_TYPES.find(d => d.value === selectedDevice)?.label}
                </Badge>
                <Badge variant="outline">
                  Slots: {positionSlots.filter(s => s.x_coordinate !== 50 || s.y_coordinate < 15).length} / {positionSlots.length}
                </Badge>
              </div>

              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <canvas
                  ref={canvasRef}
                  width={DEVICE_TYPES.find(d => d.value === selectedDevice)?.width || 800}
                  height={DEVICE_TYPES.find(d => d.value === selectedDevice)?.height || 600}
                  onClick={handleCanvasClick}
                  className="cursor-crosshair max-w-full h-auto"
                />
              </div>

              <Alert>
                <AlertDescription>
                  Click on the canvas to place each position slot. Positioned slots will appear as circles with position codes.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveLayout}>
                <Save className="mr-2 h-4 w-4" />
                Save Layout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
