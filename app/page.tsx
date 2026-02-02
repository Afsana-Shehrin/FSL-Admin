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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
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
      
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email.trim())
        .single()

      if (adminError || !admin) {
        throw new Error("Invalid admin credentials")
      }

      console.log('✅ Admin found:', admin.email, 'Role:', admin.role)

      if (!admin.is_active) {
        throw new Error("Account is not active")
      }

      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_email', admin.email)
      
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

      await supabase
        .from('admins')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', admin.admin_id)

      console.log('✅ Login successful!')
      
      const welcomeName = admin.full_name || admin.username || admin.email.split('@')[0]
      toast.success(`Welcome back, ${welcomeName}!`)
      
      router.push('/admin')
      router.refresh()
      
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || "Login failed")
      toast.error(error.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Image - Fixed position and sizing */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/adminloginbg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed', // This keeps background fixed during scroll
        }}
      ></div>
      
      {/* Lighter overlay - Reduced opacity from 95% to 70% */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70"></div>
      
      {/* Remove or reduce pattern overlay opacity */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '50px 50px',
        }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="card-custom border-2 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardHeader className="space-y-4 text-center">
            <div>
              <CardTitle className="text-2xl font-bold text-white">Fantasy Sports Admin</CardTitle>
              <CardDescription className="text-slate-300 mt-2">
                Sign in to manage your fantasy sports platform
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-900/50 bg-red-950/50 backdrop-blur">
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
                  placeholder="admin@fantasysports.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 transition-all duration-300" 
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
              <p className="text-xs text-slate-400 mt-4">Only approved admins can access</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}