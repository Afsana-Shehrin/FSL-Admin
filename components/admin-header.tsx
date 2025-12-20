"use client"

import { Bell, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditProfileDialog } from "./edit-profile-dialog"
import { getSupabase } from "@/lib/supabase/working-client"
import { toast } from "sonner"
import { useState, useEffect } from "react"

// UPDATED INTERFACE - Use actual property names from your database
interface AdminHeaderProps {
  admin: {
    admin_id: string           // ← CHANGED from "id" to "admin_id"
    email: string
    username: string          // ← ADDED - you have this in database
    full_name?: string        // ← CHANGED from "name" to "full_name"
    role?: string
    phone?: string | null
    image?: string | null     // This might be from admin_profiles table
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
}

// Validation functions remain the same
const validateBangladeshiPhone = (phone: string): { isValid: boolean; message: string; cleanNumber: string } => {
  if (!phone) return { isValid: false, message: "Phone number is required", cleanNumber: "" }
  
  const cleanNumber = phone.replace(/\D/g, '')
  
  if (!cleanNumber) return { isValid: false, message: "Please enter a valid phone number", cleanNumber: "" }
  
  if (cleanNumber.length !== 11) {
    return { isValid: false, message: "Phone number must be 11 digits", cleanNumber: "" }
  }
  
  if (!cleanNumber.startsWith('01')) {
    return { isValid: false, message: "Bangladeshi phone numbers must start with 01", cleanNumber: "" }
  }
  
  const thirdDigit = cleanNumber.charAt(2)
  const validThirdDigits = ['3', '4', '5', '6', '7', '8', '9']
  if (!validThirdDigits.includes(thirdDigit)) {
    return { isValid: false, message: "Invalid mobile operator code", cleanNumber: "" }
  }
  
  return { 
    isValid: true, 
    message: "", 
    cleanNumber: cleanNumber
  }
}

const formatPhoneForDisplay = (phone: string | null | undefined): string => {
  if (!phone) return ""
  
  const cleanNumber = phone.replace(/\D/g, '')
  
  if (cleanNumber.length === 11 && cleanNumber.startsWith('01')) {
    return `+880 ${cleanNumber.substring(0, 4)}-${cleanNumber.substring(4, 8)}-${cleanNumber.substring(8)}`
  }
  
  if (cleanNumber.length === 13 && cleanNumber.startsWith('880')) {
    const localNumber = cleanNumber.substring(3)
    return `+880 ${localNumber.substring(0, 4)}-${localNumber.substring(4, 8)}-${localNumber.substring(8)}`
  }
  
  return phone
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  
  // UPDATED STATE - Use correct property names
  const [profile, setProfile] = useState({
    id: admin.admin_id,                        // ← CHANGED from admin.id to admin.admin_id
    name: admin.full_name || admin.username || admin.email.split('@')[0], // ← CHANGED from admin.name
    email: admin.email,
    phone: "",
    image: undefined as string | undefined,
    role: admin.role || "Admin"
  })
  
  // Debug log
  useEffect(() => {
    console.log("✅ AdminHeader received admin object with ID:", admin.admin_id)
  }, [admin])
  
  // Fetch profile data from database
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const supabase = getSupabase()
        
        console.log("🔄 Fetching profile data for admin_id:", admin.admin_id)
        
        if (!admin.admin_id) {
          console.error("❌ No admin_id available for fetching profile")
          return
        }
        
        // Fetch profile from admin_profiles table
        const { data, error } = await supabase
          .from('admin_profiles')
          .select('full_name, phone, profile_image_url')
          .eq('admin_id', admin.admin_id)
          .maybeSingle()
        
        if (error) {
          console.error("❌ Error fetching profile:", error)
          return
        }
        
        console.log("✅ Profile data fetched:", data)
        
        if (data) {
          setProfile(prev => ({
            ...prev,
            name: data.full_name || prev.name,
            phone: data.phone ? formatPhoneForDisplay(data.phone) : "",
            image: data.profile_image_url || undefined
          }))
        } else {
          console.log("ℹ️ No profile found in database yet")
        }
        
      } catch (error) {
        console.error("❌ Error in fetchProfileData:", error)
      }
    }
    
    fetchProfileData()
  }, [admin.admin_id])
  
  const handleLogout = async () => {
    try {
      localStorage.removeItem('admin_logged_in')
      localStorage.removeItem('admin_email')
      toast.success('Signed out successfully')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleSaveProfile = async (updatedProfile: {
    name: string
    username: string
    phone: string
    image?: string
  }) => {
    try {
      const supabase = getSupabase()
      
      console.log("💾 Starting profile save for admin_id:", admin.admin_id)
      
      // Validate phone number
      const phoneValidation = validateBangladeshiPhone(updatedProfile.phone)
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.message)
        return
      }
      
      // Use admin.admin_id directly
      const adminId = admin.admin_id
      
      if (!adminId) {
        console.error("❌ admin.admin_id is empty!")
        toast.error('Session issue. Please log out and log in again.')
        return
      }
      
      console.log("✅ Using admin_id:", adminId)
      
      // Update in admin_profiles table
      const { data, error } = await supabase
        .from('admin_profiles')
        .upsert({
          admin_id: adminId,
          full_name: updatedProfile.name,
          phone: phoneValidation.cleanNumber,
          profile_image_url: updatedProfile.image,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'admin_id'
        })
        .select()

      if (error) {
        console.error("❌ Supabase upsert error:", error)
        toast.error('Failed to update profile: ' + error.message)
        return
      }

      console.log("✅ Profile saved successfully:", data)
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        name: updatedProfile.name,
        phone: formatPhoneForDisplay(phoneValidation.cleanNumber),
        image: updatedProfile.image
      }))

      toast.success('Profile updated successfully')
      setShowProfileDialog(false)
      
      // Refresh the page
      setTimeout(() => {
        router.refresh()
      }, 500)
      
    } catch (error: any) {
      console.error("❌ Unexpected error:", error)
      toast.error('Unexpected error: ' + error.message)
    }
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex flex-1 items-center ml-12 md:ml-0">
          <h1 className="text-lg md:text-2xl font-bold text-foreground">ADMIN PORTAL</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-transparent hover:border-primary transition-all">
                  <AvatarImage 
                    src={profile.image || "/placeholder.svg"} 
                    alt={profile.name || "Admin"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile.name
                      ? profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : profile.email?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.name || profile.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => setShowProfileDialog(true)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <EditProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        adminId={admin.admin_id}
        profile={{
          name: profile.name || "Admin User",
          email: profile.email,
          username: admin.username || profile.name || "", // Use actual username
          phone: profile.phone || "",
          image: profile.image
        }}
        onSave={handleSaveProfile}
      />
    </>
  )
}