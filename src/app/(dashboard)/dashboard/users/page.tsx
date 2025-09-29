import { requireAuth } from '@/lib/auth-server'
import { MainWrapper } from '@/components/dashboard/CRUD/main-wrapper'
import { SectionCards } from "@/components/section-cards"
import { DataTable } from "@/components/data-table"
import data from "./data.json"

const tableSchema = {
  header: { 
    type: 'text' as const, 
    header: 'Header', 
    sortable: true,
    required: true 
  },
  type: { 
    type: 'select' as const, 
    header: 'Section Type', 
    options: [
      'Table of Contents',
      'Executive Summary', 
      'Technical Approach',
      'Design',
      'Capabilities',
      'Focus Documents',
      'Narrative',
      'Cover Page'
    ],
    filterable: true 
  },
  status: { 
    type: 'select' as const, 
    header: 'Status', 
    options: ['Done', 'In Progress', 'Not Started'],
    badge: true,
    filterable: true 
  },
  target: { 
    type: 'number' as const, 
    header: 'Target', 
    editable: true,
  },
  limit: { 
    type: 'number' as const, 
    header: 'Limit', 
    editable: true,
  },
  reviewer: { 
    type: 'select' as const,
    header: 'Reviewer', 
    options: ['Eddie Lake', 'Jamik Tashpulatov', 'Emily Whalen'],
    placeholder: 'Assign reviewer' 
  },
}

const sectionCardsConfig = {
  cards: [
    {
      title: "Total DUDI", 
      description: "Total DUDI",
      value: 100,
      format: 'number' as const,
      footer: {
        title: "Perusahaan Mitra",
        description: "Calon penerima siswa magang",
      },
      icon: 'building_2' as const
    },
    {
      title: "Siswa Magang",
      description: "Total Siswa Magang", 
      value: 1234,
      format: 'number' as const,
      footer: {
        title: "Siswa Magang",
        description: "Total siswa magang aktif", 
      },
      icon: 'users' as const
    },
    {
      title: "DUDI Aktif",
      description: "DUDI Aktif",
      value: 70,
      format: 'number' as const,
      footer: {
        title: "Siap menerima siswa",
        description: "DUDI yang aktif menerima magang",
      },
      icon: 'check_circle' as const
    },
    {
      title: "DUDI Tidak Aktif",
      description: "DUDI Tidak Aktif",
      value: 30,
      format: 'number' as const,
      footer: {
        title: "Tidak menerima siswa",
        description: "DUDI yang tidak aktif",
      },
      icon: 'x_circle' as const
    }
  ],
  columns: {
    mobile: 1,
    tablet: 2, 
    desktop: 4,
    large: 4
  }
}

const tableFeatures = {
  enableDragDrop: true,
  enableSelection: true,
  enablePagination: true,
  enableColumnVisibility: true,
  enableActions: true,
  pagination: {
    pageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50]
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <MainWrapper user={user}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards config={sectionCardsConfig} />
            <DataTable 
              data={data} 
              schema={tableSchema}
              features={tableFeatures}
            />
          </div>
        </div>
      </div>
    </MainWrapper>
  )
}