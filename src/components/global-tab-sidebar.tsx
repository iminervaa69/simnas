"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, CheckCircle, Loader2, Pin, PinOff, PanelRight, Building2, User, GraduationCap, FileText, Calendar, Layers } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/hooks/use-mobile'

export interface TabItem {
  id: string
  title: string
  type: 'dudi' | 'user' | 'student' | 'periode' | 'batch' | 'other'
  data?: any
  schema?: any
  isEditing?: boolean
  hasUnsavedChanges?: boolean
  isMinimized?: boolean
}

interface GlobalTabSidebarProps {
  openTabs: TabItem[]
  activeTabId: string | null
  onActivateTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onRemoveTab: (tabId: string) => void
  onClearAllTabs: () => void
  onOpenTab: (tabId: string) => void
  isPinned: boolean
  onTogglePin: () => void
  isSheetOpen: boolean
  onSheetOpenChange: (open: boolean) => void
  children?: React.ReactNode
}

export function GlobalTabSidebar({
  openTabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onRemoveTab,
  onClearAllTabs,
  onOpenTab,
  isPinned,
  onTogglePin,
  isSheetOpen,
  onSheetOpenChange,
  children
}: GlobalTabSidebarProps) {
  const isMobile = useIsMobile()
  const getTabIcon = (type: string) => {
    switch (type) {
      case 'dudi':
        return <Building2 className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'student':
        return <GraduationCap className="h-4 w-4" />
      case 'periode':
        return <Calendar className="h-4 w-4" />
      case 'batch':
        return <Layers className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTabColor = (type: string) => {
    switch (type) {
      case 'dudi':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'user':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'student':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'periode':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'batch':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  // Don't render the right sidebar on mobile
  if (isMobile) {
    return (
      <>
        {/* Global Sheet for tab content - still available on mobile */}
        <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
          <SheetContent side="right" className="w-full sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>Tab Details</SheetTitle>
              <SheetDescription>View and edit details for the selected item</SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      {/* Right-side minimal vertical tabs bar (desktop only) */}
      <div className={`fixed inset-y-0 right-0 z-[100] group ${isPinned || isSheetOpen ? 'w-56' : 'w-15 hover:w-56'}`}>
        <div className="absolute right-0 top-0 h-full transition-[width] duration-200 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-l shadow-sm">
          <div className="flex h-12 items-center justify-between pl-2">
            <button
              className={`text-muted-foreground transition-opacity hover:text-foreground ${isPinned || isSheetOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={onTogglePin}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </button>
            {isSheetOpen ? <div className="flex items-center mr-4">
              <PanelRight className="h-4 w-4 text-muted-foreground"/>
            </div> : <div className="flex items-center mr-4">
              <PanelRight className="h-4 w-4 text-muted-foreground"/>
            </div>}
          </div>
          <div className="px-2 py-2 h-[calc(100%-3rem)]">
            <ScrollArea className="h-full">
              {openTabs.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  No tabs open
                </div>
              ) : (
                openTabs.map((tab) => {
                const isActive = activeTabId === tab.id
                const initials = (tab.title || '').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                return (
                  <div 
                    key={tab.id} 
                    className={`group/item flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer ${isActive ? 'bg-muted' : 'hover:bg-muted/60'} ${tab.isMinimized ? 'opacity-60' : ''}`} 
                    onClick={() => { 
                      if (tab.isMinimized) {
                        // Restore minimized tab
                        onActivateTab(tab.id); 
                        onOpenTab(tab.id)
                      } else {
                        onActivateTab(tab.id); 
                        onOpenTab(tab.id)
                      }
                    }}
                    title={`${tab.title}${tab.isMinimized ? ' (Minimized)' : ''}`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${getTabColor(tab.type)}`}>
                      {getTabIcon(tab.type)}
                    </div>
                    <div className={`min-w-0 flex-1 truncate text-sm transition-opacity ${isPinned || isSheetOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {tab.title}
                    </div>
                    <div className={`flex items-center gap-1 transition-opacity ${isPinned || isSheetOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {tab.hasUnsavedChanges && (
                        <div className="w-2 h-2 rounded-full bg-orange-500" title="Unsaved changes" />
                      )}
                      <button 
                        className="hover:text-destructive" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onRemoveTab(tab.id) 
                        }}
                        title="Remove tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Global Sheet for tab content */}
      <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-3xl [&>button]:hidden"
          style={{ right: (isPinned || isSheetOpen) ? '14rem' : '4rem' }}
        >
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Tab Details</SheetTitle>
                <SheetDescription>View and edit details for the selected item</SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeTabId) {
                    onCloseTab(activeTabId) 
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="h-full">
            <Separator />
            <div className="flex-1">
              {children}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface GlobalTabContextType {
  openTabs: TabItem[]
  activeTabId: string | null
  isSheetOpen: boolean
  isPinned: boolean
  addTab: (tab: TabItem) => void
  removeTab: (tabId: string) => void
  activateTab: (tabId: string) => void
  openTab: (tabId: string) => void
  togglePin: () => void
  clearAllTabs: () => void
  updateTab: (tabId: string, updates: Partial<TabItem>) => void
  closeTab: (tabId: string) => void
  minimizeTab: (tabId: string) => void
  restoreTab: (tabId: string) => void
  clearTabsCookies: () => void
}

const GlobalTabContext = React.createContext<GlobalTabContextType | undefined>(undefined)

export function GlobalTabProvider({ children }: { children: React.ReactNode }) {
  const [openTabs, setOpenTabs] = React.useState<TabItem[]>([])
  const [activeTabId, setActiveTabId] = React.useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [isPinned, setIsPinned] = React.useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [pendingTabAction, setPendingTabAction] = React.useState<{
    tabId: string
    action: 'close' | 'remove'
    keepOpen?: boolean
  } | null>(null)

  // Cookie management functions
  const saveTabsToCookies = React.useCallback((tabs: TabItem[]) => {
    try {
      const tabsData = {
        tabs: tabs.map(tab => ({
          id: tab.id,
          title: tab.title,
          type: tab.type,
          data: tab.data,
          schema: tab.schema,
          isEditing: tab.isEditing,
          hasUnsavedChanges: tab.hasUnsavedChanges,
          isMinimized: tab.isMinimized
        })),
        activeTabId,
        isPinned
      }
      document.cookie = `globalTabs=${encodeURIComponent(JSON.stringify(tabsData))}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
    } catch (error) {
      console.error('Failed to save tabs to cookies:', error)
    }
  }, [activeTabId, isPinned])

  const loadTabsFromCookies = React.useCallback(() => {
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('globalTabs='))
        ?.split('=')[1]
      
      if (cookieValue) {
        const decoded = decodeURIComponent(cookieValue)
        const tabsData = JSON.parse(decoded)
        
        if (tabsData.tabs && Array.isArray(tabsData.tabs)) {
          setOpenTabs(tabsData.tabs)
          if (tabsData.activeTabId) {
            setActiveTabId(tabsData.activeTabId)
          }
          if (typeof tabsData.isPinned === 'boolean') {
            setIsPinned(tabsData.isPinned)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load tabs from cookies:', error)
    }
  }, [])

  const clearTabsCookies = React.useCallback(() => {
    try {
      document.cookie = 'globalTabs=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Clear all form draft cookies
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const [name] = cookie.split('=')
        if (name.trim().startsWith('formDraft_')) {
          document.cookie = `${name.trim()}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      })
    } catch (error) {
      console.error('Failed to clear tabs cookies:', error)
    }
  }, [])

  // Check for logout flag and clear cookies
  React.useEffect(() => {
    const checkLogoutFlag = () => {
      try {
        const clearFlag = document.cookie
          .split('; ')
          .find(row => row.startsWith('clearTabCookies='))
          ?.split('=')[1]
        
        if (clearFlag === 'true') {
          clearTabsCookies()
          // Clear the flag
          document.cookie = 'clearTabCookies=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      } catch (error) {
        console.error('Failed to check logout flag:', error)
      }
    }
    
    checkLogoutFlag()
  }, [clearTabsCookies])

  // Load tabs from cookies on mount
  React.useEffect(() => {
    loadTabsFromCookies()
  }, [loadTabsFromCookies])

  // Save tabs to cookies whenever tabs change
  React.useEffect(() => {
    if (openTabs.length > 0) {
      saveTabsToCookies(openTabs)
    }
  }, [openTabs, saveTabsToCookies])

  const addTab = React.useCallback((tab: TabItem) => {
    setOpenTabs(prev => {
      // Check if tab already exists
      const existingIndex = prev.findIndex(t => t.id === tab.id)
      if (existingIndex >= 0) {
        // Update existing tab
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], ...tab }
        return updated
      }
      // Add new tab
      return [...prev, tab]
    })
    setActiveTabId(tab.id)
  }, [])

  const removeTab = React.useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId)
      // If we're removing the active tab, switch to another tab or close sheet
      if (activeTabId === tabId) {
        if (filtered.length > 0) {
          setActiveTabId(filtered[filtered.length - 1].id)
        } else {
          setActiveTabId(null)
          setIsSheetOpen(false)
        }
      }
      return filtered
    })
  }, [activeTabId])

  const activateTab = React.useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const openTab = React.useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setIsSheetOpen(true)
  }, [])

  const clearAllTabs = React.useCallback(() => {
    setOpenTabs([])
    setActiveTabId(null)
    setIsSheetOpen(false)
  }, [])

  const updateTab = React.useCallback((tabId: string, updates: Partial<TabItem>) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }, [])

  const togglePin = React.useCallback(() => {
    setIsPinned(prev => !prev)
  }, [])

  const minimizeTab = React.useCallback((tabId: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, isMinimized: true } : tab
    ))
    
    // If we're minimizing the active tab, close the sheet
    if (activeTabId === tabId) {
      setIsSheetOpen(false)
      // Switch to another non-minimized tab if available
      const nonMinimizedTabs = openTabs.filter(t => !t.isMinimized && t.id !== tabId)
      if (nonMinimizedTabs.length > 0) {
        setActiveTabId(nonMinimizedTabs[nonMinimizedTabs.length - 1].id)
      } else {
        setActiveTabId(null)
      }
    }
  }, [activeTabId, openTabs])

  const closeTab = React.useCallback((tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId)
    if (!tab) return

    if (tab.hasUnsavedChanges) {
      // If unsaved changes, just minimize the tab (don't show save dialog)
      minimizeTab(tabId)
    } else {
      // No unsaved changes, remove from tab list completely
      removeTab(tabId)
    }
  }, [openTabs, minimizeTab, removeTab])

  const restoreTab = React.useCallback((tabId: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, isMinimized: false } : tab
    ))
    setActiveTabId(tabId)
    setIsSheetOpen(true)
  }, [])

  const handleSaveDialogConfirm = React.useCallback((keepOpen: boolean = false) => {
    if (!pendingTabAction) return

    const { tabId, action } = pendingTabAction
    
    if (action === 'close') {
      minimizeTab(tabId)
    } else if (action === 'remove') {
      removeTab(tabId)
    }

    // Clear unsaved changes
    updateTab(tabId, { hasUnsavedChanges: false })
    
    // If keepOpen is true and action is close, restore the tab
    if (keepOpen && action === 'close') {
      setTimeout(() => restoreTab(tabId), 100)
    }

    setSaveDialogOpen(false)
    setPendingTabAction(null)
  }, [pendingTabAction, minimizeTab, removeTab, updateTab, restoreTab])

  const handleSaveDialogCancel = React.useCallback(() => {
    setSaveDialogOpen(false)
    setPendingTabAction(null)
  }, [])

  // Override removeTab to check for unsaved changes
  const removeTabWithWarning = React.useCallback((tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId)
    if (!tab) return

    if (tab.hasUnsavedChanges) {
      // Show warning dialog for unsaved changes
      setPendingTabAction({ tabId, action: 'remove' })
      setSaveDialogOpen(true)
    } else {
      // No unsaved changes, proceed with removal
      removeTab(tabId)
    }
  }, [openTabs, removeTab])

  const contextValue: GlobalTabContextType = {
    openTabs,
    activeTabId,
    isSheetOpen,
    isPinned,
    addTab,
    removeTab: removeTabWithWarning,
    activateTab,
    openTab,
    togglePin,
    clearAllTabs,
    updateTab,
    closeTab,
    minimizeTab,
    restoreTab,
    clearTabsCookies
  }

  return (
    <GlobalTabContext.Provider value={contextValue}>
      {children}
      
      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingTabAction?.action === 'remove' ? 'Remove Tab' : 'Close Tab'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTabAction?.action === 'remove' 
                ? 'This tab has unsaved changes. Are you sure you want to remove it? All unsaved changes will be lost.'
                : 'This tab has unsaved changes. What would you like to do?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {pendingTabAction?.action === 'close' && (
            <div className="flex items-center space-x-2 py-4">
              <Checkbox 
                id="keep-open" 
                onCheckedChange={(checked) => {
                  setPendingTabAction(prev => prev ? { ...prev, keepOpen: !!checked } : null)
                }}
              />
              <Label htmlFor="keep-open" className="text-sm">
                Keep tab open after saving
              </Label>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSaveDialogCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSaveDialogConfirm(pendingTabAction?.keepOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pendingTabAction?.action === 'remove' ? 'Remove Tab' : 'Save & Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlobalTabContext.Provider>
  )
}

