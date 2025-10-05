import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { hasPermission, UserRole } from '@/config/permissions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and fetch periode from database
    const { id } = await params
    const periode = await prisma.periode_magang.findFirst({
      where: {
        id: id,
        deleted_at: null
      },
      include: {
        // Include related data for detailed view
        creator: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        },
        _count: {
          select: {
            batch_magang: true
          }
        }
      }
    })

    if (!periode) {
      return NextResponse.json(
        { success: false, error: 'Periode not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: periode
    })

  } catch (error) {
    console.error('❌ API Error [GET /api/periode/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch periode details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authenticate the user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // STEP 2: Check if user has permission to EDIT PERIODE
    const canEdit = hasPermission('/dashboard/periode', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if periode exists
    const { id } = await params
    const existingPeriode = await prisma.periode_magang.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingPeriode) {
      return NextResponse.json(
        { success: false, error: 'Periode not found' },
        { status: 404 }
      )
    }

    // STEP 4: Parse and validate request body
    const body = await request.json()

    // Date validation if dates are provided
    if (body.tanggal_mulai && body.tanggal_selesai) {
      const startDate = new Date(body.tanggal_mulai)
      const endDate = new Date(body.tanggal_selesai)
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // STEP 5: Check for duplicate academic year (if tahun_ajaran is being changed)
    if (body.tahun_ajaran && body.tahun_ajaran !== existingPeriode.tahun_ajaran) {
      const duplicatePeriode = await prisma.periode_magang.findFirst({
        where: {
          tahun_ajaran: {
            equals: body.tahun_ajaran.trim(),
            mode: 'insensitive'
          },
          deleted_at: null,
          id: { not: id }
        }
      })

      if (duplicatePeriode) {
        return NextResponse.json(
          { success: false, error: 'Academic year already exists' },
          { status: 409 }
        )
      }
    }

    // STEP 6: Build update data object
    const updateData: any = {}

    if (body.nama_periode !== undefined) {
      updateData.nama_periode = body.nama_periode.trim()
    }
    if (body.tahun_ajaran !== undefined) {
      updateData.tahun_ajaran = body.tahun_ajaran.trim()
    }
    if (body.tanggal_mulai !== undefined) {
      updateData.tanggal_mulai = new Date(body.tanggal_mulai)
    }
    if (body.tanggal_selesai !== undefined) {
      updateData.tanggal_selesai = new Date(body.tanggal_selesai)
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.deskripsi !== undefined) {
      updateData.deskripsi = body.deskripsi?.trim() || null
    }
    if (body.target_siswa !== undefined) {
      updateData.target_siswa = body.target_siswa
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // STEP 7: Update periode in database
    const updatedPeriode = await prisma.periode_magang.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedPeriode,
      message: 'Periode updated successfully'
    })

  } catch (error) {
    console.error('❌ API Error [PUT /api/periode/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update periode' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authenticate the user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // STEP 2: Check if user has permission to EDIT PERIODE (restore is an edit operation)
    const canEdit = hasPermission('/dashboard/periode', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if periode exists and is deleted
    const { id } = await params
    const deletedPeriode = await prisma.periode_magang.findFirst({
      where: {
        id: id,
        deleted_at: { not: null }
      }
    })

    if (!deletedPeriode) {
      return NextResponse.json(
        { success: false, error: 'Deleted periode not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for academic year conflicts with existing active periode
    const yearConflict = await prisma.periode_magang.findFirst({
      where: {
        tahun_ajaran: {
          equals: deletedPeriode.tahun_ajaran,
          mode: 'insensitive'
        },
        deleted_at: null,
        id: { not: id }
      }
    })

    if (yearConflict) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot restore periode: Academic year "${deletedPeriode.tahun_ajaran}" already exists` 
        },
        { status: 409 }
      )
    }

    // STEP 5: Restore periode (set deleted_at to null)
    const restoredPeriode = await prisma.periode_magang.update({
      where: { id: id },
      data: { 
        deleted_at: null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: restoredPeriode,
      message: 'Periode restored successfully'
    })

  } catch (error) {
    console.error('❌ API Error [PATCH /api/periode/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restore periode' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authenticate the user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // STEP 2: Check if user has permission to DELETE PERIODE
    const canDelete = hasPermission('/dashboard/periode', user.role as UserRole, 'delete')
    
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if periode exists
    const { id } = await params
    const existingPeriode = await prisma.periode_magang.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingPeriode) {
      return NextResponse.json(
        { success: false, error: 'Periode not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for active batches
    const activeBatches = await prisma.batch_magang.count({
      where: {
        periode_id: id,
        status: 'aktif'
      }
    })

    if (activeBatches > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete periode with ${activeBatches} active batch(es)` 
        },
        { status: 400 }
      )
    }

    // STEP 5: Soft delete (set deleted_at timestamp)
    await prisma.periode_magang.update({
      where: { id: id },
      data: { deleted_at: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Periode deleted successfully'
    })

  } catch (error) {
    console.error('❌ API Error [DELETE /api/periode/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete periode' },
      { status: 500 }
    )
  }
}
