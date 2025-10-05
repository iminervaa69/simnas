import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { hasPermission, UserRole } from '@/config/permissions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // STEP 1: Authenticate the user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // STEP 2: Check if user has permission to VIEW USERS
    const canView = hasPermission('/dashboard/users', user.role as UserRole, 'view')
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse query parameters for filtering/pagination
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const includeDeleted = searchParams.get('include_deleted') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // STEP 4: Build WHERE clause for filtering
    const whereClause: any = {}
    
    // Handle deleted filter
    if (includeDeleted) {
      whereClause.deleted_at = { not: null }
    } else {
      whereClause.deleted_at = null
    }

    // Filter by role
    if (role && role !== 'all') {
      whereClause.role = role
    }

    // Filter by search term (email, first_name, last_name)
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } }
      ]
    }

    // STEP 5: Execute database queries
    const total = await prisma.users.count({
      where: whereClause
    })

    // Get paginated results
    const usersList = await prisma.users.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        phone: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
        // Include profile information
        siswa_profile: {
          select: {
            nis: true,
            kelas: true,
            jurusan: true,
            tahun_ajaran: true
          }
        },
        guru_profile: {
          select: {
            nip: true,
            mata_pelajaran: true,
            is_active: true
          }
        }
      }
    })

    // STEP 6: Format response with pagination metadata
    return NextResponse.json({
      success: true,
      data: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      message: `Found ${usersList.length} user records`
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate the user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // STEP 2: Check if user has permission to CREATE USERS
    const canCreate = hasPermission('/dashboard/users', user.role as UserRole, 'create')
    
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse and validate request body
    const body = await request.json()
    
    // Required fields validation
    if (!body.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!body.role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      )
    }

    // STEP 4: Check for duplicate email
    const existingUser = await prisma.users.findFirst({
      where: {
        email: {
          equals: body.email.trim(),
          mode: 'insensitive'
        },
        deleted_at: null
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // STEP 5: Create new user in database
    const newUser = await prisma.users.create({
      data: {
        email: body.email.trim(),
        password_hash: body.password_hash || 'temp_password', // Should be hashed
        role: body.role,
        first_name: body.first_name?.trim() || null,
        last_name: body.last_name?.trim() || null,
        phone: body.phone?.trim() || null,
        is_verified: body.is_verified || false
      }
    })

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
