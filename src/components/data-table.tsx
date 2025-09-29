"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart"
import { Checkbox } from "./ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

// Schema types
type FieldType = 'text' | 'number' | 'email' | 'url' | 'select' | 'multiselect' | 'boolean' | 'date' | 'textarea'
type AlignType = 'left' | 'center' | 'right'
type FormatType = 'currency' | 'percentage' | 'date' | 'datetime'

export type FieldSchema = {
  type: FieldType
  header: string
  placeholder?: string
  align?: AlignType
  width?: number | string
  sortable?: boolean
  filterable?: boolean
  editable?: boolean
  required?: boolean
  hidden?: boolean
  options?: string[] | { label: string, value: string }[]
  badge?: boolean
  icon?: boolean
  format?: FormatType
  min?: number
  max?: number
  pattern?: string
}

export type TableSchema = Record<string, FieldSchema>

export type TableFeatures = {
  enableDragDrop?: boolean
  enableSelection?: boolean
  enablePagination?: boolean
  enableColumnVisibility?: boolean
  enableActions?: boolean
  pagination?: {
    pageSize?: number
    pageSizeOptions?: number[]
  }
  tabs?: {
    key: string
    label: string
    badge?: number
  }[]
}

type DataRow = Record<string, any> & { id: number | string }

// Drag handle component
function DragHandle({ id }: { id: number | string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Format cell value based on schema
function formatCellValue(value: any, field: FieldSchema): React.ReactNode {
  if (value === null || value === undefined) return ''
  
  switch (field.format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    case 'percentage':
      return `${value}%`
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'datetime':
      return new Date(value).toLocaleString()
    default:
      return String(value)
  }
}

// Render cell based on field type
function renderCell(value: any, field: FieldSchema, row: DataRow): React.ReactNode {
  const formattedValue = formatCellValue(value, field)

  if (field.badge) {
    const variant = 'outline'
      return (
        <Badge variant={variant} className="text-muted-foreground px-1.5">
        {field.type === 'select' && value === 'Done' ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
        ) : field.type === 'select' && value === 'In Process' || 'In Progress' ? (
            <IconCircleCheckFilled  className="mr-1 animate-spin" />
        ) : null}
        {formattedValue}
        </Badge>
    )
  }
  if (field.type === 'boolean') {
    return <Checkbox checked={!!value} disabled />
  }

  if (field.editable) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving...`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.id}-${field.header}`} className="sr-only">
          {field.header}
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={value}
          type={field.type === 'number' ? 'number' : 'text'}
          id={`${row.id}-${field.header}`}
          min={field.min}
          max={field.max}
          pattern={field.pattern}
        />
      </form>
    )
  }

  if (field.type === 'select' && field.options && !value) {
    const options = Array.isArray(field.options) 
      ? field.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
      : []

    return (
      <>
        <Label htmlFor={`${row.id}-${field.header}`} className="sr-only">
          {field.header}
        </Label>
        <Select>
          <SelectTrigger
            className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
            size="sm"
            id={`${row.id}-${field.header}`}
          >
            <SelectValue placeholder={field.placeholder || `Select ${field.header}`} />
          </SelectTrigger>
          <SelectContent align="end">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </>
    )
  }

  return <div className={field.align === 'right' ? 'text-right' : field.align === 'center' ? 'text-center' : ''}>{formattedValue}</div>
}

