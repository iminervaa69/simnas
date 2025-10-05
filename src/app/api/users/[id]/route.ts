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

    // STEP 2: Check if user has permission to VIEW USERS
    const canView = hasPermission('/dashboard/users', user.role as UserRole, 'view')
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and fetch user from database
    const { id } = await params
    const userData = await prisma.users.findFirst({
      where: {
        id: id,
        deleted_at: null
      },
      include: {
        // Include profile data
        siswa_profile: true,
        guru_profile: true,
        // Include related counts
        _count: {
          select: {
            magang_siswa: true,
            magang_guru: true,
            pendaftaran_magang: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userData
    })

  } catch (error) {
    console.error('❌ API Error [GET /api/users/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user details' },
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

    // STEP 2: Check if user has permission to EDIT USERS
    const canEdit = hasPermission('/dashboard/users', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if user exists
    const { id } = await params
    const existingUser = await prisma.users.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // STEP 4: Parse and validate request body
    const body = await request.json()

    // Validate if provided
    if (body.email !== undefined && !body.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email cannot be empty' },
        { status: 400 }
      )
    }

    // STEP 5: Check for duplicate email (if email is being changed)
    if (body.email && body.email !== existingUser.email) {
      const duplicateUser = await prisma.users.findFirst({
        where: {
          email: {
            equals: body.email.trim(),
            mode: 'insensitive'
          },
          deleted_at: null,
          id: { not: id }
        }
      })

      if (duplicateUser) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    }

    // STEP 6: Build update data object (only include provided fields)
    const updateData: any = {}

    if (body.email !== undefined) {
      updateData.email = body.email.trim()
    }
    if (body.first_name !== undefined) {
      updateData.first_name = body.first_name?.trim() || null
    }
    if (body.last_name !== undefined) {
      updateData.last_name = body.last_name?.trim() || null
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null
    }
    if (body.role !== undefined) {
      updateData.role = body.role
    }
    if (body.is_verified !== undefined) {
      updateData.is_verified = body.is_verified
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // STEP 7: Update user in database
    const updatedUser = await prisma.users.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
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

    // STEP 2: Check if user has permission to EDIT USERS (restore is an edit operation)
    const canEdit = hasPermission('/dashboard/users', user.role as UserRole, 'edit')
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if user exists and is deleted
    const { id } = await params
    const deletedUser = await prisma.users.findFirst({
      where: {
        id: id,
        deleted_at: { not: null }
      }
    })

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'Deleted user not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for email conflicts with existing active users
    const emailConflict = await prisma.users.findFirst({
      where: {
        email: {
          equals: deletedUser.email,
          mode: 'insensitive'
        },
        deleted_at: null,
        id: { not: id }
      }
    })

    if (emailConflict) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot restore user: Email "${deletedUser.email}" already exists` 
        },
        { status: 409 }
      )
    }

    // STEP 5: Restore user (set deleted_at to null)
    const restoredUser = await prisma.users.update({
      where: { id: id },
      data: { 
        deleted_at: null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: restoredUser,
      message: 'User restored successfully'
    })

  } catch (error) {
    console.error('❌ API Error [PATCH /api/users/[id]]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restore user' },
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

    // STEP 2: Check if user has permission to DELETE USERS
    const canDelete = hasPermission('/dashboard/users', user.role as UserRole, 'delete')
    
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // STEP 3: Await params and check if user exists
    const { id } = await params
    const existingUser = await prisma.users.findFirst({
      where: {
        id: id,
        deleted_at: null
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // STEP 4: Check for active internships or registrations
    const activeInternships = await prisma.magang.count({
      where: {
        OR: [
          { siswa_id: id, status: 'aktif' },
          { guru_pembimbing_id: id }
        ]
      }
    })

    const pendingRegistrations = await prisma.pendaftaran_magang.count({
      where: {
        siswa_id: id,
        status: 'menunggu'
      }
    })

    if (activeInternships > 0 || pendingRegistrations > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete user with active internships or pending registrations` 
        },
        { status: 400 }
      )
    }

    // STEP 5: Soft delete (set deleted_at timestamp)
    await prisma.users.update({
      where: { id: id },
      data: { deleted_at: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
