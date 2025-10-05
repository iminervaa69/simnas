import { requireAuth } from '@/lib/auth-server'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'
import { SectionCards } from "@/components/section-cards"
import { hasPermission, UserRole } from '@/config/permissions'
import { UsersPageClient } from './users-page-client'

const tableSchema = {
  email: { 
    type: 'email' as const, 
    header: 'Email', 
    sortable: true,
    required: true 
  },
  first_name: { 
    type: 'text' as const, 
    header: 'First Name', 
    sortable: true,
    required: true 
  },
  last_name: { 
    type: 'text' as const, 
    header: 'Last Name', 
    sortable: true,
    required: true 
  },
  role: { 
    type: 'select' as const, 
    header: 'Role', 
    options: ['admin', 'guru', 'siswa'],
    badge: true,
    filterable: true 
  },
  phone: { 
    type: 'text' as const, 
    header: 'Phone', 
    placeholder: 'Enter phone number'
  },
  is_verified: { 
    type: 'boolean' as const, 
    header: 'Verified', 
  },
}

const sectionCardsConfig = {
  cards: [
    {
      title: "Total Users", 
      description: "Total Users",
      value: 100,
      format: 'number' as const,
      footer: {
        title: "All Users",
        description: "Total registered users",
      },
      icon: 'users' as const
    },
    {
      title: "Students",
      description: "Total Students", 
      value: 1234,
      format: 'number' as const,
      footer: {
        title: "Siswa",
        description: "Total student users", 
      },
      icon: 'graduation_cap' as const
    },
    {
      title: "Teachers",
      description: "Total Teachers",
      value: 70,
      format: 'number' as const,
      footer: {
        title: "Guru",
        description: "Total teacher users",
      },
      icon: 'user_check' as const
    },
    {
      title: "Admins",
      description: "Total Admins",
      value: 30,
      format: 'number' as const,
      footer: {
        title: "Administrators",
        description: "Total admin users",
      },
      icon: 'shield_check' as const
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

  const canView = hasPermission('/dashboard/users', user.role as UserRole, 'view')
  
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

  return (
    <DashboardWrapper user={user}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* <SectionCards config={sectionCardsConfig} /> */}
            <UsersPageClient 
              tableSchema={tableSchema}
              tableFeatures={tableFeatures}
            />
          </div>
        </div>
      </div>
    </DashboardWrapper>
  )
}