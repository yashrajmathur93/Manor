import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CheckSquare } from 'lucide-react'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { TaskList } from '@/components/tasks/TaskList'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const [{ data: tasks }, { data: rooms }, { data: staff }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, room:rooms(name, floor:floors(name))')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('rooms')
      .select('id, name, floor:floors(name)')
      .order('order_index'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'staff')
      .order('full_name'),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Recurring cleaning tasks assigned to your staff
          </p>
        </div>
        <CreateTaskDialog rooms={rooms ?? []} staff={staff ?? []} />
      </div>

      <TaskList
        tasks={tasks ?? []}
        rooms={rooms ?? []}
        staff={staff ?? []}
      />
    </div>
  )
}
