'use client'

import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Terjadi kesalahan!</h2>
        <p className="text-muted-foreground">
          Maaf, terjadi kesalahan tidak terduga
        </p>
      </div>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  )
}