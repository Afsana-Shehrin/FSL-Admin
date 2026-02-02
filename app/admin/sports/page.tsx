"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, GripVertical, Upload, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getSupabase } from '@/lib/supabase/working-client'

// Initialize Supabase client
const supabase = getSupabase()

// Define the Sport type based on your database schema
export type Sport = {
  sport_id: number
  sport_name: string
  sport_code: string
  icon_url: string | null
  is_active: boolean
  display_order: number
  created_at: string
}

export default function SportsPage() {
  const [sportsList, setSportsList] = useState<Sport[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)
  const [formData, setFormData] = useState({
    sport_name: "",
    sport_code: "",
    icon_url: null as string | null,
    field_image_url: null as string | null,
    display_order: 0,
    is_active: true,
  })
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [fieldImageFile, setFieldImageFile] = useState<File | null>(null)
  const [fieldImagePreview, setFieldImagePreview] = useState<string | null>(null)

  // Function to create storage bucket if it doesn't exist
  const createBucketIfNotExists = async () => {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === 'sports-icons')
      
      if (!bucketExists) {
        // Create bucket
        const { error } = await supabase.storage.createBucket('sports-icons', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml']
        })
        
        if (error && error.message !== 'Bucket already exists') {
          console.warn('Error creating bucket:', error.message)
        } else {
          console.log('Bucket created successfully')
        }
      }
    } catch (error) {
      console.warn('Could not create bucket:', error)
    }
  }

  // Fetch sports from database
  useEffect(() => {
    fetchSports()
    createBucketIfNotExists() // Ensure bucket exists on page load
  }, [])

  const fetchSports = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setSportsList(data || [])
    } catch (error: any) {
      console.error('Error fetching sports:', error)
      toast.error('Failed to load sports')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSports = sportsList.filter((sport) =>
    sport.sport_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sport.sport_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport)
    setFormData({
      sport_name: sport.sport_name,
      sport_code: sport.sport_code,
      icon_url: sport.icon_url,
      field_image_url: (sport as any).field_image_url || null,
      display_order: sport.display_order,
      is_active: sport.is_active,
    })
    if (sport.icon_url) {
      setIconPreview(sport.icon_url)
    }
    if ((sport as any).field_image_url) {
      setFieldImagePreview((sport as any).field_image_url)
    }
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingSport(null)
    setFormData({
      sport_name: "",
      sport_code: "",
      icon_url: null,
      field_image_url: null,
      display_order: sportsList.length > 0 
        ? Math.max(...sportsList.map(s => s.display_order)) + 1 
        : 1,
      is_active: true,
    })
    setIconFile(null)
    setIconPreview(null)
    setFieldImageFile(null)
    setFieldImagePreview(null)
    setIsDialogOpen(true)
  }

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        return
      }
      
      setIconFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeIcon = () => {
    setIconFile(null)
    setIconPreview(null)
    setFormData(prev => ({ ...prev, icon_url: null }))
  }

  const handleFieldImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      // Validate file size (max 10MB for field images)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB')
        return
      }
      
      setFieldImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFieldImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFieldImage = () => {
    setFieldImageFile(null)
    setFieldImagePreview(null)
    setFormData(prev => ({ ...prev, field_image_url: null }))
  }

  const uploadIconToStorage = async (): Promise<string | null> => {
    if (!iconFile) return null

    try {
      const fileName = `sport_${Date.now()}_${iconFile.name.replace(/\s+/g, '_')}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('sports-icons')
        .upload(fileName, iconFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: iconFile.type
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw new Error(error.message || 'Failed to upload icon')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sports-icons')
        .getPublicUrl(data.path)

      console.log('Icon uploaded successfully:', publicUrl)
      return publicUrl
    } catch (error: any) {
      console.error('Error uploading icon:', error)
      throw new Error('Failed to upload icon: ' + error.message)
    }
  }

  const handleSave = async () => {
    if (!formData.sport_name.trim() || !formData.sport_code.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSaving(true)

      let iconUrl = formData.icon_url
      let fieldImageUrl = formData.field_image_url

      // Upload new icon if file was selected
      if (iconFile) {
        try {
          const uploadedUrl = await uploadIconToStorage()
          iconUrl = uploadedUrl
        } catch (uploadError) {
          console.error('Upload failed:', uploadError)
          toast.error('Failed to upload icon. Please try again.')
          setIsSaving(false)
          return
        }
      }

      // Upload new field image if file was selected
      if (fieldImageFile) {
        try {
          const fileName = `field_${Date.now()}_${fieldImageFile.name.replace(/\s+/g, '_')}`
          
          const { data, error } = await supabase.storage
            .from('sports-icons')
            .upload(fileName, fieldImageFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: fieldImageFile.type
            })

          if (error) {
            console.error('Field image upload error:', error)
            throw new Error(error.message || 'Failed to upload field image')
          }

          const { data: { publicUrl } } = supabase.storage
            .from('sports-icons')
            .getPublicUrl(data.path)

          fieldImageUrl = publicUrl
          console.log('Field image uploaded successfully:', publicUrl)
        } catch (uploadError) {
          console.error('Field image upload failed:', uploadError)
          toast.error('Failed to upload field image. Please try again.')
          setIsSaving(false)
          return
        }
      }

      const sportData = {
        sport_name: formData.sport_name.trim(),
        sport_code: formData.sport_code.trim().toUpperCase(),
        icon_url: iconUrl,
        field_image_url: fieldImageUrl,
        display_order: formData.display_order || 0,
        is_active: formData.is_active,
      }

      if (editingSport) {
        // Update existing sport
        const { data, error } = await supabase
          .from('sports')
          .update(sportData)
          .eq('sport_id', editingSport.sport_id)
          .select()
          .single()

        if (error) throw error

        toast.success('Sport updated successfully')
      } else {
        // Create new sport
        const { data, error } = await supabase
          .from('sports')
          .insert([sportData])
          .select()
          .single()

        if (error) throw error

        toast.success('Sport created successfully')
      }

      setIsDialogOpen(false)
      
      // Reset form
      setIconFile(null)
      setIconPreview(null)
      setFieldImageFile(null)
      setFieldImagePreview(null)
      
      // Refresh the sports list
      fetchSports()
    } catch (error: any) {
      console.error('Error saving sport:', error)
      
      // Handle specific errors
      if (error.code === '23505') {
        if (error.message.includes('sport_name')) {
          toast.error('Sport name already exists')
        } else if (error.message.includes('sport_code')) {
          toast.error('Sport code already exists')
        } else {
          toast.error('Duplicate entry found')
        }
      } else {
        toast.error(error.message || 'Failed to save sport')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sport?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('sports')
        .delete()
        .eq('sport_id', id)

      if (error) throw error

      toast.success('Sport deleted successfully')
      fetchSports()
    } catch (error: any) {
      console.error('Error deleting sport:', error)
      toast.error(error.message || 'Failed to delete sport')
    }
  }

  const toggleActive = async (sport: Sport) => {
    try {
      const { error } = await supabase
        .from('sports')
        .update({ is_active: !sport.is_active })
        .eq('sport_id', sport.sport_id)

      if (error) throw error

      setSportsList(sportsList.map((s) => 
        s.sport_id === sport.sport_id ? { ...s, is_active: !s.is_active } : s
      ))
      
      toast.success(`Sport ${!sport.is_active ? 'activated' : 'deactivated'} successfully`)
    } catch (error: any) {
      console.error('Error toggling sport status:', error)
      toast.error(error.message || 'Failed to update sport status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sports Management</h1>
          <p className="text-muted-foreground">Manage sports available in your fantasy platform</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sport
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSport ? "Edit Sport" : "Add New Sport"}</DialogTitle>
            <DialogDescription>
              {editingSport ? "Update the sport details below." : "Add a new sport to your platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sport_name">Sport Name *</Label>
              <Input
                id="sport_name"
                placeholder="e.g., Football"
                value={formData.sport_name}
                onChange={(e) => setFormData({ ...formData, sport_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sport_code">Sport Code *</Label>
              <Input
                id="sport_code"
                placeholder="e.g., FBALL"
                value={formData.sport_code}
                onChange={(e) => setFormData({ ...formData, sport_code: e.target.value.toUpperCase() })}
                required
              />
              <p className="text-sm text-muted-foreground">Unique code for the sport (uppercase, no spaces)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Sport Icon</Label>
              <div className="space-y-4">
                {iconPreview && (
                  <div className="relative inline-block">
                    <img 
                      src={iconPreview} 
                      alt="Icon preview" 
                      className="h-16 w-16 object-contain rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeIcon}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Label 
                    htmlFor="icon-upload"
                    className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-gray-400 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Icon
                  </Label>
                  <Input
                    id="icon-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconUpload}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a square icon (PNG, JPG, SVG) - Max 5MB
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="field_image">Field Background Image</Label>
              <div className="space-y-4">
                {fieldImagePreview && (
                  <div className="relative inline-block">
                    <img 
                      src={fieldImagePreview} 
                      alt="Field background preview" 
                      className="h-32 w-auto object-contain rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeFieldImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Label 
                    htmlFor="field-upload"
                    className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-gray-400 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Field Background
                  </Label>
                  <Input
                    id="field-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFieldImageUpload}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload field background (PNG, JPG, SVG) - Max 10MB
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Order</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active Status</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false)
                setIconFile(null)
                setIconPreview(null)
                setFieldImageFile(null)
                setFieldImagePreview(null)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || !formData.sport_name.trim() || !formData.sport_code.trim()}
            >
              {isSaving ? "Saving..." : editingSport ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sports</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sports by name or code..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading sports...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No sports found matching your search' : 'No sports added yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSports.map((sport) => (
                    <TableRow key={sport.sport_id}>
                      <TableCell>{sport.display_order}</TableCell>
                      <TableCell>
                        <div className="h-10 w-10 flex items-center justify-center">
                          {sport.icon_url ? (
                            <img 
                              src={sport.icon_url} 
                              alt={sport.sport_name}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs">N/A</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{sport.sport_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {sport.sport_code}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={sport.is_active} 
                            onCheckedChange={() => toggleActive(sport)} 
                          />
                          <Badge variant={sport.is_active ? "default" : "secondary"}>
                            {sport.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(sport.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(sport)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(sport.sport_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}