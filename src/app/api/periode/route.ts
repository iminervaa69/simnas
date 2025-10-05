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

    // STEP 2: Check if user has permission to VIEW PERIODE
    const canView = hasPermission('/dashboard/periode', user.role as UserRole, 'view')
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse query parameters for filtering/pagination
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim()
    const status = searchParams.get('status') || ''
    const includeDeleted = searchParams.get('include_deleted') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // STEP 4: Build WHERE clause for filtering
    const whereClause: any = {}
    
    // Handle deleted filter
    if (includeDeleted) {
      whereClause.deleted_at = { not: null }
    } else {
      whereClause.deleted_at = null
    }

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Filter by search term
    if (search) {
      const allowedTextColumns = [
        'nama_periode',
        'tahun_ajaran',
        'deskripsi',
      ] as const

      whereClause.OR = allowedTextColumns.map((col) => ({
        [col]: { contains: search, mode: 'insensitive' }
      }))
    }

    // STEP 5: Execute database queries
    const total = await prisma.periode_magang.count({
      where: whereClause
    })

    // Get paginated results
    const periodeList = await prisma.periode_magang.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        nama_periode: true,
        tahun_ajaran: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status: true,
        deskripsi: true,
        target_siswa: true,
        created_at: true,
        updated_at: true,
        // Include count of batches
        _count: {
          select: {
            batch_magang: true
          }
        }
      }
    })

    // STEP 6: Format response with pagination metadata
    return NextResponse.json({
      success: true,
      data: periodeList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      message: `Found ${periodeList.length} periode records`
    })

  } catch (error) {
    console.error('❌ API Error [GET /api/periode]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch periode data' },
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

    // STEP 2: Check if user has permission to CREATE PERIODE
    const canCreate = hasPermission('/dashboard/periode', user.role as UserRole, 'create')
    
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse and validate request body
    const body = await request.json()
    
    // Required fields validation
    if (!body.nama_periode?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Periode name (nama_periode) is required' },
        { status: 400 }
      )
    }

    if (!body.tahun_ajaran?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Academic year (tahun_ajaran) is required' },
        { status: 400 }
      )
    }

    if (!body.tanggal_mulai) {
      return NextResponse.json(
        { success: false, error: 'Start date (tanggal_mulai) is required' },
        { status: 400 }
      )
    }

    if (!body.tanggal_selesai) {
      return NextResponse.json(
        { success: false, error: 'End date (tanggal_selesai) is required' },
        { status: 400 }
      )
    }

    // Date validation
    const startDate = new Date(body.tanggal_mulai)
    const endDate = new Date(body.tanggal_selesai)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // STEP 4: Check for duplicate academic year
    const existingPeriode = await prisma.periode_magang.findFirst({
      where: {
        tahun_ajaran: {
          equals: body.tahun_ajaran.trim(),
          mode: 'insensitive'
        },
        deleted_at: null
      }
    })

    if (existingPeriode) {
      return NextResponse.json(
        { success: false, error: 'Academic year already exists' },
        { status: 409 }
      )
    }

    // STEP 5: Create new periode in database
    const newPeriode = await prisma.periode_magang.create({
      data: {
        nama_periode: body.nama_periode.trim(),
        tahun_ajaran: body.tahun_ajaran.trim(),
        tanggal_mulai: startDate,
        tanggal_selesai: endDate,
        status: body.status || 'draft',
        deskripsi: body.deskripsi?.trim() || null,
        target_siswa: body.target_siswa || null,
        created_by: user.id
      }
    })

    return NextResponse.json({
      success: true,
      data: newPeriode,
      message: 'Periode created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ API Error [POST /api/periode]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create periode' },
      { status: 500 }
    )
  }
}
