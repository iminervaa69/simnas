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

    // STEP 2: Check if user has permission to VIEW BATCH
    const canView = hasPermission('/dashboard/batch', user.role as UserRole, 'view')
    
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
    const periodeId = searchParams.get('periode_id') || ''
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

    // Filter by periode
    if (periodeId && periodeId !== 'all') {
      whereClause.periode_id = periodeId
    }

    // Filter by search term
    if (search) {
      const allowedTextColumns = [
        'nama_batch',
        'semester',
        'deskripsi',
      ] as const

      whereClause.OR = allowedTextColumns.map((col) => ({
        [col]: { contains: search, mode: 'insensitive' }
      }))
    }

    // STEP 5: Execute database queries
    const total = await prisma.batch_magang.count({
      where: whereClause
    })

    // Get paginated results
    const batchList = await prisma.batch_magang.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        nama_batch: true,
        semester: true,
        kelas_target: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status: true,
        deskripsi: true,
        kuota_siswa: true,
        periode_id: true,
        created_at: true,
        updated_at: true,
        // Include periode info
        periode: {
          select: {
            id: true,
            nama_periode: true,
            tahun_ajaran: true
          }
        },
        // Include count of internships
        _count: {
          select: {
            magang: true,
            pendaftaran_magang: true
          }
        }
      }
    })

    // STEP 6: Format response with pagination metadata
    return NextResponse.json({
      success: true,
      data: batchList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      message: `Found ${batchList.length} batch records`
    })

  } catch (error) {
    console.error('❌ API Error [GET /api/batch]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch data' },
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

    // STEP 2: Check if user has permission to CREATE BATCH
    const canCreate = hasPermission('/dashboard/batch', user.role as UserRole, 'create')
    
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Parse and validate request body
    const body = await request.json()
    
    // Required fields validation
    if (!body.nama_batch?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Batch name (nama_batch) is required' },
        { status: 400 }
      )
    }

    if (!body.periode_id?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Periode ID (periode_id) is required' },
        { status: 400 }
      )
    }

    if (!body.semester?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Semester is required' },
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

    // STEP 4: Verify periode exists and is active
    const periode = await prisma.periode_magang.findFirst({
      where: {
        id: body.periode_id,
        deleted_at: null
      }
    })

    if (!periode) {
      return NextResponse.json(
        { success: false, error: 'Periode not found' },
        { status: 404 }
      )
    }

    // STEP 5: Check for duplicate batch name in the same periode
    const existingBatch = await prisma.batch_magang.findFirst({
      where: {
        nama_batch: {
          equals: body.nama_batch.trim(),
          mode: 'insensitive'
        },
        periode_id: body.periode_id,
        deleted_at: null
      }
    })

    if (existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch name already exists in this periode' },
        { status: 409 }
      )
    }

    // STEP 6: Create new batch in database
    const newBatch = await prisma.batch_magang.create({
      data: {
        nama_batch: body.nama_batch.trim(),
        periode_id: body.periode_id,
        semester: body.semester.trim(),
        kelas_target: body.kelas_target || [],
        tanggal_mulai: startDate,
        tanggal_selesai: endDate,
        status: body.status || 'draft',
        deskripsi: body.deskripsi?.trim() || null,
        kuota_siswa: body.kuota_siswa || null,
        created_by: user.id
      }
    })

    return NextResponse.json({
      success: true,
      data: newBatch,
      message: 'Batch created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ API Error [POST /api/batch]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create batch' },
      { status: 500 }
    )
  }
}
