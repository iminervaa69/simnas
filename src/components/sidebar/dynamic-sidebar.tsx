'use client'

import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { UserResponse } from "@/types/user.types"
import { AdminSidebarItems } from "./admin-sidebar-items"
import { GuruSidebarItems } from "./guru-sidebar-items"
import { SiswaSidebarItems } from "./siswa-sidebar-items"
import { BookOpen, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface DynamicSidebarProps {
  user: UserResponse
}

export function DynamicSidebar({ user }: DynamicSidebarProps) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const renderSidebarItems = () => {
    switch (user.role) {
      case 'admin':
        return <AdminSidebarItems />
      case 'guru':
        return <GuruSidebarItems />
      case 'siswa':
        return <SiswaSidebarItems />
      default:
        return null
    }
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <BookOpen className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SIMMAS</span>
                <span className="truncate text-xs">Sistem Magang Siswa</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {renderSidebarItems()}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}