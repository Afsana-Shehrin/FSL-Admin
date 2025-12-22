"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { getSupabase } from "@/lib/supabase/working-client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("") // Changed to empty string
  const [password, setPassword] = useState("") // Changed to empty string
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate inputs are not empty
    if (!email.trim()) {
      setError("Email is required")
      toast.error("Email is required")
      return
    }
    
    if (!password.trim()) {
      setError("Password is required")
      toast.error("Password is required")
      return
    }
    
    setIsLoading(true)

    try {
      const supabase = getSupabase()
      
      console.log('🔐 Checking admin credentials...')
      
      // 1. Check if user exists in admins table
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email.trim())
        .single()

      if (adminError || !admin) {
        throw new Error("Invalid admin credentials")
      }

      console.log('✅ Admin found:', admin.email, 'Role:', admin.role)
      console.log('🔑 Password hash from DB:', admin.password_hash ? 'Exists' : 'Missing')

      // 2. Check if admin is active
      if (!admin.is_active) {
        throw new Error("Account is not active")
      }

      // 3. IMPORTANT: Update your AdminLayout to look for these localStorage keys
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_email', admin.email)
      
      // Keep your custom session data too (optional)
      const adminSession = {
        admin_id: admin.admin_id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        full_name: admin.full_name,
        is_active: admin.is_active,
        loggedInAt: new Date().toISOString()
      }
      localStorage.setItem('admin_session', JSON.stringify(adminSession))
      
      console.log('✅ LocalStorage set:', {
        admin_logged_in: localStorage.getItem('admin_logged_in'),
        admin_email: localStorage.getItem('admin_email')
      })

      // 4. Update last login time
      await supabase
        .from('admins')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', admin.admin_id)

      console.log('✅ Login successful!')
      
      // Show welcome message
      const welcomeName = admin.full_name || admin.username || admin.email.split('@')[0]
      toast.success(`Welcome back, ${welcomeName}!`)
      
      // IMPORTANT: Use router.push instead of window.location.href
      router.push('/admin')
      router.refresh() // This ensures the layout re-renders with new auth state
      
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || "Login failed")
      toast.error(error.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-purple-600/10 rounded-xl border border-purple-600/20">
              <Trophy className="h-10 w-10 text-purple-500" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Fantasy Sports Admin</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Sign in to manage your fantasy sports platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 border-red-900/50 bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fantasysports.com" // Placeholder remains
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password" // Placeholder remains
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-500 mt-4">Only approved admins can access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}