"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showInactiveMessage, setShowInactiveMessage] = useState(false)

  useEffect(() => {
    const initializeSuperAdmin = () => {
      const loggedInAdmins = JSON.parse(localStorage.getItem("loggedInAdmins") || "[]")
      const superAdminEmail = "afsanashehrin@gmail.com"
      const existingSuperAdmin = loggedInAdmins.find((admin: any) => admin.email === superAdminEmail)

      if (!existingSuperAdmin) {
        const superAdmin = {
          id: "super_admin_001",
          name: "Afsana Shehrin",
          email: superAdminEmail,
          role: "Super Admin",
          status: "active",
          createdAt: new Date().toISOString(),
        }
        loggedInAdmins.push(superAdmin)
        localStorage.setItem("loggedInAdmins", JSON.stringify(loggedInAdmins))
      }
    }

    initializeSuperAdmin()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setShowInactiveMessage(false)
    setIsLoading(true)

    // Simulate authentication
    setTimeout(() => {
      if (email && password) {
        const loggedInAdmins = JSON.parse(localStorage.getItem("loggedInAdmins") || "[]")
        const existingAdmin = loggedInAdmins.find((admin: any) => admin.email === email)

        if (existingAdmin && existingAdmin.status === "inactive") {
          setShowInactiveMessage(true)
          setIsLoading(false)
          return
        }

        localStorage.setItem("adminEmail", email)

        if (!existingAdmin) {
          const newAdmin = {
            id: Date.now().toString(),
            name: "",
            email: email,
            role: "Editor",
            status: "active",
            lastLogin: new Date().toISOString(),
          }
          loggedInAdmins.push(newAdmin)
          localStorage.setItem("loggedInAdmins", JSON.stringify(loggedInAdmins))
        } else {
          // Update last login
          existingAdmin.lastLogin = new Date().toISOString()
          localStorage.setItem("loggedInAdmins", JSON.stringify(loggedInAdmins))
        }

        router.push("/admin")
      } else {
        setError("Please enter both email and password")
        setIsLoading(false)
      }
    }, 1000)
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
          {showInactiveMessage && (
            <Alert variant="destructive" className="mb-4 border-red-900/50 bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                Your account is currently inactive. Please contact a Super Admin to request access permission.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fantasysports.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
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
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">Demo credentials: Any email/password combination</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