// Generate columns from schema
function generateColumns<T extends DataRow>(
  schema: TableSchema, 
  features: TableFeatures = {}
): ColumnDef<T>[] {
  const columns: ColumnDef<T>[] = []

  // Add drag column if enabled
  if (features.enableDragDrop) {
    columns.push({
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
      size: 40,
    })
  }

  // Add selection column if enabled
  if (features.enableSelection) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="rounded-[4px]"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="rounded-[4px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    })
  }

  // Add columns from schema
  Object.entries(schema).forEach(([key, field]) => {
    if (field.hidden) return

    columns.push({
    accessorKey: key,
    header: ({ column }) => {
        if (field.align === 'right') {
        return (
            <div className="flex items-center justify-end">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="h-auto p-0 hover:bg-transparent"
            >
                {field.header}
                <IconChevronDown className={`ml-2 h-4 w-4 transition-transform ${
                column.getIsSorted() === "asc" ? "rotate-180" : 
                column.getIsSorted() === "desc" ? "rotate-0" : "opacity-50"
                }`} />
            </Button>
            </div>
        )
        }
        
        return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 hover:bg-transparent"
        >
            {field.header}
            <IconChevronDown className={`ml-2 h-4 w-4 transition-transform ${
            column.getIsSorted() === "asc" ? "rotate-180" : 
            column.getIsSorted() === "desc" ? "rotate-0" : "opacity-50"
            }`} />
        </Button>
        )
    },
    cell: ({ row }) => {
        const value = row.original[key]
        
        const isFirstDataColumn = Object.keys(schema).indexOf(key) === 0
        if (isFirstDataColumn && !field.editable) {
          return <TableCellViewer item={row.original} schema={schema} fieldKey={key} />
        }

        return renderCell(value, field, row.original)
    },
        enableSorting: field.sortable !== false,
        enableHiding: key !== Object.keys(schema)[0],
        size: typeof field.width === 'number' ? field.width : undefined,
    })
  })

  // Add actions column if enabled
  if (features.enableActions) {
    columns.push({
      id: "actions",
      cell: () => (
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
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Make a copy</DropdownMenuItem>
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 40,
    })
  }

  return columns
}

