'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CreateTaskDialogProps {
  rooms: { id: string; name: string; floor?: unknown }[]
  staff: { id: string; full_name: string }[]
}

export function CreateTaskDialog({ rooms, staff }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly' | 'one_time'>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !roomId || !assignedTo) return
    setLoading(true)

    try {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          name: name.trim(),
          room_id: roomId,
          recurrence_type: recurrence,
          recurrence_days: recurrence === 'weekly' ? selectedDays : null,
          is_active: true,
        })
        .select()
        .single()

      if (taskError) throw taskError

      // Generate today's assignment if applicable
      const today = new Date().toISOString().split('T')[0]
      if (shouldCreateAssignmentForToday(recurrence, recurrence === 'weekly' ? selectedDays : null)) {
        await supabase.from('task_assignments').upsert({
          task_id: task.id,
          assigned_to: assignedTo,
          date: today,
          status: 'pending',
        })
      }

      toast.success(`Task "${name}" created`)
      setName('')
      setRoomId('')
      setAssignedTo('')
      setRecurrence('daily')
      setSelectedDays([1, 2, 3, 4, 5])
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function shouldCreateAssignmentForToday(type: string, days: number[] | null): boolean {
    if (type === 'daily' || type === 'one_time') return true
    if (type === 'monthly') return new Date().getDate() === 1
    if (type === 'weekly' && days) return days.includes(new Date().getDay())
    return false
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Task
        </Button>
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-name">Task name</Label>
              <Input
                id="task-name"
                placeholder="e.g. Wipe countertops, Mop floor, Clean windows"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Room</Label>
              <Select value={roomId} onValueChange={(v) => setRoomId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {(r.floor as { name: string } | null)?.name && (
                        <span className="text-gray-400 ml-1.5 text-xs">
                          · {(r.floor as { name: string }).name}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>How often?</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence((v ?? 'daily') as typeof recurrence)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekly">Specific days of the week</SelectItem>
                  <SelectItem value="monthly">Once a month (1st of month)</SelectItem>
                  <SelectItem value="one_time">One time only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrence === 'weekly' && (
              <div className="space-y-1.5">
                <Label>Which days?</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedDays.includes(i)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim() || !roomId || !assignedTo}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
