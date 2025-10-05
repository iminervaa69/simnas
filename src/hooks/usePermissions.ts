// src/hooks/usePermissions.ts
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'
import { 
  hasPermission, 
  hasRouteAccess,
  getUserPermissions,
  UserRole, 
  Permission,
  RoleChecks 
} from '@/config/permissions'

export function usePermissions(customPath?: string) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const currentPath = customPath || pathname
  const userRole = user?.role as UserRole
  
  // Check if user has specific permission on current or custom path
  const can = (permission: Permission, path?: string): boolean => {
    if (!userRole) return false
    return hasPermission(path || currentPath, userRole, permission)
  }
  
  // Check if user has specific role(s)
  const is = (role: UserRole | UserRole[]): boolean => {
    if (!userRole) return false
    return Array.isArray(role) ? role.includes(userRole) : userRole === role
  }
  
  // Check if user can access route
  const canAccess = (path?: string): boolean => {
    if (!userRole) return false
    return hasRouteAccess(path || currentPath, userRole)
  }
  
  // Get all permissions for current path
  const getAllPermissions = (path?: string): Permission[] => {
    if (!userRole) return []
    return getUserPermissions(path || currentPath, userRole)
  }
  
  return {
    // General permission checks
    can,
    is,
    canAccess,
    getAllPermissions,
    
    // Common permission shortcuts for current route
    canView: can('view'),
    canCreate: can('create'),
    canEdit: can('edit'),
    canDelete: can('delete'),
    canVerify: can('verify'),
    canApprove: can('approve'),
    
    // Role checks using predefined functions
    isAdmin: userRole ? RoleChecks.isAdmin(userRole) : false,
    isGuru: userRole ? RoleChecks.isGuru(userRole) : false,
    isSiswa: userRole ? RoleChecks.isSiswa(userRole) : false,
    isAdminOrGuru: userRole ? RoleChecks.isAdminOrGuru(userRole) : false,
    isGuruOrSiswa: userRole ? RoleChecks.isGuruOrSiswa(userRole) : false,
    
    userRole,
    user,
    
    currentPath,
    
    canManageUsers: can('view', '/dashboard/users'),
    canManageDudi: can('edit', '/dashboard/dudi'),
    canManageStudents: can('edit', '/dashboard/students'),
    canVerifyJournals: can('verify', '/dashboard/journals'),
    canCreateJournals: can('create', '/dashboard/journals'),
  }
}

export function useDudiPermissions() {
  const permissions = usePermissions('/dashboard/dudi')
  
  return {
    canViewDudi: permissions.canView,
    canCreateDudi: permissions.canCreate,
    canEditDudi: permissions.canEdit,
    canDeleteDudi: permissions.canDelete,
    isReadOnly: !permissions.canCreate && !permissions.canEdit && !permissions.canDelete,
  }
}

export function useStudentPermissions() {
  const permissions = usePermissions('/dashboard/students')
  
  return {
    canViewStudents: permissions.canView,
    canCreateStudent: permissions.canCreate,
    canEditStudent: permissions.canEdit,
    canDeleteStudent: permissions.canDelete,
    canManageStudents: permissions.canCreate || permissions.canEdit || permissions.canDelete,
  }
}

export function useJournalPermissions() {
  const permissions = usePermissions('/dashboard/journals')
  
  return {
    canViewJournals: permissions.canView,
    canCreateJournal: permissions.canCreate,
    canEditJournal: permissions.canEdit,
    canVerifyJournal: permissions.canVerify,
    isStudent: permissions.isSiswa,
    isTeacher: permissions.isGuru,
  }
}