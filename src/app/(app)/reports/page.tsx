import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, TrendingUp, Users, Building2 } from 'lucide-react'
import { ReportsFilter } from '@/components/reports/ReportsFilter'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; staff?: string; room?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  // Date range based on filter
  const period = params.period ?? 'week'
  const now = new Date()
  let startDate: string
  let endDate: string

  if (period === 'today') {
    startDate = endDate = format(now, 'yyyy-MM-dd')
  } else if (period === 'week') {
    startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  } else {
    startDate = format(startOfMonth(now), 'yyyy-MM-dd')
    endDate = format(endOfMonth(now), 'yyyy-MM-dd')
  }

  let query = supabase
    .from('task_assignments')
    .select(`
      *,
      task:tasks(name, room:rooms(name)),
      assignee:profiles(full_name),
      completion:task_completions(completed_at, proof_photo_url, notes)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('status', 'completed')
    .order('date', { ascending: false })

  if (params.staff) query = query.eq('assigned_to', params.staff)

  const { data: completions } = await query

  const [{ data: staffList }, { data: roomList }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('role', 'staff'),
    supabase.from('rooms').select('id, name'),
  ])

  const records = completions ?? []

  // Stats
  const totalCompleted = records.length
  const staffCounts: Record<string, number> = {}
  const roomCounts: Record<string, number> = {}

  records.forEach((r) => {
    const name = (r.assignee as { full_name: string } | null)?.full_name ?? 'Unknown'
    const room = (r.task as { room?: { name: string } } | null)?.room?.name ?? 'Unknown'
    staffCounts[name] = (staffCounts[name] ?? 0) + 1
    roomCounts[room] = (roomCounts[room] ?? 0) + 1
  })

  const topStaff = Object.entries(staffCounts).sort((a, b) => b[1] - a[1])[0]
  const topRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">History of all completed cleaning tasks</p>
      </div>

      <ReportsFilter staff={staffList ?? []} currentPeriod={period} currentStaff={params.staff} />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <Card className="border border-gray-200 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Tasks Completed</p>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'today'}</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Most Active Staff</p>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{topStaff?.[0] ?? '—'}</p>
            {topStaff && <p className="text-xs text-gray-400 mt-0.5">{topStaff[1]} tasks</p>}
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Most Cleaned Room</p>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{topRoom?.[0] ?? '—'}</p>
            {topRoom && <p className="text-xs text-gray-400 mt-0.5">{topRoom[1]} tasks</p>}
          </CardContent>
        </Card>
      </div>

      {/* Completion log */}
      {records.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No completions found</p>
          <p className="text-sm mt-1">Try a different date range or filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {(r.task as { name: string } | null)?.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {(r.task as { room?: { name: string } } | null)?.room?.name}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-500">
                    {(r.assignee as { full_name: string } | null)?.full_name}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">{format(new Date(r.date), 'MMM d')}</p>
                {r.completion?.completed_at && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(r.completion.completed_at), 'h:mm a')}
                  </p>
                )}
              </div>
              {r.completion?.proof_photo_url && (
                <a
                  href={r.completion.proof_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 relative">
                    <img
                      src={r.completion.proof_photo_url}
                      alt="Proof"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
