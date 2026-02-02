"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/working-client"
import { toast } from "sonner"

export default function TestLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleTestLogin = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email || "admin@example.com", // Use your admin email
        password: password || "password123"   // Use your admin password
      })
      
      if (error) {
        toast.error('Login failed: ' + error.message)
        return
      }
      
      if (data.user) {
        // Set localStorage
        localStorage.setItem('admin_logged_in', 'true')
        localStorage.setItem('admin_email', data.user.email!)
        
        console.log('✅ Test login successful!')
        console.log('LocalStorage set:', {
          admin_logged_in: localStorage.getItem('admin_logged_in'),
          admin_email: localStorage.getItem('admin_email')
        })
        
        toast.success('Login successful! Redirecting...')
        
        // Wait a bit then redirect
        setTimeout(() => {
          router.push('/admin')
          router.refresh()
        }, 1000)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Test Admin Login</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleTestLogin}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Test Login
          </button>
          
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm">
              After login, check:
              <br />1. Browser Console for logs
              <br />2. LocalStorage values
              <br />3. Redirect to /admin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}