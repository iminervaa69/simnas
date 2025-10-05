'use client'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  Home, 
  Building2, 
  Users, 
  Settings, 
  GraduationCap,
  FileText,
  Calendar,
  Layers
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const adminNavMainItems = [
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
        title: "Periode",
        url: "/dashboard/periode",
      },
      {
        title: "Batch",
        url: "/dashboard/batch",
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
]

export function AdminSidebarItems() {
  const pathname = usePathname()

  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "DUDI",
      url: "/dashboard/dudi",
      icon: Building2,
    },
    {
      title: "Pengguna",
      url: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Periode",
      url: "/dashboard/periode",
      icon: Calendar,
    },
    {
      title: "Batch",
      url: "/dashboard/batch",
      icon: Layers,
    },
    {
      title: "Magang",
      url: "/dashboard/internships",
      icon: GraduationCap,
    },
    {
      title: "Laporan",
      url: "/dashboard/reports",
      icon: FileText,
    },
    {
      title: "Pengaturan",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={pathname === item.url}>
            <Link href={item.url}>
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}