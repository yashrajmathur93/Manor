import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { InviteStaffDialog } from '@/components/staff/InviteStaffDialog'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  const members = allProfiles ?? []
  const owners = members.filter((m) => m.role === 'owner')
  const staff = members.filter((m) => m.role === 'staff')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage everyone who has access to Manor
          </p>
        </div>
        <InviteStaffDialog />
      </div>

      {/* Owners */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          Owners · {owners.length}
        </h2>
        <div className="space-y-2">
          {owners.map((m) => (
            <MemberCard key={m.id} member={m} isCurrentUser={m.id === user.id} />
          ))}
        </div>
      </section>

      {/* Staff */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          Staff · {staff.length}
        </h2>
        {staff.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No staff members yet</p>
            <InviteStaffDialog
              trigger={
                <button className="text-sm text-gray-600 underline mt-1 hover:text-gray-900">
                  Invite your first staff member
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MemberCard({
  member,
  isCurrentUser,
}: {
  member: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url: string | null
  }
  isCurrentUser?: boolean
}) {
  const initials = member.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <Avatar className="w-9 h-9">
        <AvatarImage src={member.avatar_url ?? undefined} />
        <AvatarFallback className="text-sm bg-gray-100 text-gray-600">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-gray-900">{member.full_name}</p>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">
              You
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{member.email}</p>
      </div>
      <Badge variant="secondary" className="text-xs capitalize">
        {member.role}
      </Badge>
    </div>
  )
}
