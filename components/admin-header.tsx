"use client"

import { Bell, LogOut } from "lucide-react"
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
import { useState } from "react"

// Define prop types
interface AdminHeaderProps {
  admin: {
    id: string
    email: string
    name?: string
    role?: string
    phone?: string | null
    image?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [profile, setProfile] = useState({
    id: admin.id,
    name: admin.name || admin.email.split('@')[0],
    email: admin.email,
    phone: admin.phone || null,
    image: admin.image || undefined,
    role: admin.role || "Admin"
  })
  
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
    email: string
    username: string
    phone: string
    image?: string
  }) => {
    try {
      const supabase = getSupabase()
      
      // Update in Supabase
      const { error } = await supabase
        .from('admins')
        .update({
          name: updatedProfile.name,
          phone: updatedProfile.phone || null // Convert empty string to null
        })
        .eq('id', profile.id)

      if (error) {
        toast.error('Failed to update profile: ' + error.message)
        return
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        name: updatedProfile.name,
        phone: updatedProfile.phone || null,
        image: updatedProfile.image
      }))

      toast.success('Profile updated successfully')
      setShowProfileDialog(false)
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
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
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-full">
                <Avatar className="h-8 w-8 md:h-9 md:w-9">
                  <AvatarImage 
                    src={profile.image || "/placeholder.svg"} 
                    alt={profile.name || "Admin"} 
                  />
                  <AvatarFallback>
                    {profile.name
                      ? profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : profile.email?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Simple dropdown label like prototype */}
              <DropdownMenuLabel>
                {profile.name || profile.email}
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              {/* Changed from "Edit Profile" to just "Profile" like prototype */}
              <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                Profile
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Simple logout like prototype */}
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <EditProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        profile={{
          name: profile.name || "Admin User",
          email: profile.email,
          username: profile.name || "", // Using name as username if available
          phone: profile.phone || "",
          image: profile.image
        }}
        onSave={handleSaveProfile}
      />
    </>
  )
}