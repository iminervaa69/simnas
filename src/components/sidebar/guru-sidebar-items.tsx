'use client'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  Home, 
  Building2, 
  GraduationCap,
  BookOpen,
  FileText
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const guruNavMainItems = [
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
]

export function GuruSidebarItems() {
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
      title: "Siswa Magang",
      url: "/dashboard/internships",
      icon: GraduationCap,
    },
    {
      title: "Jurnal Harian",
      url: "/dashboard/journals",
      icon: BookOpen,
    },
    {
      title: "Laporan",
      url: "/dashboard/reports",
      icon: FileText,
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
