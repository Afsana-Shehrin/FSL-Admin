"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Camera, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminId: string // ADD: Receive adminId
  profile: {
    name: string
    email: string
    username: string
    phone: string
    image?: string
  }
  onSave: (profile: { name: string; username: string; phone: string; image?: string }) => void
}

export function EditProfileDialog({ 
  open, 
  onOpenChange, 
  adminId, // ADD: Destructure adminId
  profile, 
  onSave 
}: EditProfileDialogProps) {
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [phone, setPhone] = useState(profile.phone)
  const [profileImage, setProfileImage] = useState(profile.image)

  const email = profile.email // Email is read-only

  useEffect(() => {
    setName(profile.name)
    setUsername(profile.username)
    setPhone(profile.phone)
    setProfileImage(profile.image)
  }, [profile])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB")
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file")
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    // Validate required fields
    if (!name.trim()) {
      alert("Please enter your name")
      return
    }
    
    onSave({ 
      name, 
      username, 
      phone, 
      image: profileImage 
    })
  }

  // Add this validation function in EditProfileDialog component
const validatePhoneInput = (value: string): string => {
  // Allow empty during typing
  if (!value) return value
  
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, '')
  
  // Format as user types
  if (digitsOnly.length <= 3) {
    return digitsOnly
  } else if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`
  } else {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8, 11)}`
  }
}

// In the phone input field, add this onChange handler:
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        {/* ADD: DialogTitle for accessibility - visually hidden but available for screen readers */}
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>
        <DialogDescription className="sr-only">
          Update your profile information including name, phone number, and profile picture
        </DialogDescription>
        
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
                aria-label="Change profile picture"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  aria-describedby="profile-upload-help"
                />
              </label>
              <span id="profile-upload-help" className="sr-only">
                Click to upload a new profile picture. Maximum size 2MB.
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Read-only Email field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div 
                className="p-2 bg-muted/30 rounded-md border text-sm text-muted-foreground"
                aria-label="Email address"
              >
                {email}
              </div>
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/50"
                placeholder="Enter your name"
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">
                User name
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-muted/50"
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Phone number
              </Label>
              <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    const formatted = validatePhoneInput(e.target.value)
                    setPhone(formatted)
                  }}
                  className="bg-muted/50"
                  placeholder="01XXX-XXXXXX"
                  maxLength={13} // 11 digits + 2 dashes
                />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full mt-4"
              aria-label="Save profile changes"
            >
              Confirm Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}