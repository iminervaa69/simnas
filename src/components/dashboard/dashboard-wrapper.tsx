'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UserResponse } from "@/types/user.types"
import { ScrollArea } from '@/components/ui/scroll-area'


interface DashboardWrapperProps {
  children: React.ReactNode
  user: UserResponse
}

export function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  return (
    <SidebarProvider>
      <DynamicSidebar user={user} />
      <SidebarInset className="flex flex-col h-screen">
        <DashboardHeader user={user} />
        <ScrollArea className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}