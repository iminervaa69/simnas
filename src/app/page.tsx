import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server' 

export default async function HomePage() {
  console.log('🔄 Server: Root page loading...')
  
  const user = await getCurrentUser()
  console.log('📊 Server: Root page auth check:', { hasUser: !!user, role: user?.role })
  
  if (!user) {
    console.log('🔄 Server: No user, redirecting to login')
    redirect('/login')
  }
  
  console.log('🔄 Server: User found, redirecting to dashboard')
  redirect('/dashboard')
}