import { requireAuth } from '@/lib/auth-server'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'
import { SectionCards, SectionCardsConfig } from "@/components/section-cards"
import { hasPermission, UserRole } from '@/config/permissions'
import { DudiPageClient } from './dudi-page-client'
import { query } from '@/lib/database/connection'


const tableSchema = {
  nama_perusahaan: { 
    type: 'text' as const, 
    header: 'Company Name', 
    sortable: true,
    required: true 
  },
  penanggung_jawab: { 
    type: 'text' as const, 
    header: 'Contact Person', 
    sortable: true,
    required: true 
  },
  alamat: { 
    type: 'textarea' as const, 
    header: 'Address', 
    required: true 
  },
  telepon: { 
    type: 'phone' as const, 
    header: 'Phone', 
    placeholder: 'Enter phone number'
  },
  email: { 
    type: 'email' as const, 
    header: 'Email', 
    placeholder: 'Enter email address'
  },
  bidang_usaha: { 
    type: 'text' as const, 
    header: 'Business Field', 
    placeholder: 'Enter business field'
  },
  kuota_siswa: { 
    type: 'number' as const, 
    header: 'Student Quota', 
    min: 1,
    required: true
  },
  status: { 
    type: 'select' as const, 
    header: 'Status', 
    options: ['aktif', 'nonaktif'],
    badge: true,
    filterable: false,
    badgeIconMap: { aktif: 'check' as const, nonaktif: 'x' as const },
    badgeClassMap: {
      aktif: 'text-green-600 dark:text-green-400',
      nonaktif: 'text-muted-foreground'
    }
  },
}

// SectionCards config will be constructed inside the page using live counts

const tableFeatures = {
  enableDragDrop: true,
  enableSelection: true,
  enablePagination: true,
  enableColumnVisibility: true,
  enableActions: true,
  pagination: {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 25, 30, 40, 50]
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()  

  const canView = hasPermission('/dashboard/dudi', user.role as UserRole, 'view')
  
  if (!canView) {
    return(
      <DashboardWrapper user={user}>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div>Access Denied</div>
            </div>
          </div>
        </div>
      </DashboardWrapper>
    )
  }

  // Query live counts using direct Postgres connection to avoid prepared statement issues
  const [totalRes, aktifRes, nonAktifRes] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM dudi WHERE deleted_at IS NULL'),
    query("SELECT COUNT(*)::int AS count FROM dudi WHERE deleted_at IS NULL AND status = 'aktif'"),
    query("SELECT COUNT(*)::int AS count FROM dudi WHERE deleted_at IS NULL AND status = 'nonaktif'"),
  ])
  const totalDudi = totalRes.rows[0]?.count || 0
  const aktifDudi = aktifRes.rows[0]?.count || 0
  const nonAktifDudi = nonAktifRes.rows[0]?.count || 0

  const sectionCardsConfig: SectionCardsConfig = {
    cards: [
      {
        title: "Total DUDI",
        description: "Total DUDI",
        value: totalDudi,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "Perusahaan Mitra", description: "Calon penerima siswa magang" },
        icon: 'building_2' as const,
      },
      {
        title: "DUDI Aktif",
        description: "DUDI Aktif",
        value: aktifDudi,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "Siap menerima siswa", description: "DUDI yang aktif menerima magang" },
        icon: 'check_circle' as const,
      },
      {
        title: "DUDI Tidak Aktif",
        description: "DUDI Tidak Aktif",
        value: nonAktifDudi,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "Tidak menerima siswa", description: "DUDI yang tidak aktif" },
        icon: 'x_circle' as const,
      },
      {
        title: "Siswa Magang",
        description: "Total Siswa Magang",
        value: 0, 
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "Siswa Magang", description: "Total siswa magang aktif" },
        icon: 'users' as const,
      },
    ],
    columns: { mobile: 1, tablet: 2, desktop: 4, large: 4 },
  }

  return (
    <DashboardWrapper user={user}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-1 ms-6">
              <h2 className="text-xl font-semibold tracking-tight">DUDI Management</h2>
              <p className="text-sm text-muted-foreground">Kelola data mitra DUDI, pantau status aktif/tidak aktif, dan lakukan pencarian serta penyaringan data dengan cepat.</p>
            </div>
            <SectionCards config={sectionCardsConfig} />
            <DudiPageClient 
              tableSchema={tableSchema}
              tableFeatures={tableFeatures}
            />
          </div>
        </div>
      </div>
    </DashboardWrapper>
  )
}