export type UserRole = 'admin' | 'guru' | 'siswa'
export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'verify' | 'approve'

// Type for simple role-based routes
type SimplePermission = UserRole[]

// Type for detailed permission-based routes
type DetailedPermission = {
  [K in Permission]?: UserRole[]
}

// Union type for route permissions
type RoutePermission = SimplePermission | DetailedPermission

// Main permissions configuration
export const ROUTE_PERMISSIONS = {
  // Dashboard routes - simple permissions
  '/dashboard': ['admin', 'guru', 'siswa'] as UserRole[],
  
  // DUDI Management - detailed permissions
  '/dashboard/dudi': {
    view: ['admin', 'guru', 'siswa'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin']
  } as DetailedPermission,
  
  // User Management - simple permission (admin only)
  '/dashboard/users': ['admin'] as UserRole[],
  
  // Students Management - detailed permissions
  '/dashboard/students': {
    view: ['admin', 'guru'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin']
  } as DetailedPermission,
  
  // Internship Management - detailed permissions
  '/dashboard/internships': {
    view: ['admin', 'guru'],
    create: ['guru'],
    edit: ['guru'],
    approve: ['admin']
  } as DetailedPermission,
  
  // Journal Management - detailed permissions
  '/dashboard/journals': {
    view: ['admin', 'guru', 'siswa'],
    create: ['siswa'],
    verify: ['guru'],
    edit: ['siswa']
  } as DetailedPermission,
  
  // Student-specific routes - simple permissions
  '/dashboard/my-internship': ['siswa'] as UserRole[],
  '/dashboard/profile': ['siswa'] as UserRole[],
  
  // Settings & Reports - simple permissions
  '/dashboard/settings': ['admin'] as UserRole[],
  '/dashboard/reports': ['admin', 'guru'] as UserRole[]
} as const

// Type guard to check if permission config is detailed
function isDetailedPermission(config: RoutePermission): config is DetailedPermission {
  return typeof config === 'object' && !Array.isArray(config)
}

// Type guard to check if permission config is simple
function isSimplePermission(config: RoutePermission): config is SimplePermission {
  return Array.isArray(config)
}

// Helper function to check route access
export function hasRouteAccess(path: string, userRole: UserRole): boolean {
  const routeConfig = ROUTE_PERMISSIONS[path as keyof typeof ROUTE_PERMISSIONS]
  
  if (!routeConfig) return false
  
  if (isSimplePermission(routeConfig)) {
    return routeConfig.includes(userRole)
  }
  
  if (isDetailedPermission(routeConfig)) {
    // For detailed permissions, check 'view' permission by default
    return routeConfig.view?.includes(userRole) || false
  }
  
  return false
}

// Helper function to check specific permission
export function hasPermission(
  path: string, 
  userRole: UserRole, 
  permission: Permission = 'view'
): boolean {
  const routeConfig = ROUTE_PERMISSIONS[path as keyof typeof ROUTE_PERMISSIONS]
  
  if (!routeConfig) return false
  
  if (isSimplePermission(routeConfig)) {
    // For simple permissions, all allowed roles have all permissions
    return routeConfig.includes(userRole)
  }
  
  if (isDetailedPermission(routeConfig)) {
    return routeConfig[permission]?.includes(userRole) || false
  }
  
  return false
}

// Helper function to get all permissions for a user role on a specific path
export function getUserPermissions(path: string, userRole: UserRole): Permission[] {
  const routeConfig = ROUTE_PERMISSIONS[path as keyof typeof ROUTE_PERMISSIONS]
  
  if (!routeConfig) return []
  
  if (isSimplePermission(routeConfig)) {
    // If user has access, they have all permissions
    if (routeConfig.includes(userRole)) {
      return ['view', 'create', 'edit', 'delete', 'verify', 'approve']
    }
    return []
  }
  
  if (isDetailedPermission(routeConfig)) {
    const permissions: Permission[] = []
    
    // Check each permission type
    Object.entries(routeConfig).forEach(([perm, roles]) => {
      if (roles && roles.includes(userRole)) {
        permissions.push(perm as Permission)
      }
    })
    
    return permissions
  }
  
  return []
}

// Helper function to get all accessible routes for a user role
export function getAccessibleRoutes(userRole: UserRole): string[] {
  const accessibleRoutes: string[] = []
  
  Object.entries(ROUTE_PERMISSIONS).forEach(([path, config]) => {
    if (hasRouteAccess(path, userRole)) {
      accessibleRoutes.push(path)
    }
  })
  
  return accessibleRoutes
}

// Predefined role checks for convenience
export const RoleChecks = {
  isAdmin: (role: UserRole) => role === 'admin',
  isGuru: (role: UserRole) => role === 'guru', 
  isSiswa: (role: UserRole) => role === 'siswa',
  isAdminOrGuru: (role: UserRole) => ['admin', 'guru'].includes(role),
  isGuruOrSiswa: (role: UserRole) => ['guru', 'siswa'].includes(role),
} as const