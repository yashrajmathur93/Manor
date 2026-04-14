'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Task } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckSquare, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const recurrenceLabel: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Weekly',
  monthly: 'Monthly',
  one_time: 'One time',
}

interface TaskListProps {
  tasks: Task[]
  rooms: { id: string; name: string }[]
  staff: { id: string; full_name: string }[]
}

export function TaskList({ tasks }: TaskListProps) {
  const router = useRouter()
  const supabase = createClient()

  async function deleteTask(id: string, name: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`"${name}" removed`)
      router.refresh()
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
        <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-gray-600">No tasks yet</p>
        <p className="text-sm mt-1">Create your first recurring cleaning task</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-4 h-4 text-gray-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900">{task.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500">
                {(task.room as { name: string } | undefined)?.name}
              </span>
              <span className="text-xs text-gray-300">·</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {recurrenceLabel[task.recurrence_type]}
                {task.recurrence_type === 'weekly' && task.recurrence_days && (
                  <span className="ml-0.5">
                    ({task.recurrence_days.map((d) => DAYS[d]).join(', ')})
                  </span>
                )}
              </div>
            </div>
          </div>

          <Badge
            variant={task.is_active ? 'default' : 'secondary'}
            className="text-xs hidden sm:inline-flex"
          >
            {task.is_active ? 'Active' : 'Paused'}
          </Badge>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-gray-400 hover:text-red-500 flex-shrink-0"
                />
              }
            >
              <Trash2 className="w-4 h-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove task?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{task.name}&quot; will be deactivated and no longer assigned.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTask(task.id, task.name)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  )
}
