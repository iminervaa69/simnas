import { UserResponse } from "@/types/user.types"

interface SiswaDashboardProps {
  user: UserResponse
}

export function SiswaDashboard({ user }: SiswaDashboardProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Siswa Dashboard</h1>
        <p className="text-muted-foreground mt-2">Selamat datang, {user.firstName || user.email}</p>
      </div>
    </div>
  )
}