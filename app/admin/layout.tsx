"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { getSupabase } from "@/lib/supabase/working-client"

// Define Admin type
interface Admin {
  id: string
  email: string
  name?: string
  role?: string
  is_active: boolean
  phone?: string | null
  image?: string | null
  created_at?: string
  updated_at?: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
  try {
    console.log('🔐 [ADMIN LAYOUT] Checking authentication...')
    
    const supabase = getSupabase()
    
    // Method 1: Check localStorage first (for backward compatibility)
    const isLoggedInLocalStorage = localStorage.getItem('admin_logged_in') === 'true'
    const adminEmailFromStorage = localStorage.getItem('admin_email')
    
    // Method 2: Check Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('📋 [ADMIN LAYOUT] Auth status:', {
      localStorage: isLoggedInLocalStorage,
      emailFromStorage: adminEmailFromStorage,
      supabaseSession: !!session,
      sessionEmail: session?.user?.email
    })
    
    // Determine which email to use
    let adminEmail = adminEmailFromStorage || session?.user?.email
    
    if (!adminEmail) {
      console.log('🚨 [ADMIN LAYOUT] No admin email found')
      router.push('/')
      return
    }

    console.log('✅ [ADMIN LAYOUT] Using admin email:', adminEmail)

    // 3. Verify admin exists and is active in database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', adminEmail)
      .single()

    if (error || !admin) {
      console.error('🚨 [ADMIN LAYOUT] Admin not found in database')
      localStorage.removeItem('admin_logged_in')
      localStorage.removeItem('admin_email')
      router.push('/')
      return
    }

    if (!admin.is_active) {
      console.error('🚨 [ADMIN LAYOUT] Admin account is not active')
      localStorage.removeItem('admin_logged_in')
      localStorage.removeItem('admin_email')
      router.push('/')
      return
    }

    console.log('✅ [ADMIN LAYOUT] Auth successful! Admin:', admin.email)
    setCurrentAdmin(admin)
    setIsLoading(false)
    
  } catch (error) {
    console.error('🔥 [ADMIN LAYOUT] Auth check error:', error)
    localStorage.removeItem('admin_logged_in')
    localStorage.removeItem('admin_email')
    router.push('/')
  }
}

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!currentAdmin) {
    return null // Or a fallback UI
  }

  console.log('🎨 [ADMIN LAYOUT] Rendering admin dashboard...')
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader admin={currentAdmin} />
      <div className="flex">
        <AdminSidebar admin={currentAdmin} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}