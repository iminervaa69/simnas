'use client'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  Home, 
  Building2, 
  BookOpen,
  User,
  GraduationCap
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const siswaNavMainItems = [
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
]

export function SiswaSidebarItems() {
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
      title: "Jurnal Harian",
      url: "/dashboard/journals",
      icon: BookOpen,
    },
    {
      title: "Data Magang Saya",
      url: "/dashboard/my-internship",
      icon: GraduationCap,
    },
    {
      title: "Profil",
      url: "/dashboard/profile",
      icon: User,
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