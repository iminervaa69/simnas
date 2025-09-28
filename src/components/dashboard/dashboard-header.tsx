'use client'

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserResponse } from "@/types/user.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  user: UserResponse
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'guru':
        return 'Guru Pembimbing'
      case 'siswa':
        return 'Siswa'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'guru':
        return 'default'
      case 'siswa':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">
              {getGreeting()}, {user.firstName || user.email}
            </p>
            <Badge variant={getRoleColor(user.role)} className="text-xs">
              {getRoleLabel(user.role)}
            </Badge>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user.firstName || user.email} />
            <AvatarFallback>
              {(user.firstName || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}