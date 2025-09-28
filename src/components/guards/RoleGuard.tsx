// src/components/guards/RoleGuard.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { hasPermission, hasRouteAccess, UserRole, Permission } from '@/config/permissions'

interface RoleGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  
  // Option 1: Direct role check
  allowedRoles?: UserRole[]
  
  // Option 2: Route-based permission check  
  path?: string
  permission?: Permission
  
  // Option 3: Custom condition
  condition?: (userRole: UserRole | undefined) => boolean
  
  // Option 4: Require authentication only
  requireAuth?: boolean
}

export function RoleGuard({ 
  children, 
  fallback = null,
  allowedRoles,
  path,
  permission = 'view',
  condition,
  requireAuth = false
}: RoleGuardProps) {
  const { user } = useAuth()
  
  // If require auth and no user, show fallback
  if (requireAuth && !user) {
    return <>{fallback}</>
  }
  
  // If no user and no requireAuth flag, assume we need a user for other checks
  if (!user && (allowedRoles || path || condition)) {
    return <>{fallback}</>
  }
  
  // If requireAuth only and we have a user, show content
  if (requireAuth && user && !allowedRoles && !path && !condition) {
    return <>{children}</>
  }
  
  let hasAccess = false
  
  // Check access based on provided criteria
  if (allowedRoles && user) {
    hasAccess = allowedRoles.includes(user.role as UserRole)
  } else if (path && user) {
    hasAccess = hasPermission(path, user.role as UserRole, permission)
  } else if (condition) {
    hasAccess = condition(user?.role as UserRole)
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

export function AdminOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function GuruOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['guru']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function SiswaOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['siswa']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function AdminOrGuru({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'guru']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function GuruOrSiswa({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard allowedRoles={['guru', 'siswa']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function CanCreateDudi({     
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard 
      path="/dashboard/dudi" 
      permission="create" 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function CanEditStudents({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard 
      path="/dashboard/students" 
      permission="edit" 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function CanVerifyJournals({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard 
      path="/dashboard/journals" 
      permission="verify" 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

// Route access guard
export function RequireRouteAccess({ 
  path,
  children, 
  fallback 
}: { 
  path: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const { user } = useAuth()
  
  if (!user) {
    return <>{fallback}</>
  }
  
  const hasAccess = hasRouteAccess(path, user.role as UserRole)
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}