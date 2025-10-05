"use client"

import * as React from "react"
import { IconEdit, IconEye, IconX } from "@tabler/icons-react"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { FieldSchema, TableSchema } from "./data-table"

type DataRow = Record<string, any> & { id: number | string }

interface DetailEditFormProps {
  item: DataRow
  schema: TableSchema
  onSave?: (updatedItem: DataRow) => void
  onCancel?: () => void
  onChange?: (updatedItem: DataRow) => void
  title?: string
  description?: string
  className?: string
  initialEditingState?: boolean
}

export function DetailEditForm({
  item,
  schema,
  onSave,
  onCancel,
  onChange,
  title,
  description,
  className = "",
  initialEditingState = false,
}: DetailEditFormProps) {
  const [isEditing, setIsEditing] = React.useState(initialEditingState)
  const [formData, setFormData] = React.useState<DataRow>(item)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Reset form data when item changes
  React.useEffect(() => {
    setFormData(item)
    setHasChanges(false)
  }, [item])

  // Check for changes
  React.useEffect(() => {
    const changed = Object.keys(schema).some(key => {
      const currentValue = formData[key]
      const originalValue = item[key]
      return currentValue !== originalValue
    })
    setHasChanges(changed)
  }, [formData, item, schema])

  const handleInputChange = React.useCallback((key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value }
      
      // Use setTimeout to defer the onChange call to avoid setState during render
      setTimeout(() => {
        if (onChange) {
          onChange(next)
        }
      }, 0)
      
      return next
    })
  }, [onChange])

  // Save form data to cookies when there are unsaved changes
  React.useEffect(() => {
    if (hasChanges && formData.id) {
      try {
        const cookieKey = `formDraft_${formData.id}`
        document.cookie = `${cookieKey}=${encodeURIComponent(JSON.stringify(formData))}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
      } catch (error) {
        console.error('Failed to save form draft to cookies:', error)
      }
    }
  }, [formData, hasChanges])

  // Load form data from cookies on mount
  React.useEffect(() => {
    if (item.id) {
      try {
        const cookieKey = `formDraft_${item.id}`
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${cookieKey}=`))
          ?.split('=')[1]
        
        if (cookieValue) {
          const decoded = decodeURIComponent(cookieValue)
          const draftData = JSON.parse(decoded)
          if (draftData && Object.keys(draftData).length > 0) {
            setFormData(draftData)
            setHasChanges(true)
          }
        }
      } catch (error) {
        console.error('Failed to load form draft from cookies:', error)
      }
    }
  }, [item.id])

  // Clear form draft from cookies when saved
  const clearFormDraft = React.useCallback(() => {
    if (formData.id) {
      try {
        const cookieKey = `formDraft_${formData.id}`
        document.cookie = `${cookieKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      } catch (error) {
        console.error('Failed to clear form draft from cookies:', error)
      }
    }
  }, [formData.id])

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
    setIsEditing(false)
    setHasChanges(false)
    clearFormDraft()
    toast.success("Changes saved successfully")
  }

  const handleCancel = () => {
    setFormData(item)
    setIsEditing(false)
    setHasChanges(false)
    if (onCancel) {
      onCancel()
    }
  }

  const renderField = (key: string, field: FieldSchema) => {
    const value = formData[key]
    const isRequired = field.required

    if (isEditing) {
      // Edit mode
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={`edit-${key}`} className="text-sm font-medium">
            {field.header}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {field.type === 'select' && field.options ? (
            <Select
              value={value || ""}
              onValueChange={(newValue) => handleInputChange(key, newValue)}
            >
              <SelectTrigger id={`edit-${key}`} className="w-full">
                <SelectValue placeholder={field.placeholder || `Select ${field.header}`} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(field.options) 
                  ? field.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
                  : []
                ).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'textarea' ? (
            <Textarea
              id={`edit-${key}`}
              value={value || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={field.placeholder}
              className="min-h-[100px]"
            />
          ) : field.type === 'boolean' ? (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`edit-${key}`}
                checked={!!value}
                onCheckedChange={(checked) => handleInputChange(key, checked)}
              />
              <Label htmlFor={`edit-${key}`} className="text-sm">
                {value ? "Yes" : "No"}
              </Label>
            </div>
          ) : (
            <Input
              id={`edit-${key}`}
              type={field.type === 'number' ? 'number' : 
                   field.type === 'email' ? 'email' :
                   field.type === 'url' ? 'url' :
                   field.type === 'date' ? 'date' : 'text'}
              value={value || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              pattern={field.pattern}
              required={isRequired}
              className="w-full"
            />
          )}
        </div>
      )
    } else {
      // View mode
      return (
        <div key={key} className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            {field.header}
          </Label>
          <div className="text-sm">
            {field.badge && value ? (
              <Badge variant="outline" className="text-muted-foreground">
                {value}
              </Badge>
            ) : field.type === 'boolean' ? (
              <Badge variant={value ? "default" : "secondary"}>
                {value ? "Yes" : "No"}
              </Badge>
            ) : field.type === 'textarea' ? (
              <div className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                {value || "No content"}
              </div>
            ) : (
              <span className={!value ? "text-muted-foreground italic" : ""}>
                {value || "Not set"}
              </span>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {title || formData.header || `Item ${formData.id}`}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={!hasChanges}
              >
                <IconX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <IconEdit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-6">
        <div className="grid gap-6">
          {Object.entries(schema).map(([key, field]) => {
            if (field.hidden) return null
            return renderField(key, field)
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Standalone detail view component (read-only)
export function DetailView({
  item,
  schema,
  title,
  description,
  className = "",
}: Omit<DetailEditFormProps, 'onSave' | 'onCancel'>) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">
          {title || item.header || `Item ${item.id}`}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-6">
        <div className="grid gap-6">
          {Object.entries(schema).map(([key, field]) => {
            if (field.hidden) return null
            
            const value = item[key]
            
            return (
              <div key={key} className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  {field.header}
                </Label>
                <div className="text-sm">
                  {field.badge && value ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      {value}
                    </Badge>
                  ) : field.type === 'boolean' ? (
                    <Badge variant={value ? "default" : "secondary"}>
                      {value ? "Yes" : "No"}
                    </Badge>
                  ) : field.type === 'textarea' ? (
                    <div className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                      {value || "No content"}
                    </div>
                  ) : (
                    <span className={!value ? "text-muted-foreground italic" : ""}>
                      {value || "Not set"}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
