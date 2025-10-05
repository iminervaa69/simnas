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

    // STEP 2: Check if user has permission to VIEW DUDI
    const canView = hasPermission('/dashboard/dudi', user.role as UserRole, 'view')
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin or Guru only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse query parameters for filtering/pagination
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim()
    const inParam = (searchParams.get('in') || '').trim()
    const status = searchParams.get('status') || ''
    const includeDeleted = searchParams.get('include_deleted') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // STEP 4: Build WHERE clause for filtering
    const whereClause: any = {}
    
    // Handle deleted filter
    if (includeDeleted) {
      // Show only deleted DUDI
      whereClause.deleted_at = { not: null }
    } else {
      // Show only non-deleted DUDI (default behavior)
      whereClause.deleted_at = null
    }

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Filter by search term, optionally restricted to specific columns via `in`
    if (search) {
      // Only string/text columns allowed here. Do NOT include enum/numeric columns.
      const allowedTextColumns = [
        'nama_perusahaan',
        'penanggung_jawab',
        'alamat',
        'telepon',
        'email',
        'bidang_usaha',
      ] as const

      const requestedCols = inParam
        ? inParam.split(',').map((c) => c.trim()).filter(Boolean)
        : []

      const colsToSearch = requestedCols.length
        ? requestedCols.filter((c) => (allowedTextColumns as readonly string[]).includes(c))
        : ['nama_perusahaan', 'penanggung_jawab']

      if (colsToSearch.length > 0) {
        whereClause.OR = colsToSearch.map((col) => ({
          [col]: { contains: search, mode: 'insensitive' }
        }))
      }
    }

    // STEP 5: Execute database queries
    const total = await prisma.dudi.count({
      where: whereClause
    })

    // Get paginated results
    const dudiList = await prisma.dudi.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        nama_perusahaan: true,
        alamat: true,
        telepon: true,
        email: true,
        penanggung_jawab: true,
        bidang_usaha: true,
        kuota_siswa: true,
        status: true,
        created_at: true,
        updated_at: true,
        // Include count of active internships (useful info)
        _count: {
          select: {
            magang: true // Count all magang records, not just active ones
          }
        }
      }
    })

    // Add active internship count for each DUDI
    const dudiListWithActiveCount = await Promise.all(
      dudiList.map(async (dudi) => {
        try {
          const activeCount = await prisma.magang.count({
            where: {
              dudi_id: dudi.id,
              status: 'aktif'
            }
          })
          return {
            ...dudi,
            _count: {
              ...dudi._count,
              active_magang: activeCount
            }
          }
        } catch (error) {
          // If counting fails, return 0
          return {
            ...dudi,
            _count: {
              ...dudi._count,
              active_magang: 0
            }
          }
        }
      })
    )

    // STEP 6: Format response with pagination metadata
    return NextResponse.json({
      success: true,
      data: dudiListWithActiveCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      message: `Found ${dudiListWithActiveCount.length} DUDI records`
    })

  } catch (error) {
    console.error('❌ DUDI GET API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch DUDI data' },
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

    // STEP 2: Check if user has permission to CREATE DUDI
    // 🔍 According to permissions.ts: create: ['admin']
    const canCreate = hasPermission('/dashboard/dudi', user.role as UserRole, 'create')
    
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse and validate request body
    const body = await request.json()
    
    // Required fields validation
    if (!body.nama_perusahaan?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name (nama_perusahaan) is required' },
        { status: 400 }
      )
    }

    if (!body.alamat?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Address (alamat) is required' },
        { status: 400 }
      )
    }

    if (!body.penanggung_jawab?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Contact person (penanggung_jawab) is required' },
        { status: 400 }
      )
    }

    // Optional field validation
    if (body.kuota_siswa && (isNaN(body.kuota_siswa) || body.kuota_siswa < 1)) {
      return NextResponse.json(
        { success: false, error: 'Student quota (kuota_siswa) must be at least 1' },
        { status: 400 }
      )
    }

    // STEP 4: Check for duplicate company name
    const existingDudi = await prisma.dudi.findFirst({
      where: {
        nama_perusahaan: {
          equals: body.nama_perusahaan.trim(),
          mode: 'insensitive' // Case-insensitive search
        },
        deleted_at: null
      }
    })

    if (existingDudi) {
      return NextResponse.json(
        { success: false, error: 'Company with this name already exists' },
        { status: 409 } // 409 = Conflict
      )
    }

    // STEP 5: Create new DUDI in database
    const newDudi = await prisma.dudi.create({
      data: {
        nama_perusahaan: body.nama_perusahaan.trim(),
        alamat: body.alamat.trim(),
        telepon: body.telepon?.trim() || null,
        email: body.email?.trim() || null,
        penanggung_jawab: body.penanggung_jawab.trim(),
        bidang_usaha: body.bidang_usaha?.trim() || null,
        kuota_siswa: body.kuota_siswa || 1,
        status: 'aktif' // Default status is active
      }
    })

    return NextResponse.json({
      success: true,
      data: newDudi,
      message: 'DUDI created successfully'
    }, { status: 201 }) // 201 = Created

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create DUDI' },
      { status: 500 }
    )
  }
}


