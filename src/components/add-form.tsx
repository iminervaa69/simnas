"use client"

import * as React from "react"
import { IconPlus, IconX } from "@tabler/icons-react"
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

type DataRow = Record<string, any> & { id?: number | string }

interface AddFormProps {
  schema: TableSchema
  onSave?: (item: DataRow) => void
  onCancel?: () => void
  onChange?: (item: DataRow) => void
  title?: string
  description?: string
  className?: string
  entityType: string // For cookie key generation (e.g., 'dudi', 'user')
}

// Cookie utilities for progress saving using native browser APIs
const getCookieKey = (entityType: string) => {
  return `${entityType}_add_draft`
}

const saveToCookie = (key: string, data: DataRow) => {
  try {
    document.cookie = `${key}=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
  } catch (error) {
    console.warn('Failed to save to cookie:', error)
  }
}

const loadFromCookie = (key: string): DataRow | null => {
  try {
    const cookies = document.cookie.split(';')
    const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
    if (cookie) {
      const value = cookie.split('=')[1]
      return JSON.parse(decodeURIComponent(value))
    }
    return null
  } catch (error) {
    console.warn('Failed to load from cookie:', error)
    return null
  }
}

const clearCookie = (key: string) => {
  document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function AddForm({
  schema,
  onSave,
  onCancel,
  onChange,
  title,
  description,
  className = "",
  entityType,
}: AddFormProps) {
  const [formData, setFormData] = React.useState<DataRow>(() => {
    // Try to load from cookie first, then use defaults
    const cookieKey = getCookieKey(entityType)
    const savedData = loadFromCookie(cookieKey)
    
    if (savedData) {
      return savedData
    }
    
    // Create default values based on schema
    const defaults: DataRow = {}
    Object.entries(schema).forEach(([key, field]) => {
      if (field.type === 'number') {
        defaults[key] = field.min || 1
      } else if (field.type === 'boolean') {
        defaults[key] = false
      } else if (field.type === 'select' && field.options) {
        const options = Array.isArray(field.options) 
          ? field.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
          : field.options
        defaults[key] = options[0]?.value || ''
      } else {
        defaults[key] = ''
      }
    })
    return defaults
  })
  
  const [hasChanges, setHasChanges] = React.useState(false)
  const cookieKey = getCookieKey(entityType)
  const lastNotifiedDirtyRef = React.useRef<boolean>(false)

  // Check for changes and save to cookie
  React.useEffect(() => {
    // For add mode, check if any field has a non-default value
    const changed = Object.keys(schema).some(key => {
      const value = formData[key]
      if (schema[key].type === 'number') {
        return value !== (schema[key].min || 1)
      } else if (schema[key].type === 'boolean') {
        return value !== false
      } else {
        return value && value.toString().trim() !== ''
      }
    })
    
    setHasChanges(changed)
    
    // Save to cookie if there are changes
    if (changed) {
      saveToCookie(cookieKey, formData)
    }
    
    // Only signal when the dirty flag changes to avoid render loops
    if (onChange && lastNotifiedDirtyRef.current !== changed) {
      lastNotifiedDirtyRef.current = changed
      if (changed) onChange({})
    }
  }, [formData, schema, cookieKey, onChange])

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
    
    // Clear cookie after successful save
    clearCookie(cookieKey)
    
    // Reset form
    const defaults: DataRow = {}
    Object.entries(schema).forEach(([key, field]) => {
      if (field.type === 'number') {
        defaults[key] = field.min || 1
      } else if (field.type === 'boolean') {
        defaults[key] = false
      } else if (field.type === 'select' && field.options) {
        const options = Array.isArray(field.options) 
          ? field.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
          : field.options
        defaults[key] = options[0]?.value || ''
      } else {
        defaults[key] = ''
      }
    })
    setFormData(defaults)
    setHasChanges(false)
    toast.success("Item created successfully")
  }

  const handleCancel = () => {
    // Clear cookie and reset form
    clearCookie(cookieKey)
    const defaults: DataRow = {}
    Object.entries(schema).forEach(([key, field]) => {
      if (field.type === 'number') {
        defaults[key] = field.min || 1
      } else if (field.type === 'boolean') {
        defaults[key] = false
      } else if (field.type === 'select' && field.options) {
        const options = Array.isArray(field.options) 
          ? field.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
          : field.options
        defaults[key] = options[0]?.value || ''
      } else {
        defaults[key] = ''
      }
    })
    setFormData(defaults)
    setHasChanges(false)
    if (onCancel) {
      onCancel()
    }
  }

  const renderField = (key: string, field: FieldSchema) => {
    const value = formData[key]
    const isRequired = field.required

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={`add-${key}`} className="text-sm font-medium">
          {field.header}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {field.type === 'select' && field.options ? (
          <Select
            value={value || ""}
            onValueChange={(newValue) => handleInputChange(key, newValue)}
          >
            <SelectTrigger id={`add-${key}`} className="w-full">
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
            id={`add-${key}`}
            value={value || ""}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[100px]"
          />
        ) : field.type === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`add-${key}`}
              checked={!!value}
              onCheckedChange={(checked) => handleInputChange(key, checked)}
            />
            <Label htmlFor={`add-${key}`} className="text-sm">
              {value ? "Yes" : "No"}
            </Label>
          </div>
        ) : (
          <Input
            id={`add-${key}`}
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
  }

  const formTitle = title || `Add New ${entityType.toUpperCase()}`
  const formDescription = description || `Create a new ${entityType} entry`

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
            {formTitle}
          </CardTitle>
          {formDescription && (
            <CardDescription>{formDescription}</CardDescription>
          )}
          {hasChanges && (
            <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Unsaved changes (auto-saved to cookies)
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
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
            Create
          </Button>
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
