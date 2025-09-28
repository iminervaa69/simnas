import { UserResponse } from "@/types/user.types"

interface GuruDashboardProps {
  user: UserResponse
}

export function GuruDashboard({ user }: GuruDashboardProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Guru Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome, {user.firstName || user.email}</p>
      </div>
    </div>
  )
}