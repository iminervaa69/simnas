'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import { UserResponse } from "@/types/user.types"

interface MainWrapperProps {
  children: React.ReactNode
  user: UserResponse
}

export function MainWrapper({ children, user }: MainWrapperProps) {
  return (
    <SidebarProvider>
      <DynamicSidebar user={user} />
      <SidebarInset>
        <div className="flex-1 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}