export function useGlobalTabs() {
  const context = React.useContext(GlobalTabContext)
  if (context === undefined) {
    throw new Error('useGlobalTabs must be used within a GlobalTabProvider')
  }
  return context
}

// Mobile Tab Section Component for Left Sidebar
export function MobileTabSection() {
  const { openTabs, activeTabId, activateTab, removeTab, openTab } = useGlobalTabs()
  
  const getTabIcon = (type: string) => {
    switch (type) {
      case 'dudi':
        return <Building2 className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'student':
        return <GraduationCap className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTabColor = (type: string) => {
    switch (type) {
      case 'dudi':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'user':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'student':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (openTabs.length === 0) {
    return null
  }

  return (
    <div className="px-2 py-2">
      <div className="mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Open Tabs
        </h4>
      </div>
      <div className="space-y-1">
        {openTabs.map((tab) => {
          const isActive = activeTabId === tab.id
          return (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors ${
                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
              onClick={() => { activateTab(tab.id); openTab(tab.id) }}
              title={tab.title}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${getTabColor(tab.type)}`}>
                {getTabIcon(tab.type)}
              </div>
              <div className="min-w-0 flex-1 truncate text-sm">
                {tab.title}
              </div>
              <div className="flex items-center gap-1">
                {tab.hasUnsavedChanges && (
                  <div className="w-2 h-2 rounded-full bg-orange-500" title="Unsaved changes" />
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeTab(tab.id) }}
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
