"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Trophy, Users, Calendar, Shield, FileText, Settings } from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/sports", label: "Sports", icon: Trophy },
  { href: "/admin/leagues", label: "Leagues & Seasons", icon: Shield },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/fixtures", label: "Fixtures", icon: Calendar },
  { href: "/admin/rules", label: "Rules", icon: FileText },
  { href: "/admin/logs", label: "Activity Logs", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Trophy className="h-6 w-6 text-sidebar-primary" />
        <span className="ml-2 text-lg font-semibold text-sidebar-foreground">Fantasy Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
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
  )
}
