"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Shield,
  FileText,
  Settings,
  ClipboardList,
  X,
  Menu,
  User,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

// Define prop types
interface AdminSidebarProps {
  admin: {
    role?: string
  }
}

// Use the EXACT same navItems as the prototype
const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/sports", label: "Sports", icon: Trophy },
  { href: "/admin/leagues", label: "Leagues & Seasons", icon: Shield },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/fixtures", label: "Fixtures", icon: Calendar },
  { href: "/admin/results", label: "Results Board", icon: ClipboardList },
  { href: "/admin/fantasy-points", label: "Fantasy Points", icon: Trophy },
  { href: "/admin/rules", label: "Rules", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
 // { href: "/admin/logs", label: "Activity Logs", icon: FileText },
  { href: "/admin/settings", label: "Admins", icon: User },
]

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isOpen && !target.closest("[data-sidebar]") && !target.closest("[data-menu-button]")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        data-menu-button
      >
        <Menu className="h-6 w-6" />
      </Button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      <div
        data-sidebar
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 md:translate-x-0",
          // Fixed positioning for mobile, static for desktop
          "h-screen md:h-[calc(100vh-2rem)]", // Full height on mobile, slightly less on desktop if needed
          "md:min-h-[calc(100vh-2rem)]", // Ensure minimum height on desktop
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        style={{
          // Force the sidebar to take full viewport height
          height: '100vh',
          // Ensure it stays on top of content
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-6 justify-between">
          <div className="flex items-center">
            
            <span className="ml-2 text-lg font-semibold text-sidebar-foreground">Admin Portal</span>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
      </div>
    </>
  )
}