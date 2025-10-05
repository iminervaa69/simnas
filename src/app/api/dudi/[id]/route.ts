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

    // STEP 2: Check if user has permission to VIEW DUDI
    const canView = hasPermission('/dashboard/dudi', user.role as UserRole, 'view')
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and fetch DUDI from database
    const { id } = await params
    const dudi = await prisma.dudi.findFirst({
      where: {
        id: id,
        deleted_at: null
      },
      include: {
        // Include related data for detailed view
        _count: {
          select: {
            magang: true, // Total internships
            pendaftaran_magang: {
              where: { status: 'menunggu' } // Pending applications
            }
          }
        }
      }
    })

    if (!dudi) {
      return NextResponse.json(
        { success: false, error: 'DUDI not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dudi
    })

  } catch (error) {
    console.error('❌ API Error [GET /api/dudi/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch DUDI details' },
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

    // STEP 2: Check if user has permission to EDIT DUDI
    const canEdit = hasPermission('/dashboard/dudi', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if DUDI exists
    const { id } = await params
    const existingDudi = await prisma.dudi.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingDudi) {
      return NextResponse.json(
        { success: false, error: 'DUDI not found' },
        { status: 404 }
      )
    }

    // STEP 4: Parse and validate request body
    const body = await request.json()

    // Validate if provided
    if (body.nama_perusahaan !== undefined && !body.nama_perusahaan?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name cannot be empty' },
        { status: 400 }
      )
    }

    if (body.kuota_siswa !== undefined && (isNaN(body.kuota_siswa) || body.kuota_siswa < 1)) {
      return NextResponse.json(
        { success: false, error: 'Student quota must be at least 1' },
        { status: 400 }
      )
    }

    // STEP 5: Check for duplicate name (if name is being changed)
    if (body.nama_perusahaan && body.nama_perusahaan !== existingDudi.nama_perusahaan) {
      const duplicateDudi = await prisma.dudi.findFirst({
        where: {
          nama_perusahaan: {
            equals: body.nama_perusahaan.trim(),
            mode: 'insensitive'
          },
          deleted_at: null,
          id: { not: id }
        }
      })

      if (duplicateDudi) {
        return NextResponse.json(
          { success: false, error: 'Company with this name already exists' },
          { status: 409 }
        )
      }
    }

    // STEP 6: Build update data object (only include provided fields)
    const updateData: any = {}

    if (body.nama_perusahaan !== undefined) {
      updateData.nama_perusahaan = body.nama_perusahaan.trim()
    }
    if (body.alamat !== undefined) {
      updateData.alamat = body.alamat.trim()
    }
    if (body.telepon !== undefined) {
      updateData.telepon = body.telepon?.trim() || null
    }
    if (body.email !== undefined) {
      updateData.email = body.email?.trim() || null
    }
    if (body.penanggung_jawab !== undefined) {
      updateData.penanggung_jawab = body.penanggung_jawab.trim()
    }
    if (body.bidang_usaha !== undefined) {
      updateData.bidang_usaha = body.bidang_usaha?.trim() || null
    }
    if (body.kuota_siswa !== undefined) {
      updateData.kuota_siswa = body.kuota_siswa
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // STEP 7: Update DUDI in database
    const updatedDudi = await prisma.dudi.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedDudi,
      message: 'DUDI updated successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update DUDI' },
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

    // STEP 2: Check if user has permission to EDIT DUDI (restore is an edit operation)
    const canEdit = hasPermission('/dashboard/dudi', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if DUDI exists and is deleted
    const { id } = await params
    const deletedDudi = await prisma.dudi.findFirst({
      where: {
        id: id,
        deleted_at: { not: null }
      }
    })

    if (!deletedDudi) {
      return NextResponse.json(
        { success: false, error: 'Deleted DUDI not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for name conflicts with existing active DUDI
    const nameConflict = await prisma.dudi.findFirst({
      where: {
        nama_perusahaan: {
          equals: deletedDudi.nama_perusahaan,
          mode: 'insensitive'
        },
        deleted_at: null,
        id: { not: id }
      }
    })

    if (nameConflict) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot restore DUDI: Company name "${deletedDudi.nama_perusahaan}" already exists` 
        },
        { status: 409 }
      )
    }

    // STEP 5: Restore DUDI (set deleted_at to null)
    const restoredDudi = await prisma.dudi.update({
      where: { id: id },
      data: { 
        deleted_at: null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: restoredDudi,
      message: 'DUDI restored successfully'
    })

  } catch (error) {
    console.error('❌ API Error [PATCH /api/dudi/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restore DUDI' },
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

    // STEP 2: Check if user has permission to DELETE DUDI
    const canDelete = hasPermission('/dashboard/dudi', user.role as UserRole, 'delete')
    
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if DUDI exists
    const { id } = await params
    const existingDudi = await prisma.dudi.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingDudi) {
      return NextResponse.json(
        { success: false, error: 'DUDI not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for active internships
    const activeInternships = await prisma.magang.count({
      where: {
        dudi_id: id,
        status: 'aktif'
      }
    })

    if (activeInternships > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete DUDI with ${activeInternships} active internship(s)` 
        },
        { status: 400 }
      )
    }

    // STEP 5: Soft delete (set deleted_at timestamp)
    await prisma.dudi.update({
      where: { id: id },
      data: { deleted_at: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'DUDI deleted successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete DUDI' },
      { status: 500 }
    )
  }
}