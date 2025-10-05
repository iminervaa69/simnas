import { requireAuth } from '@/lib/auth-server'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'
import { SectionCards, SectionCardsConfig } from "@/components/section-cards"
import { hasPermission, UserRole } from '@/config/permissions'
import { PeriodePageClient } from './periode-page-client'
import { query } from '@/lib/database/connection'

const tableSchema = {
  nama_periode: { 
    type: 'text' as const, 
    header: 'Periode Name', 
    sortable: true,
    required: true 
  },
  tahun_ajaran: { 
    type: 'text' as const, 
    header: 'Academic Year', 
    sortable: true,
    required: true 
  },
  tanggal_mulai: { 
    type: 'date' as const, 
    header: 'Start Date', 
    sortable: true,
    required: true 
  },
  tanggal_selesai: { 
    type: 'date' as const, 
    header: 'End Date', 
    sortable: true,
    required: true 
  },
  status: { 
    type: 'select' as const, 
    header: 'Status', 
    options: ['draft', 'aktif', 'selesai', 'dibatalkan'],
    badge: true,
    filterable: false,
    badgeIconMap: { 
      draft: 'edit' as const, 
      aktif: 'check' as const, 
      selesai: 'check_circle' as const,
      dibatalkan: 'x' as const 
    },
    badgeClassMap: {
      draft: 'text-yellow-600 dark:text-yellow-400',
      aktif: 'text-green-600 dark:text-green-400',
      selesai: 'text-blue-600 dark:text-blue-400',
      dibatalkan: 'text-red-600 dark:text-red-400'
    }
  },
  target_siswa: { 
    type: 'number' as const, 
    header: 'Target Students', 
    min: 0,
    placeholder: 'Enter target number of students'
  },
  deskripsi: { 
    type: 'textarea' as const, 
    header: 'Description', 
    placeholder: 'Enter periode description'
  },
}

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

export default async function PeriodePage() {
  const user = await requireAuth()  

  const canView = hasPermission('/dashboard/periode', user.role as UserRole, 'view')
  
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

  // Query live counts using direct Postgres connection
  const [totalRes, draftRes, aktifRes, selesaiRes, dibatalkanRes, batchRes] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM periode_magang WHERE deleted_at IS NULL'),
    query("SELECT COUNT(*)::int AS count FROM periode_magang WHERE deleted_at IS NULL AND status = 'draft'"),
    query("SELECT COUNT(*)::int AS count FROM periode_magang WHERE deleted_at IS NULL AND status = 'aktif'"),
    query("SELECT COUNT(*)::int AS count FROM periode_magang WHERE deleted_at IS NULL AND status = 'selesai'"),
    query("SELECT COUNT(*)::int AS count FROM periode_magang WHERE deleted_at IS NULL AND status = 'dibatalkan'"),
    query('SELECT COUNT(*)::int AS count FROM batch_magang WHERE deleted_at IS NULL'),
  ])
  const totalPeriode = totalRes.rows[0]?.count || 0
  const draftPeriode = draftRes.rows[0]?.count || 0
  const aktifPeriode = aktifRes.rows[0]?.count || 0
  const selesaiPeriode = selesaiRes.rows[0]?.count || 0
  const dibatalkanPeriode = dibatalkanRes.rows[0]?.count || 0
  const totalBatch = batchRes.rows[0]?.count || 0

  const sectionCardsConfig: SectionCardsConfig = {
    cards: [
      {
        title: "Total Periode",
        description: "Total Periode",
        value: totalPeriode,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "Academic Periods", description: "Total periode magang" },
        icon: 'calendar' as const,
      },
      {
        title: "Active Periode",
        description: "Active Periode",
        value: aktifPeriode,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "Currently Active", description: "Periode yang sedang berjalan" },
        icon: 'check_circle' as const,
      },
      {
        title: "Draft Periode",
        description: "Draft Periode",
        value: draftPeriode,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "In Preparation", description: "Periode dalam persiapan" },
        icon: 'edit' as const,
      },
      {
        title: "Total Batches",
        description: "Total Batches",
        value: totalBatch,
        format: 'number' as const,
        span: { tablet: 2, desktop: 2, large: 2 },
        footer: { title: "All Batches", description: "Total batch magang" },
        icon: 'layers' as const,
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
              <h2 className="text-xl font-semibold tracking-tight">Periode Management</h2>
              <p className="text-sm text-muted-foreground">Kelola periode magang, pantau status periode, dan lakukan pencarian serta penyaringan data dengan cepat.</p>
            </div>
            <SectionCards config={sectionCardsConfig} />
            <PeriodePageClient 
              tableSchema={tableSchema}
              tableFeatures={tableFeatures}
            />
          </div>
        </div>
      </div>
    </DashboardWrapper>
  )
}
