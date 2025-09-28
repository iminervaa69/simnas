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
import {
  BookOpen,
  Building2,
  FileText,
  GraduationCap,
  Home,
  Settings,
  Users,
  User,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface DynamicSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: UserResponse
}

export function DynamicSidebar({ user, ...props }: DynamicSidebarProps) {
  const { logout } = useAuth()

  const getNavigationData = () => {
    const baseTeam = {
      name: "SIMMAS",
      logo: BookOpen,
      plan: "Sistem Magang Siswa",
    }

    switch (user.role) {
      case 'admin':
        return {
          teams: [baseTeam],
          navMain: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: Home,
              isActive: true,
            },
            {
              title: "Manajemen",
              url: "#",
              icon: Settings,
              items: [
                {
                  title: "DUDI",
                  url: "/dashboard/dudi",
                },
                {
                  title: "Pengguna",
                  url: "/dashboard/users",
                },
                {
                  title: "Pengaturan Sekolah",
                  url: "/dashboard/settings",
                },
              ],
            },
            {
              title: "Magang",
              url: "#",
              icon: GraduationCap,
              items: [
                {
                  title: "Data Magang",
                  url: "/dashboard/internships",
                },
                {
                  title: "Jurnal Harian",
                  url: "/dashboard/journals",
                },
                {
                  title: "Penempatan",
                  url: "/dashboard/placements",
                },
              ],
            },
            {
              title: "Laporan",
              url: "/dashboard/reports",
              icon: FileText,
            },
          ],
        }

      case 'guru':
        return {
          teams: [baseTeam],
          navMain: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: Home,
              isActive: true,
            },
            {
              title: "DUDI",
              url: "/dashboard/dudi",
              icon: Building2,
            },
            {
              title: "Siswa Bimbingan",
              url: "#",
              icon: GraduationCap,
              items: [
                {
                  title: "Data Magang",
                  url: "/dashboard/internships",
                },
                {
                  title: "Jurnal Harian",
                  url: "/dashboard/journals",
                },
                {
                  title: "Penilaian",
                  url: "/dashboard/assessments",
                },
              ],
            },
            {
              title: "Laporan",
              url: "/dashboard/reports",
              icon: FileText,
            },
          ],
        }

      case 'siswa':
        return {
          teams: [baseTeam],
          navMain: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: Home,
              isActive: true,
            },
            {
              title: "DUDI",
              url: "/dashboard/dudi",
              icon: Building2,
            },
            {
              title: "Magang Saya",
              url: "#",
              icon: GraduationCap,
              items: [
                {
                  title: "Data Magang",
                  url: "/dashboard/my-internship",
                },
                {
                  title: "Jurnal Harian",
                  url: "/dashboard/journals",
                },
                {
                  title: "Progress",
                  url: "/dashboard/progress",
                },
              ],
            },
            {
              title: "Profil",
              url: "/dashboard/profile",
              icon: User,
            },
          ],
        }

      default:
        return {
          teams: [baseTeam],
          navMain: [],
        }
    }
  }

  const navigationData = getNavigationData()

  const userData = {
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
    email: user.email,
    avatar: "", // You can add avatar URL here later
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navigationData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
