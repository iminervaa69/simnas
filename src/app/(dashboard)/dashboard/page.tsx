import { requireAuth } from '@/lib/auth-server'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { GuruDashboard } from '@/components/dashboard/guru-dashboard'
import { SiswaDashboard } from '@/components/dashboard/siswa-dashboard'

export default async function DashboardPage() {
  
  const user = await requireAuth()

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />
      case 'guru':
        return <GuruDashboard user={user} />
      case 'siswa':
        return <SiswaDashboard user={user} />
      default:
        return <div>Unauthorized</div>
    }
  }

  return (
    <DashboardWrapper user={user}>
      {renderDashboardContent()}
    </DashboardWrapper>
  )
}