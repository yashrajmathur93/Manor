import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { OwnerTaskBoard } from '@/components/tasks/OwnerTaskBoard'
import { StaffTaskBoard } from '@/components/tasks/StaffTaskBoard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  if (profile.role === 'staff') {
    // Staff sees their own tasks for today
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select(`
        *,
        task:tasks(*, room:rooms(*)),
        completion:task_completions(*)
      `)
      .eq('assigned_to', user.id)
      .eq('date', today)
      .order('created_at')

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Good {getGreeting()}, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d')} · Your tasks for today
          </p>
        </div>
        <StaffTaskBoard assignments={assignments ?? []} />
      </div>
    )
  }

  // Owner dashboard
  const { data: allAssignments } = await supabase
    .from('task_assignments')
    .select(`
      *,
      task:tasks(*, room:rooms(*)),
      assignee:profiles(full_name, role),
      completion:task_completions(*)
    `)
    .eq('date', today)
    .order('created_at')

  const assignments = allAssignments ?? []
  const total = assignments.length
  const completed = assignments.filter((a) => a.status === 'completed').length
  const blocked = assignments.filter((a) => a.status === 'blocked').length
  const pending = total - completed - blocked

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Good {getGreeting()}, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE, MMMM d')} · Today&apos;s overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tasks"
          value={total}
          icon={<TrendingUp className="w-4 h-4 text-gray-400" />}
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          highlight="green"
        />
        <StatCard
          label="Pending"
          value={pending}
          icon={<Clock className="w-4 h-4 text-yellow-500" />}
          highlight="yellow"
        />
        <StatCard
          label="Blocked"
          value={blocked}
          icon={<AlertCircle className="w-4 h-4 text-red-400" />}
          highlight="red"
        />
      </div>

      {/* Task board */}
      <OwnerTaskBoard assignments={assignments} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: number
  icon: React.ReactNode
  highlight?: 'green' | 'yellow' | 'red'
}) {
  const valueColor =
    highlight === 'green'
      ? 'text-green-600'
      : highlight === 'yellow'
      ? 'text-yellow-600'
      : highlight === 'red'
      ? 'text-red-500'
      : 'text-gray-900'

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          {icon}
        </div>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
