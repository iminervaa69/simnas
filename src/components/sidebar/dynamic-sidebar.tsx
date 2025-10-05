'use client'

import * as React from "react"
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UserResponse } from "@/types/user.types"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { BookOpen } from "lucide-react"
import { adminNavMainItems } from "./admin-sidebar-items"
import { guruNavMainItems } from "./guru-sidebar-items"
import { siswaNavMainItems } from "./siswa-sidebar-items"
import { MobileTabSection } from "@/components/global-tab-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { Separator } from "@/components/ui/separator"

interface DynamicSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: UserResponse
}

export function DynamicSidebar({ user, ...props }: DynamicSidebarProps) {
  const isMobile = useIsMobile()

  const getNavigationData = () => {
    const baseTeam = {
      name: "SIMMAS",
      logo: BookOpen,
      plan: "Sistem Magang Siswa",
    }

    return { teams: [baseTeam] }
  }

  const navigationData = getNavigationData()

  const userData = {
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
    email: user.email,
    avatar: "", 
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navigationData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {user.role === 'admin' && <NavMain items={adminNavMainItems} />}
        {user.role === 'guru' && <NavMain items={guruNavMainItems} />}
        {user.role === 'siswa' && <NavMain items={siswaNavMainItems} />}
        
        {/* Mobile Tab Section - only show on mobile */}
        {isMobile && (
          <>
            <Separator className="my-2" />
            <MobileTabSection />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
