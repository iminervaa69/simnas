import { UserResponse } from "@/types/user.types"

interface AdminDashboardProps {
  user: UserResponse
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome, {user.firstName || user.email}</p>
      </div>
    </div>
  )
}