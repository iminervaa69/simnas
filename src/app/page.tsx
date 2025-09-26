import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/authClient'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  switch(user.role) {
    case 'admin':
    case 'guru': 
    case 'siswa':
      redirect('/dashboard')
    default:
      redirect('/login')
  }
}

