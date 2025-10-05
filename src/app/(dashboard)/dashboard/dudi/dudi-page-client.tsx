"use client"

import * as React from "react"
import { IconEye, IconEdit, IconTrash, IconDotsVertical, IconPlus, IconRestore } from "@tabler/icons-react"
import { toast } from "sonner"

import { DataTable, TableSchema, TableFeatures } from "@/components/data-table"
import { DetailEditForm } from "@/components/detail-edit-form"
import { useGlobalTabs, TabItem } from "@/components/global-tab-sidebar"
import { Button } from "@/components/ui/button"
// Sheet components removed - using global tab system
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Button import removed - using global tab system
import { useIsMobile } from "@/hooks/use-mobile"

type DataRow = Record<string, unknown> & { id: number | string }

interface DudiPageClientProps {
  tableSchema: TableSchema
  tableFeatures: TableFeatures
}

export function DudiPageClient({ tableSchema, tableFeatures }: DudiPageClientProps) {
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
      const raw = document.cookie.split('; ').find((c) => c.startsWith('dudiDrafts='))?.split('=')[1]
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw))
        setDraftById(parsed || {})
      }
    } catch {}
  }, [])

  // Persist drafts to cookies
  React.useEffect(() => {
    try {
      document.cookie = `dudiDrafts=${encodeURIComponent(JSON.stringify(draftById))}; path=/; max-age=${60 * 60 * 24 * 7}`
    } catch {}
  }, [draftById])

  // Fetch active DUDI data
  const fetchActiveData = React.useCallback(async () => {
    try {
      const response = await fetch('/api/dudi')
      const result = await response.json()
      
      if (result.success) {
        setActiveData(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch active DUDI data')
      }
    } catch (error) {
      toast.error('Failed to fetch active DUDI data')
      console.error('Error fetching active data:', error)
    }
  }, [])

  // Fetch deleted DUDI data
  const fetchDeletedData = React.useCallback(async () => {
    try {
      const response = await fetch('/api/dudi?include_deleted=true')
      const result = await response.json()
      
      if (result.success) {
        setDeletedData(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch deleted DUDI data')
      }
    } catch (error) {
      toast.error('Failed to fetch deleted DUDI data')
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
      const response = await fetch(`/api/dudi/${updatedItem.id}`, {
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
        toast.success('DUDI updated successfully')
      } else {
        toast.error(result.error || 'Failed to update DUDI')
      }
    } catch (error) {
      toast.error('Failed to update DUDI')
      console.error('Error updating DUDI:', error)
    }
  }, [updateTab, showDeleted, fetchActiveData, fetchDeletedData])

  // Handle create new DUDI
  const handleCreate = React.useCallback(async (newItem: DataRow) => {
    try {
      const response = await fetch('/api/dudi', {
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
        toast.success('DUDI created successfully')
        
        // Close the add tab
        removeTab('add-dudi')
      } else {
        toast.error(result.error || 'Failed to create DUDI')
      }
    } catch (error) {
      toast.error('Failed to create DUDI')
      console.error('Error creating DUDI:', error)
    }
  }, [removeTab, showDeleted, fetchActiveData, fetchDeletedData])

  // Listen for custom events from the forms in tabs
  React.useEffect(() => {
    const handleDudiCreate = async (event: CustomEvent) => {
      try {
        const response = await fetch('/api/dudi', {
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
          toast.success('DUDI created successfully')
          
          // Close the add tab
          removeTab('add-dudi')
        } else {
          toast.error(result.error || 'Failed to create DUDI')
        }
      } catch (error) {
        toast.error('Failed to create DUDI')
        console.error('Error creating DUDI:', error)
      }
    }

    const handleDudiUpdate = async (event: CustomEvent) => {
      try {
        const response = await fetch(`/api/dudi/${event.detail.id}`, {
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
          toast.success('DUDI updated successfully')
        } else {
          toast.error(result.error || 'Failed to update DUDI')
        }
      } catch (error) {
        toast.error('Failed to update DUDI')
        console.error('Error updating DUDI:', error)
      }
    }

    window.addEventListener('dudiCreate', handleDudiCreate as unknown as EventListener)
    window.addEventListener('dudiUpdate', handleDudiUpdate as unknown as EventListener)

    return () => {
      window.removeEventListener('dudiCreate', handleDudiCreate as unknown as EventListener)
      window.removeEventListener('dudiUpdate', handleDudiUpdate as unknown as EventListener)
    }
  }, [updateTab, removeTab])

  // Client-side filtering only; no server-side search hook

  // Handle opening add form
  const handleAddNew = () => {
    const addTabId = 'add-dudi'
    const tabItem: TabItem = {
      id: addTabId,
      title: 'Add New DUDI',
      type: 'dudi',
      data: null,
      schema: tableSchema,
      isEditing: true,
      hasUnsavedChanges: false
    }
    addTab(tabItem)
    openTab(addTabId)
  }

  // Handle delete
  const handleDelete = async (item: DataRow) => {
    if (!confirm(`Are you sure you want to delete "${item.nama_perusahaan}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dudi/${item.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Remove from active data
        setActiveData(prev => prev.filter(d => d.id !== item.id))
        toast.success('DUDI deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete DUDI')
      }
    } catch (error) {
      toast.error('Failed to delete DUDI')
      console.error('Error deleting DUDI:', error)
    }
  }

  // Handle restore
  const handleRestore = async (item: DataRow) => {
    if (!confirm(`Are you sure you want to restore "${item.nama_perusahaan}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dudi/${item.id}`, {
        method: 'PATCH',
      })

      const result = await response.json()

      if (result.success) {
        // Remove from deleted data and add to active data
        setDeletedData(prev => prev.filter(d => d.id !== item.id))
        setActiveData(prev => [result.data, ...prev])
        toast.success('DUDI restored successfully')
      } else {
        toast.error(result.error || 'Failed to restore DUDI')
      }
    } catch (error) {
      toast.error('Failed to restore DUDI')
      console.error('Error restoring DUDI:', error)
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
              title: String(row.nama_perusahaan || 'DUDI'),
              type: 'dudi',
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
                title: String(row.nama_perusahaan || 'DUDI'),
                type: 'dudi',
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
        <div className="text-muted-foreground">Loading DUDI data...</div>
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
