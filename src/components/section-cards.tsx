"use client"

import * as React from "react"
import { 
  IconTrendingDown, 
  IconTrendingUp,
  IconUsers,
  IconActivity,
  IconTarget,
  IconShoppingCart,
  IconEye,
  IconHeart,
  IconStar,
  IconClock,
  IconCheck
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { 
  Building2, 
  CheckCircle,
  XCircleIcon,
} from "lucide-react"
import { check } from "zod"

// Available icons mapping
const iconMap = {
  trending_up: IconTrendingUp,
  trending_down: IconTrendingDown,
  users: IconUsers,
  activity: IconActivity,
  target: IconTarget,
  cart: IconShoppingCart,
  eye: IconEye,
  heart: IconHeart,
  star: IconStar,
  clock: IconClock,
  check: IconCheck,
  building_2: Building2,
  check_circle: CheckCircle,
  x_circle: XCircleIcon,
} as const
type IconKey = keyof typeof iconMap

export type CardSchema = {
  title: string
  description: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
    label?: string
  }
  footer?: {
    title: string
    description: string
    icon?: IconKey
  }
  icon?: IconKey
  format?: 'currency' | 'percentage' | 'number' | 'text'
  span?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }
}
export type SectionCardsConfig = {
  cards: CardSchema[]
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }
  className?: string
}

// Format value based on type
function formatValue(value: string | number, format?: CardSchema['format']): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value)
    case 'percentage':
      return `${value}%`
    case 'number':
      return new Intl.NumberFormat('en-US').format(value)
    default:
      return String(value)
  }
}

// Get trend icon and color
function getTrendConfig(trend: 'up' | 'down' | 'neutral') {
  switch (trend) {
    case 'up':
      return {
        icon: IconTrendingUp,
        color: 'text-green-600 dark:text-green-400'
      }
    case 'down':
      return {
        icon: IconTrendingDown,
        color: 'text-red-600 dark:text-red-400'
      }
    case 'neutral':
    default:
      return {
        icon: null,
        color: 'text-muted-foreground'
      }
  }
}

// Generate grid classes based on columns config
function generateGridClasses(columns?: SectionCardsConfig['columns']): string {
  const mobile = columns?.mobile || 1
  const desktop = columns?.desktop || 3
  const large = columns?.large || 3

  const classes: string[] = []

  // Mobile grid cols (static literals so Tailwind can see them)
  if (mobile === 1) classes.push('grid-cols-1')
  if (mobile === 2) classes.push('grid-cols-2')
  if (mobile === 3) classes.push('grid-cols-3')
  if (mobile === 4) classes.push('grid-cols-4')
  if (mobile === 5) classes.push('grid-cols-5')
  if (mobile === 6) classes.push('grid-cols-6')

  // Desktop grid cols at @xl/main
  if (desktop === 1) classes.push('@xl/main:grid-cols-1')
  if (desktop === 2) classes.push('@xl/main:grid-cols-2')
  if (desktop === 3) classes.push('@xl/main:grid-cols-3')
  if (desktop === 4) classes.push('@xl/main:grid-cols-4')
  if (desktop === 5) classes.push('@xl/main:grid-cols-5')
  if (desktop === 6) classes.push('@xl/main:grid-cols-6')

  // Large grid cols at @5xl/main
  if (large === 1) classes.push('@5xl/main:grid-cols-1')
  if (large === 2) classes.push('@5xl/main:grid-cols-2')
  if (large === 3) classes.push('@5xl/main:grid-cols-3')
  if (large === 4) classes.push('@5xl/main:grid-cols-4')
  if (large === 5) classes.push('@5xl/main:grid-cols-5')
  if (large === 6) classes.push('@5xl/main:grid-cols-6')

  return classes.join(' ')
}

function getCardSpanClasses(span?: CardSchema['span']): string {
  const classes: string[] = []

  // Mobile spans
  if (span?.mobile === 1) classes.push('col-span-1')
  if (span?.mobile === 2) classes.push('col-span-2')
  if (span?.mobile === 3) classes.push('col-span-3')
  if (span?.mobile === 4) classes.push('col-span-4')
  if (span?.mobile === 5) classes.push('col-span-5')
  if (span?.mobile === 6) classes.push('col-span-6')

  // Desktop spans at @xl/main
  if (span?.desktop === 1) classes.push('@xl/main:col-span-1')
  if (span?.desktop === 2) classes.push('@xl/main:col-span-2')
  if (span?.desktop === 3) classes.push('@xl/main:col-span-3')
  if (span?.desktop === 4) classes.push('@xl/main:col-span-4')
  if (span?.desktop === 5) classes.push('@xl/main:col-span-5')
  if (span?.desktop === 6) classes.push('@xl/main:col-span-6')

  // Large spans at @5xl/main
  if (span?.large === 1) classes.push('@5xl/main:col-span-1')
  if (span?.large === 2) classes.push('@5xl/main:col-span-2')
  if (span?.large === 3) classes.push('@5xl/main:col-span-3')
  if (span?.large === 4) classes.push('@5xl/main:col-span-4')
  if (span?.large === 5) classes.push('@5xl/main:col-span-5')
  if (span?.large === 6) classes.push('@5xl/main:col-span-6')

  return classes.join(' ')
}

export function SectionCards({ config }: { config: SectionCardsConfig }) {
  const gridClasses = generateGridClasses(config.columns)

  return (
    <div className={`@container/main *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 ${gridClasses} ${config.className || ''}`}>
      {config.cards.map((card, index) => {
        const trendConfig = card.change ? getTrendConfig(card.change.trend) : null
        const TrendIcon = trendConfig?.icon
        const FooterIcon = card.footer?.icon ? iconMap[card.footer.icon] : null
        const MainIcon = card.icon ? iconMap[card.icon] : null

        return (
          <Card key={index} className={`@container/card ${getCardSpanClasses(card.span)}`}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                {MainIcon && <MainIcon className="h-4 w-4 text-muted-foreground" />}
                {card.description}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {formatValue(card.value, card.format)}
              </CardTitle>
              {card.change && (
                <CardAction>
                  <Badge variant="outline" className={trendConfig?.color}>
                    {TrendIcon && <TrendIcon className="h-3 w-3" />}
                    {card.change.value}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            {card.footer && (
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {card.footer.title}
                  {FooterIcon && <FooterIcon className="size-4" />}
                </div>
                <div className="text-muted-foreground">
                  {card.footer.description}
                </div>
              </CardFooter>
            )}
          </Card>
        )
      })}
    </div>
  )
}