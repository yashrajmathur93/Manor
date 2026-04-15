export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Profile } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email ?? user.phone ?? null,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'New User',
        role: 'staff',
      })
      .select()
      .single()
    profile = created
  }

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar profile={profile as Profile} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileNav profile={profile as Profile} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
