"use client"

import * as React from "react"
import { IconEye, IconEdit, IconTrash, IconDotsVertical, IconRestore } from "@tabler/icons-react"
import { toast } from "sonner"

import { DataTable, TableSchema, TableFeatures } from "@/components/data-table"
import { DetailEditForm } from "@/components/detail-edit-form"
import { useGlobalTabs, TabItem } from "@/components/global-tab-sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"

type DataRow = Record<string, unknown> & { id: number | string }

interface UsersPageClientProps {
  tableSchema: TableSchema
  tableFeatures: TableFeatures
}

export function UsersPageClient({ tableSchema, tableFeatures }: UsersPageClientProps) {
  const [activeData, setActiveData] = React.useState<DataRow[]>([])
  const [deletedData, setDeletedData] = React.useState<DataRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedItem, setSelectedItem] = React.useState<DataRow | null>(null)
  const [showDeleted, setShowDeleted] = React.useState(false)
  const { addTab, openTab, updateTab, removeTab, openTabs, activeTabId, isSheetOpen } = useGlobalTabs()
  const [mode, setMode] = React.useState<'view' | 'edit'>('view')
  const [draftById, setDraftById] = React.useState<Record<string, DataRow>>({})
  const isMobile = useIsMobile()

  // Current data based on toggle state
  const data = showDeleted ? deletedData : activeData

  // Load drafts from cookies
  React.useEffect(() => {
    try {
      const raw = document.cookie.split('; ').find((c) => c.startsWith('userDrafts='))?.split('=')[1]
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw))
        setDraftById(parsed || {})
      }
    } catch {}
  }, [])

  // Persist drafts to cookies
  React.useEffect(() => {
    try {
      document.cookie = `userDrafts=${encodeURIComponent(JSON.stringify(draftById))}; path=/; max-age=${60 * 60 * 24 * 7}`
    } catch {}
  }, [draftById])

  // Fetch active users data
  const fetchActiveData = React.useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (result.success) {
        setActiveData(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch active users data')
      }
    } catch (error) {
      toast.error('Failed to fetch active users data')
      console.error('Error fetching active data:', error)
    }
  }, [])

  // Fetch deleted users data
  const fetchDeletedData = React.useCallback(async () => {
    try {
      const response = await fetch('/api/users?include_deleted=true')
      const result = await response.json()
      
      if (result.success) {
        setDeletedData(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch deleted users data')
      }
    } catch (error) {
      toast.error('Failed to fetch deleted users data')
      console.error('Error fetching deleted data:', error)
    }
  }, [])

  // Fetch all data on component mount
  const fetchAllData = React.useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchActiveData(), fetchDeletedData()])
    } finally {
      setLoading(false)
    }
  }, [fetchActiveData, fetchDeletedData])

  // Load data on component mount
  React.useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Refresh data when switch toggles
  React.useEffect(() => {
    if (showDeleted) {
      fetchDeletedData()
    } else {
      fetchActiveData()
    }
  }, [showDeleted, fetchActiveData, fetchDeletedData])

  // Handle save from DetailEditForm (for edit mode)
  const handleSave = React.useCallback(async (updatedItem: DataRow) => {
    try {
      const response = await fetch(`/api/users/${updatedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh data to get the latest from server
        if (showDeleted) {
          fetchDeletedData()
        } else {
          fetchActiveData()
        }
        // Update tab to remove unsaved changes indicator
        updateTab(String(updatedItem.id), { hasUnsavedChanges: false, data: result.data })
        toast.success('User updated successfully')
      } else {
        toast.error(result.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('Failed to update user')
      console.error('Error updating user:', error)
    }
  }, [updateTab, showDeleted, fetchActiveData, fetchDeletedData])

  // Handle create new user
  const handleCreate = React.useCallback(async (newItem: DataRow) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh data to get the latest from server
        if (showDeleted) {
          fetchDeletedData()
        } else {
          fetchActiveData()
        }
        toast.success('User created successfully')
        
        // Close the add tab
        removeTab('add-user')
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Failed to create user')
      console.error('Error creating user:', error)
    }
  }, [removeTab, showDeleted, fetchActiveData, fetchDeletedData])

  // Listen for custom events from the forms in tabs
  React.useEffect(() => {
    const handleUserCreate = (event: CustomEvent) => {
      handleCreate(event.detail)
    }

    const handleUserUpdate = (event: CustomEvent) => {
      handleSave(event.detail)
    }

    window.addEventListener('userCreate', handleUserCreate as EventListener)
    window.addEventListener('userUpdate', handleUserUpdate as EventListener)

    return () => {
      window.removeEventListener('userCreate', handleUserCreate as EventListener)
      window.removeEventListener('userUpdate', handleUserUpdate as EventListener)
    }
  }, [handleCreate, handleSave])

  // Handle opening add form
  const handleAddNew = () => {
    const addTabId = 'add-user'
    const tabItem: TabItem = {
      id: addTabId,
      title: 'Add New User',
      type: 'user',
      data: null,
      schema: tableSchema,
      isEditing: true,
      hasUnsavedChanges: false
    }
    addTab(tabItem)
    openTab(addTabId)
  }

  // Listen for custom events from the forms in tabs
  React.useEffect(() => {
    const handleUserCreate = async (event: CustomEvent) => {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event.detail),
        })

        const result = await response.json()

        if (result.success) {
          // Refresh data to get the latest from server
          if (showDeleted) {
            fetchDeletedData()
          } else {
            fetchActiveData()
          }
          toast.success('User created successfully')
          
          // Close the add tab
          removeTab('add-user')
        } else {
          toast.error(result.error || 'Failed to create user')
        }
      } catch (error) {
        toast.error('Failed to create user')
        console.error('Error creating user:', error)
      }
    }

    const handleUserUpdate = async (event: CustomEvent) => {
      try {
        const response = await fetch(`/api/users/${event.detail.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event.detail),
        })

        const result = await response.json()

        if (result.success) {
          // Refresh data to get the latest from server
          if (showDeleted) {
            fetchDeletedData()
          } else {
            fetchActiveData()
          }
          // Update tab to remove unsaved changes indicator
          updateTab(String(event.detail.id), { hasUnsavedChanges: false, data: result.data })
          toast.success('User updated successfully')
        } else {
          toast.error(result.error || 'Failed to update user')
        }
      } catch (error) {
        toast.error('Failed to update user')
        console.error('Error updating user:', error)
      }
    }

    window.addEventListener('userCreate', handleUserCreate as unknown as EventListener)
    window.addEventListener('userUpdate', handleUserUpdate as unknown as EventListener)

    return () => {
      window.removeEventListener('userCreate', handleUserCreate as unknown as EventListener)
      window.removeEventListener('userUpdate', handleUserUpdate as unknown as EventListener)
    }
  }, [updateTab, removeTab])

  // Handle delete
  const handleDelete = async (item: DataRow) => {
    const userName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${item.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Remove from active data
        setActiveData(prev => prev.filter(d => d.id !== item.id))
        toast.success('User deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Failed to delete user')
      console.error('Error deleting user:', error)
    }
  }

  // Handle restore
  const handleRestore = async (item: DataRow) => {
    const userName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email
    if (!confirm(`Are you sure you want to restore user "${userName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${item.id}`, {
        method: 'PATCH',
      })

      const result = await response.json()

      if (result.success) {
        // Remove from deleted data and add to active data
        setDeletedData(prev => prev.filter(d => d.id !== item.id))
        setActiveData(prev => [result.data, ...prev])
        toast.success('User restored successfully')
      } else {
        toast.error(result.error || 'Failed to restore user')
      }
    } catch (error) {
      toast.error('Failed to restore user')
      console.error('Error restoring user:', error)
    }
  }

  // Custom actions column for the data table
  const customTableFeatures = {
    ...tableFeatures,
    enableActions: true,
    customActions: (row: DataRow) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => {
            const id = String(row.id)
            const tabItem: TabItem = {
              id,
              title: String(row.email || 'User'),
              type: 'user',
              data: row,
              schema: tableSchema,
              isEditing: false,
              hasUnsavedChanges: false
            }
            addTab(tabItem)
            openTab(id)
            setSelectedItem(row)
            setMode('view')
          }}>
            <IconEye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {!showDeleted && (
          <DropdownMenuItem onClick={() => {
              const id = String(row.id)
              const tabItem: TabItem = {
                id,
                title: String(row.email || 'User'),
                type: 'user',
                data: row,
                schema: tableSchema,
                isEditing: true,
                hasUnsavedChanges: false
              }
              addTab(tabItem)
              openTab(id)
            setSelectedItem(row)
              setMode('edit')
          }}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {showDeleted ? (
            <DropdownMenuItem 
              onClick={() => handleRestore(row)}
              className="text-green-600"
            >
              <IconRestore className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
          ) : (
          <DropdownMenuItem 
            onClick={() => handleDelete(row)}
            className="text-red-600"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading users data...</div>
      </div>
    )
  }

  const side = 'right'

  function getItemById(id: string): DataRow | undefined {
    const found = data.find((d) => String(d.id) === id)
    return found ? (draftById[id] || found) : undefined
  }

  function handleActivateTab(id: string) {
    const item = data.find((d) => String(d.id) === id)
    if (item) setSelectedItem(item)
  }

  function handleCloseTab(id: string) {
    setSelectedItem(null)
  }

  return (
      <DataTable 
        data={data} 
        schema={tableSchema}
      features={{
        ...customTableFeatures,
        enableShowDeleted: true,
        showDeleted: showDeleted,
        onShowDeletedChange: setShowDeleted
      }}
      onAddItem={!showDeleted ? handleAddNew : undefined}
    />
  )
}
