'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UserResponse } from "@/types/user.types"

interface DashboardWrapperProps {
  children: React.ReactNode
  user: UserResponse
}

export function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  return (
    <SidebarProvider>
      <DynamicSidebar user={user} />
      <SidebarInset>
        <DashboardHeader user={user} />
        <div className="flex-1 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}