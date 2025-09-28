import { requireAuth } from '@/lib/auth-server'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { GuruDashboard } from '@/components/dashboard/guru-dashboard'
import { SiswaDashboard } from '@/components/dashboard/siswa-dashboard'

export default async function DashboardPage() {
  console.log('🔄 Server: Dashboard page loading...')
  
  const user = await requireAuth()
  console.log('✅ Server: User authenticated for dashboard:', user.email, user.role)

  const renderDashboardContent = () => {
    console.log('🎯 Server: Rendering content for role:', user.role)
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />
      case 'guru':
        return <GuruDashboard user={user} />
      case 'siswa':
        return <SiswaDashboard user={user} />
      default:
        console.log('❌ Server: Unknown role:', user.role)
        return <div>Unauthorized</div>
    }
  }

  return (
    <DashboardWrapper user={user}>
      {renderDashboardContent()}
    </DashboardWrapper>
  )
}