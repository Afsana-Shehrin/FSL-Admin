"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Camera } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: {
    name: string
    email: string
    username: string
    phone: string
    image?: string
  }
  onSave: (profile: { name: string; email: string; username: string; phone: string; image?: string }) => void
}

export function EditProfileDialog({ open, onOpenChange, profile, onSave }: EditProfileDialogProps) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [username, setUsername] = useState(profile.username)
  const [phone, setPhone] = useState(profile.phone)
  const [profileImage, setProfileImage] = useState(profile.image)

  useEffect(() => {
    setName(profile.name)
    setEmail(profile.email)
    setUsername(profile.username)
    setPhone(profile.phone)
    setProfileImage(profile.image)
  }, [profile])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    onSave({ name, email, username, phone, image: profileImage })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-center border-b px-4 py-3 relative">
          <h2 className="text-base font-semibold">Edit Profile</h2>
        </div>

        {/* Content */}
        <div className="space-y-4 px-4 pb-6">
          {/* Profile Picture */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage || "/placeholder.svg"} alt={name || "Admin"} />
                <AvatarFallback className="text-2xl">
                  {name
                    ? name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "A"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/50"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">E mail address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">User name</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-muted/50"
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Phone number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-muted/50"
                placeholder="+1 234 567 8900"
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-4">
              Confirm Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
