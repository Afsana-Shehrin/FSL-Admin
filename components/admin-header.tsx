"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
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

export function AdminHeader() {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    image: undefined as string | undefined,
  })

  useEffect(() => {
    loadProfileData()
  }, [showProfileDialog])

  const loadProfileData = () => {
    const adminEmail = localStorage.getItem("adminEmail") || ""
    const storedProfile = localStorage.getItem(`profile_${adminEmail}`)

    if (storedProfile) {
      const parsed = JSON.parse(storedProfile)
      setProfile({
        name: parsed.name || "",
        email: adminEmail,
        username: parsed.username || "",
        phone: parsed.phone || "",
        image: parsed.profilePicture || undefined,
      })
    } else {
      setProfile({
        name: "",
        email: adminEmail,
        username: "",
        phone: "",
        image: undefined,
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminEmail")
    router.push("/")
  }

  const handleSaveProfile = (updatedProfile: typeof profile) => {
    const adminEmail = localStorage.getItem("adminEmail") || ""
    localStorage.setItem(
      `profile_${adminEmail}`,
      JSON.stringify({
        name: updatedProfile.name,
        username: updatedProfile.username,
        phone: updatedProfile.phone,
        profilePicture: updatedProfile.image,
      }),
    )
    setProfile(updatedProfile)
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex flex-1 items-center">
          <h1 className="text-2xl font-bold text-foreground">ADMIN PORTAL</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile.image || "/placeholder.svg"} alt={profile.name || "Admin"} />
                  <AvatarFallback>
                    {profile.name
                      ? profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{profile.name || profile.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <EditProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </>
  )
}
