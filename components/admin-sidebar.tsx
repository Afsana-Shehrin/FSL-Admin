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
  Sliders,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile" // Add this import

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
  { href: "/admin/fixtures", label: "Fixtures & Rounds", icon: Calendar },
  { href: "/admin/results", label: "Results Board", icon: ClipboardList },
  { href: "/admin/fantasy-points", label: "Fantasy Points", icon: ClipboardList },
  { href: "/admin/team-configuration", label: "Team Rules", icon: Sliders },
  { href: "/admin/scoring-rules", label: "Scoring Rules", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Admins", icon: User },
]

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile() // Add this hook

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isOpen && isMobile && !target.closest("[data-sidebar]") && !target.closest("[data-menu-button]")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, isMobile])

  return (
    <>
      {/* Mobile menu button - only show on mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          data-menu-button
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Mobile overlay - only show on mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        data-sidebar
        className={cn(
          // Base styles
          "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          
          // Mobile styles
          "fixed inset-y-0 left-0 z-40 h-screen",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0 w-64",
          
          // Desktop styles
          "md:relative md:translate-x-0 md:w-64 md:h-[calc(100vh-4rem)]",
          "md:min-h-[calc(100vh-4rem)]",
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-6 justify-between">
          <div className="flex items-center">
            <span className="ml-2 text-lg font-semibold text-sidebar-foreground">Admin Portal</span>
          </div>
          
          {/* Close button only on mobile */}
          {isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          )}
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
                onClick={() => isMobile && setIsOpen(false)}
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