"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/working-client"
import { Admin, DatabaseAdmin, DatabaseAdminProfile } from "./components/types"
import AdminsTab from "./components/AdminsTab"

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>("")

  // Helper function to convert binary/base64 to displayable image
  const getProfileImageSrc = (profileData: any): string | null => {
    if (!profileData) return null
    
    console.log("Profile data type:", typeof profileData, "Profile data:", profileData)
    
    // If it's already a URL or base64 string
    if (typeof profileData === 'string') {
      // Check if it's a base64 string
      if (profileData.startsWith('data:image/')) {
        return profileData
      }
      
      // Check if it's a URL
      if (profileData.startsWith('http') || profileData.startsWith('/') || profileData.startsWith('./')) {
        return profileData
      }
      
      // If it's a Supabase storage URL (might not have protocol)
      if (profileData.includes('supabase.co/storage')) {
        return `https://${profileData}`
      }
    }
    
    // If it's an object, try to extract the URL
    if (profileData && typeof profileData === 'object') {
      try {
        // If it has a url property
        if (profileData.url) {
          return getProfileImageSrc(profileData.url)
        }
        
        // If it's stored as text
        if (profileData.type === 'text' && profileData.value) {
          return profileData.value
        }
      } catch (error) {
        console.error("Error parsing profile image object:", error)
      }
    }
    
    return null
  }

  // Fetch admins from database
  const fetchAdmins = async () => {
    try {
      const supabase = getSupabase()
      
      console.log("Fetching admins from Supabase...")
      
      // First try with the join query
      const { data: adminsData, error } = await supabase
        .from('admins')
        .select(`
          admin_id,
          email,
          username,
          full_name,
          role,
          is_active,
          last_login_at,
          created_at,
          updated_at,
          admin_profiles (
            phone,
            profile_image_url,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching admins with join:", error)
        console.error("Error details:", error)
        
        // If join fails, try fetching separately
        return await fetchAdminsSeparately()
      }

      console.log("Fetched admins data with join:", adminsData)

      // Transform data to match your Admin interface
      const transformedAdmins: Admin[] = (adminsData as DatabaseAdmin[]).map((admin: DatabaseAdmin) => {
        // admin_profiles is an array even for one-to-one relationship
        const profile = admin.admin_profiles?.[0] as DatabaseAdminProfile | undefined
        const profileImageSrc = getProfileImageSrc(profile?.profile_image_url)
        
        // Format last login date
        let lastLoginFormatted = 'Never'
        if (admin.last_login_at) {
          try {
            lastLoginFormatted = new Date(admin.last_login_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          } catch (e) {
            console.error("Error formatting last login date:", e)
          }
        }

        return {
          admin: {
            admin_id: admin.admin_id,
            email: admin.email,
            username: admin.username,
            full_name: admin.full_name || profile?.full_name || admin.username,
            role: admin.role || 'Viewer',
            phone: profile?.phone || null,
            image: profileImageSrc || null,
            is_active: admin.is_active ?? true, // Default to true if null
            created_at: admin.created_at,
            updated_at: admin.updated_at,
            last_login_at: admin.last_login_at || undefined,
            last_login_formatted: lastLoginFormatted
          }
        }
      })

      console.log("Transformed admins:", transformedAdmins)
      setAdmins(transformedAdmins)
      
    } catch (error) {
      console.error("Error in fetchAdmins:", error)
    }
  }

  // Alternative: Fetch admins and profiles separately
  const fetchAdminsSeparately = async () => {
    try {
      const supabase = getSupabase()
      
      // Fetch admins first
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })

      if (adminsError) {
        console.error("Error fetching admins:", adminsError)
        return
      }

      if (!adminsData || adminsData.length === 0) {
        console.log("No admins found")
        setAdmins([])
        return
      }

      console.log("Fetched admins separately:", adminsData)

      // Fetch profiles for all admins
      const adminIds = (adminsData as DatabaseAdmin[]).map((admin: DatabaseAdmin) => admin.admin_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('admin_profiles')
        .select('*')
        .in('admin_id', adminIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      }

      console.log("Fetched profiles:", profilesData)

      // Create a map of admin_id to profile for easy lookup
      const profilesMap = new Map<string, DatabaseAdminProfile>()
      if (profilesData) {
        (profilesData as DatabaseAdminProfile[]).forEach(profile => {
          profilesMap.set(profile.admin_id, profile)
        })
      }

      // Transform data
      const transformedAdmins: Admin[] = (adminsData as DatabaseAdmin[]).map((admin: DatabaseAdmin) => {
        const profile = profilesMap.get(admin.admin_id)
        const profileImageSrc = getProfileImageSrc(profile?.profile_image_url)
        
        // Format last login date
        let lastLoginFormatted = 'Never'
        if (admin.last_login_at) {
          try {
            lastLoginFormatted = new Date(admin.last_login_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          } catch (e) {
            console.error("Error formatting last login date:", e)
          }
        }

        return {
          admin: {
            admin_id: admin.admin_id,
            email: admin.email,
            username: admin.username,
            full_name: admin.full_name || profile?.full_name || admin.username,
            role: admin.role || 'Viewer',
            phone: profile?.phone || null,
            image: profileImageSrc || null,
            is_active: admin.is_active ?? true,
            created_at: admin.created_at,
            updated_at: admin.updated_at,
            last_login_at: admin.last_login_at || undefined,
            last_login_formatted: lastLoginFormatted
          }
        }
      })

      setAdmins(transformedAdmins)
      
    } catch (error) {
      console.error("Error in fetchAdminsSeparately:", error)
    }
  }

  useEffect(() => {
    // Fetch admins from database
    fetchAdmins()
  }, [])

  // Update current user role when admins change
  useEffect(() => {
    const adminEmail = localStorage.getItem("admin_email")
    if (adminEmail && admins.length > 0) {
      const currentUser = admins.find(admin => admin.admin.email === adminEmail)
      if (currentUser) {
        setCurrentUserRole(currentUser.admin.role || '')
      }
    }
  }, [admins])

  const handleAddAdmin = async (newAdmin: { name: string; email: string; role: string; status: "active" | "inactive" }) => {
    try {
      const supabase = getSupabase()
      
      // 1. Create admin in admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .insert({
          email: newAdmin.email,
          username: newAdmin.name.toLowerCase().replace(/\s+/g, '_'),
          full_name: newAdmin.name,
          role: newAdmin.role,
          is_active: newAdmin.status === 'active',
          password_hash: 'temporary_password_hash' // You should generate a secure password
        })
        .select()
        .single()

      if (adminError) {
        console.error("Error creating admin:", adminError)
        alert("Failed to create admin: " + adminError.message)
        return
      }

      console.log("Created admin:", adminData)

      // 2. Create profile in admin_profiles table
      if (adminData) {
        const { error: profileError } = await supabase
          .from('admin_profiles')
          .insert({
            admin_id: adminData.admin_id,
            full_name: newAdmin.name
          })

        if (profileError) {
          console.error("Error creating admin profile:", profileError)
        }
      }

      // Refresh the admin list
      await fetchAdmins()
      
      alert("Admin created successfully!")
      
    } catch (error: any) {
      console.error("Error adding admin:", error)
      alert("Failed to create admin: " + error.message)
    }
  }

  const handleToggleStatus = async (adminId: string) => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can change admin status")
      return
    }

    const admin = admins.find(a => a.admin.admin_id === adminId)
    if (!admin) return

    try {
      const supabase = getSupabase()
      const newStatus = admin.admin.is_active === true ? false : true
      
      const { error } = await supabase
        .from('admins')
        .update({ is_active: newStatus })
        .eq('admin_id', adminId)

      if (error) {
        console.error("Error updating admin status:", error)
        alert("Failed to update admin status")
        return
      }

      // Update local state
      const updatedAdmins = admins.map((a) =>
        a.admin.admin_id === adminId ? { 
          admin: { ...a.admin, is_active: newStatus } 
        } : a
      )
      setAdmins(updatedAdmins)
      
      alert("Admin status updated successfully!")
      
    } catch (error: any) {
      console.error("Error toggling status:", error)
      alert("Failed to update admin status")
    }
  }
  
  const handleDeleteAdmin = async (adminId: string) => {
    if (currentUserRole !== "Super Admin") {
      alert("Only Super Admins can delete admin accounts")
      return
    }

    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      return
    }

    try {
      const supabase = getSupabase()
      
      // Since you have CASCADE foreign key constraint, deleting from admins will also delete from admin_profiles
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('admin_id', adminId)

      if (error) {
        console.error("Error deleting admin:", error)
        alert("Failed to delete admin: " + error.message)
        return
      }

      // Refresh the admin list
      await fetchAdmins()
      
      alert("Admin deleted successfully!")
      
    } catch (error: any) {
      console.error("Error deleting admin:", error)
      alert("Failed to delete admin")
    }
  }

  const handleEditAdmin = (admin: Admin) => {
    // This function is passed to AdminsTab component
    return admin
  }

  const handleSaveEdit = async (updatedAdmin: Admin) => {
    if (!updatedAdmin) return

    try {
      const supabase = getSupabase()
      
      // Update admin in database
      const { error: adminError } = await supabase
        .from('admins')
        .update({
          full_name: updatedAdmin.admin.full_name,
          role: updatedAdmin.admin.role,
          is_active: updatedAdmin.admin.is_active
        })
        .eq('admin_id', updatedAdmin.admin.admin_id)

      if (adminError) {
        console.error("Error updating admin:", adminError)
        alert("Failed to update admin")
        return
      }

      // Update profile in admin_profiles table
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .upsert({
          admin_id: updatedAdmin.admin.admin_id,
          full_name: updatedAdmin.admin.full_name,
          phone: updatedAdmin.admin.phone
        }, {
          onConflict: 'admin_id'
        })

      if (profileError) {
        console.error("Error updating admin profile:", profileError)
      }

      // Refresh the admin list
      await fetchAdmins()
      
      alert("Admin updated successfully!")
      
    } catch (error: any) {
      console.error("Error saving edit:", error)
      alert("Failed to update admin")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage admin accounts and permissions
          </p>
        </div>
      </div>

      <AdminsTab
        admins={admins}
        currentUserRole={currentUserRole}
        onToggleStatus={handleToggleStatus}
        onAddAdmin={handleAddAdmin}
        onEditAdmin={handleEditAdmin}
        onDeleteAdmin={handleDeleteAdmin}
        onSaveEdit={handleSaveEdit}
        fetchAdmins={fetchAdmins}
      />
    </div>
  )
}