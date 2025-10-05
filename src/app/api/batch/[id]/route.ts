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

    // STEP 2: Check if user has permission to VIEW BATCH
    const canView = hasPermission('/dashboard/batch', user.role as UserRole, 'view')
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and fetch batch from database
    const { id } = await params
    const batch = await prisma.batch_magang.findFirst({
      where: {
        id: id,
        deleted_at: null
      },
      include: {
        // Include related data for detailed view
        periode: {
          select: {
            id: true,
            nama_periode: true,
            tahun_ajaran: true
          }
        },
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
            magang: true,
            pendaftaran_magang: true
          }
        }
      }
    })

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: batch
    })

  } catch (error) {
    console.error('❌ API Error [GET /api/batch/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch details' },
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

    // STEP 2: Check if user has permission to EDIT BATCH
    const canEdit = hasPermission('/dashboard/batch', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if batch exists
    const { id } = await params
    const existingBatch = await prisma.batch_magang.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
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

    // STEP 5: Check for duplicate batch name in the same periode (if name is being changed)
    if (body.nama_batch && body.nama_batch !== existingBatch.nama_batch) {
      const duplicateBatch = await prisma.batch_magang.findFirst({
        where: {
          nama_batch: {
            equals: body.nama_batch.trim(),
            mode: 'insensitive'
          },
          periode_id: body.periode_id || existingBatch.periode_id,
          deleted_at: null,
          id: { not: id }
        }
      })

      if (duplicateBatch) {
        return NextResponse.json(
          { success: false, error: 'Batch name already exists in this periode' },
          { status: 409 }
        )
      }
    }

    // STEP 6: Build update data object
    const updateData: any = {}

    if (body.nama_batch !== undefined) {
      updateData.nama_batch = body.nama_batch.trim()
    }
    if (body.semester !== undefined) {
      updateData.semester = body.semester.trim()
    }
    if (body.kelas_target !== undefined) {
      updateData.kelas_target = body.kelas_target
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
    if (body.kuota_siswa !== undefined) {
      updateData.kuota_siswa = body.kuota_siswa
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // STEP 7: Update batch in database
    const updatedBatch = await prisma.batch_magang.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedBatch,
      message: 'Batch updated successfully'
    })

  } catch (error) {
    console.error('❌ API Error [PUT /api/batch/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update batch' },
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

    // STEP 2: Check if user has permission to EDIT BATCH (restore is an edit operation)
    const canEdit = hasPermission('/dashboard/batch', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if batch exists and is deleted
    const { id } = await params
    const deletedBatch = await prisma.batch_magang.findFirst({
      where: {
        id: id,
        deleted_at: { not: null }
      }
    })

    if (!deletedBatch) {
      return NextResponse.json(
        { success: false, error: 'Deleted batch not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for name conflicts with existing active batch in the same periode
    const nameConflict = await prisma.batch_magang.findFirst({
      where: {
        nama_batch: {
          equals: deletedBatch.nama_batch,
          mode: 'insensitive'
        },
        periode_id: deletedBatch.periode_id,
        deleted_at: null,
        id: { not: id }
      }
    })

    if (nameConflict) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot restore batch: Batch name "${deletedBatch.nama_batch}" already exists in this periode` 
        },
        { status: 409 }
      )
    }

    // STEP 5: Restore batch (set deleted_at to null)
    const restoredBatch = await prisma.batch_magang.update({
      where: { id: id },
      data: { 
        deleted_at: null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: restoredBatch,
      message: 'Batch restored successfully'
    })

  } catch (error) {
    console.error('❌ API Error [PATCH /api/batch/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restore batch' },
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

    // STEP 2: Check if user has permission to DELETE BATCH
    const canDelete = hasPermission('/dashboard/batch', user.role as UserRole, 'delete')
    
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if batch exists
    const { id } = await params
    const existingBatch = await prisma.batch_magang.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for active internships
    const activeInternships = await prisma.magang.count({
      where: {
        batch_id: id,
        status: 'aktif'
      }
    })

    if (activeInternships > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete batch with ${activeInternships} active internship(s)` 
        },
        { status: 400 }
      )
    }

    // STEP 5: Soft delete (set deleted_at timestamp)
    await prisma.batch_magang.update({
      where: { id: id },
      data: { deleted_at: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully'
    })

  } catch (error) {
    console.error('❌ API Error [DELETE /api/batch/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete batch' },
      { status: 500 }
    )
  }
}
