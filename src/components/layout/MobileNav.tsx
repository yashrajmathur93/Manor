'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Users,
  BarChart3,
  LogOut,
  Home,
  Menu,
} from 'lucide-react'
import { Profile } from '@/types'
import { toast } from 'sonner'

const ownerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rooms', label: 'House Map', icon: Building2 },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/staff', label: 'Staff', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

const staffNav = [
  { href: '/dashboard', label: 'My Tasks', icon: CheckSquare },
]

interface MobileNavProps {
  profile: Profile
}

export function MobileNav({ profile }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const nav = profile.role === 'owner' ? ownerNav : staffNav

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900">Manor</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" />}>
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Manor</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-gray-100">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                <Badge variant="secondary" className="text-xs capitalize px-1.5 py-0 h-4 mt-0.5">
                  {profile.role}
                </Badge>
              </div>
            </div>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 px-3"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
