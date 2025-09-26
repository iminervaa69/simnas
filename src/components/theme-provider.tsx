import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Attribute } from 'next-themes';

type ThemeAttribute = Attribute | undefined;

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: "class" | "data-theme" | string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ 
  children, 
  attribute: attributeProp,
  defaultTheme,
  enableSystem,
  disableTransitionOnChange,
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attributeProp as ThemeAttribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}