function DraggableRow<T extends DataRow>({ row }: { row: Row<T> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer<T extends DataRow>({ 
  item, 
  schema, 
  fieldKey 
}: { 
  item: T
  schema: TableSchema
  fieldKey: string
}) {
  const isMobile = useIsMobile()
  const field = schema[fieldKey]

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item[fieldKey]}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item[fieldKey]}</DrawerTitle>
          <DrawerDescription>
            Edit details for this item
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Additional details and analytics for this item.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            {Object.entries(schema).map(([key, fieldSchema]) => (
              <div key={key} className={fieldSchema.type === 'textarea' ? 'col-span-2' : ''}>
                <div className="flex flex-col gap-3">
                  <Label htmlFor={`edit-${key}`}>{fieldSchema.header}</Label>
                  {fieldSchema.type === 'select' && fieldSchema.options ? (
                    <Select defaultValue={item[key]}>
                      <SelectTrigger id={`edit-${key}`} className="w-full">
                        <SelectValue placeholder={fieldSchema.placeholder || `Select ${fieldSchema.header}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(fieldSchema.options) 
                          ? fieldSchema.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
                          : []
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : fieldSchema.type === 'textarea' ? (
                    <Textarea
                      id={`edit-${key}`}
                      defaultValue={item[key]}
                      placeholder={fieldSchema.placeholder}
                    />
                  ) : fieldSchema.type === 'boolean' ? (
                    <Checkbox
                      id={`edit-${key}`}
                      defaultChecked={item[key]}
                      className="rounded-[4px]"
                    />
                  ) : (
                    <Input
                      id={`edit-${key}`}
                      type={fieldSchema.type === 'number' ? 'number' : 
                           fieldSchema.type === 'email' ? 'email' :
                           fieldSchema.type === 'url' ? 'url' :
                           fieldSchema.type === 'date' ? 'date' : 'text'}
                      defaultValue={item[key]}
                      placeholder={fieldSchema.placeholder}
                      min={fieldSchema.min}
                      max={fieldSchema.max}
                      pattern={fieldSchema.pattern}
                      required={fieldSchema.required}
                    />
                  )}
                </div>
              </div>
            ))}
          </form>
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function DataTable<T extends DataRow>({
  data: initialData,
  schema,
  features = {},
}: {
  data: T[]
  schema: TableSchema
  features?: TableFeatures
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: features.pagination?.pageSize || 10,
  })
  
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const columns = React.useMemo(() => generateColumns<T>(schema, features), [schema, features])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: features.enableSelection !== false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const TabsWrapper = features.tabs ? Tabs : React.Fragment
  const tabsProps = features.tabs ? { defaultValue: features.tabs[0]?.key, className: "w-full flex-col justify-start gap-6" } : {}

  return (
    <TabsWrapper {...tabsProps}>
      <div className="flex items-center justify-between px-4 lg:px-6">
        {features.tabs && (
          <>
            <Label htmlFor="view-selector" className="sr-only">
              View
            </Label>
            <Select defaultValue={features.tabs[0]?.key}>
              <SelectTrigger
                className="flex w-fit @4xl/main:hidden"
                size="sm"
                id="view-selector"
              >
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                {features.tabs.map((tab) => (
                  <SelectItem key={tab.key} value={tab.key}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
              <TabsList>
                {features.tabs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    {tab.label}
                    {tab.badge && <Badge variant="secondary">{tab.badge}</Badge>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {features.enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Item</span>
          </Button>
        </div>
      </div>

      {features.tabs ? (
        features.tabs.map((tab, index) => (
          <TabsContent
            key={tab.key}
            value={tab.key}
            className={index === 0 ? "relative flex flex-col gap-4 overflow-auto px-4 lg:px-6" : "flex flex-col px-4 lg:px-6"}
          >
            {index === 0 ? (
              <>
                <div className="overflow-hidden rounded-lg border">
                  <DndContext
                    collisionDetection={closestCenter}
                    modifiers={features.enableDragDrop ? [restrictToVerticalAxis] : []}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId}
                  >
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead key={header.id} colSpan={header.colSpan}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </TableHead>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody className="**:data-[slot=table-cell]:first:w-8">
                        {table.getRowModel().rows?.length ? (
                          features.enableDragDrop ? (
                            <SortableContext
                              items={dataIds}
                              strategy={verticalListSortingStrategy}
                            >
                              {table.getRowModel().rows.map((row) => (
                                <DraggableRow key={row.id} row={row} />
                              ))}
                            </SortableContext>
                          ) : (
                            table.getRowModel().rows.map((row) => (
                              <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              No results.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </DndContext>
                </div>
                {features.enablePagination && (
                  <div className="flex items-center justify-between px-4">
                    {features.enableSelection && (
                      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                      </div>
                    )}
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                      <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                          Rows per page
                        </Label>
                        <Select
                          value={`${table.getState().pagination.pageSize}`}
                          onValueChange={(value) => {
                            table.setPageSize(Number(value))
                          }}
                        >
                          <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                            <SelectValue
                              placeholder={table.getState().pagination.pageSize}
                            />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {(features.pagination?.pageSizeOptions || [10, 20, 30, 40, 50]).map((pageSize) => (
                              <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                      </div>
                      <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => table.setPageIndex(0)}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <span className="sr-only">Go to first page</span>
                          <IconChevronsLeft />
                        </Button>
                        <Button
                          variant="outline"
                          className="size-8"
                          size="icon"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <IconChevronLeft />
                        </Button>
                        <Button
                          variant="outline"
                          className="size-8"
                          size="icon"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          <span className="sr-only">Go to next page</span>
                          <IconChevronRight />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden size-8 lg:flex"
                          size="icon"
                          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                          disabled={!table.getCanNextPage()}
                        >
                          <span className="sr-only">Go to last page</span>
                          <IconChevronsRight />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
            )}
          </TabsContent>
        ))
      ) : (
        <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={features.enableDragDrop ? [restrictToVerticalAxis] : []}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    features.enableDragDrop ? (
                      <SortableContext
                        items={dataIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map((row) => (
                          <DraggableRow key={row.id} row={row} />
                        ))}
                      </SortableContext>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          {features.enablePagination && (
            <div className="flex items-center justify-between px-4">
              {features.enableSelection && (
                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
              )}
              <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label htmlFor="rows-per-page" className="text-sm font-medium">
                    Rows per page
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value))
                    }}
                  >
                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {(features.pagination?.pageSizeOptions || [10, 20, 30, 40, 50]).map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-fit items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <IconChevronsLeft />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <IconChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <IconChevronRight />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <IconChevronsRight />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </TabsWrapper>
  )
}