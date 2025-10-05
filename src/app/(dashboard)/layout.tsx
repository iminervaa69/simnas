"use client"

import { GlobalTabProvider, GlobalTabSidebar, useGlobalTabs } from '@/components/global-tab-sidebar'
import { AddForm } from '@/components/add-form'
import { DetailEditForm } from '@/components/detail-edit-form'
import { useIsMobile } from '@/hooks/use-mobile'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { openTabs, activeTabId, isSheetOpen, isPinned, activateTab, removeTab, closeTab, clearAllTabs, openTab, togglePin, updateTab } = useGlobalTabs()
  const isMobile = useIsMobile()

  return (
    <div className={`h-screen bg-background transition-[padding-right] duration-200 flex flex-col ${!isMobile && isPinned ? 'pr-56' : !isMobile ? 'pr-16' : ''}`}>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      
      <GlobalTabSidebar
        openTabs={openTabs}
        activeTabId={activeTabId}
        onActivateTab={activateTab}
        onCloseTab={closeTab}
        onRemoveTab={removeTab}
        onClearAllTabs={clearAllTabs}
        onOpenTab={openTab}
        isPinned={isPinned}
        onTogglePin={togglePin}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={(open) => {
          if (!open) {
            // When sheet is closed, minimize the active tab
            if (activeTabId) {
              closeTab(activeTabId)
            }
          }
        }}
      >
        {/* Tab content will be rendered here based on active tab */}
        {activeTabId && (() => {
          const activeTab = openTabs.find(t => t.id === activeTabId)
          if (!activeTab) return null
          
          // Check if this is an add tab (no data) or edit tab (has data)
          const isAddMode = activeTab.id.startsWith('add-') || !activeTab.data
          
          if (isAddMode) {
            // Add mode - use AddForm
            return (
              <div className="p-6">
                <AddForm
                  schema={activeTab.schema}
                  entityType={activeTab.type}
                  onSave={async (newItem) => {
                    // Dispatch custom event for the specific entity type
                    const event = new CustomEvent(`${activeTab.type}Create`, { detail: newItem })
                    window.dispatchEvent(event)
                  }}
                  onCancel={() => {
                    removeTab(activeTab.id)
                  }}
                  onChange={() => {
                    // Only flag unsaved changes if not already dirty
                    const current = openTabs.find(t => t.id === activeTab.id)
                    if (!current?.hasUnsavedChanges) {
                      updateTab(activeTab.id, { hasUnsavedChanges: true })
                    }
                  }}
                />
              </div>
            )
          } else {
            // Edit mode - use existing DetailEditForm
            return (
              <div className="p-6">
                <DetailEditForm
                  item={activeTab.data}
                  schema={activeTab.schema}
                  initialEditingState={activeTab.isEditing}
                  onSave={async (updatedItem) => {
                    // Dispatch custom event for the specific entity type
                    const event = new CustomEvent(`${activeTab.type}Update`, { detail: updatedItem })
                    window.dispatchEvent(event)
                  }}
                  onCancel={() => {
                    closeTab(activeTab.id)
                  }}
                  onChange={() => {
                    // Only flag unsaved changes if not already dirty
                    const current = openTabs.find(t => t.id === activeTab.id)
                    if (!current?.hasUnsavedChanges) {
                      updateTab(activeTab.id, { hasUnsavedChanges: true })
                    }
                  }}
                />
              </div>
            )
          }
        })()}
      </GlobalTabSidebar>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalTabProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </GlobalTabProvider>
  )
}