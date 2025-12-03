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

    const storedProfile = localStorage.getItem(`admin_profile_${adminEmail}`)
    const legacyProfile = localStorage.getItem(`profile_${adminEmail}`)

    // Get name from loggedInAdmins if not in profile
    const loggedInAdmins = JSON.parse(localStorage.getItem("loggedInAdmins") || "[]")
    const adminData = loggedInAdmins.find((admin: any) => admin.email === adminEmail)

    if (storedProfile) {
      const parsed = JSON.parse(storedProfile)
      setProfile({
        name: parsed.name || adminData?.name || "",
        email: adminEmail,
        username: parsed.username || "",
        phone: parsed.phone || "",
        image: parsed.profilePicture || undefined,
      })
    } else if (legacyProfile) {
      const parsed = JSON.parse(legacyProfile)
      setProfile({
        name: parsed.name || adminData?.name || "",
        email: adminEmail,
        username: parsed.username || "",
        phone: parsed.phone || "",
        image: parsed.profilePicture || undefined,
      })
    } else {
      setProfile({
        name: adminData?.name || "",
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

    console.log("[v0] Saving profile for:", adminEmail, "with phone:", updatedProfile.phone)

    localStorage.setItem(
      `admin_profile_${adminEmail}`,
      JSON.stringify({
        name: updatedProfile.name,
        username: updatedProfile.username,
        phone: updatedProfile.phone,
        profilePicture: updatedProfile.image,
      }),
    )

    const loggedInAdmins = JSON.parse(localStorage.getItem("loggedInAdmins") || "[]")
    const adminIndex = loggedInAdmins.findIndex((admin: any) => admin.email === adminEmail)
    if (adminIndex !== -1) {
      loggedInAdmins[adminIndex].name = updatedProfile.name
      localStorage.setItem("loggedInAdmins", JSON.stringify(loggedInAdmins))
    }

    setProfile(updatedProfile)

    window.dispatchEvent(new Event("storage"))
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
