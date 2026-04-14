'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TaskAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertCircle, Clock, Camera, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface StaffTaskBoardProps {
  assignments: TaskAssignment[]
}

export function StaffTaskBoard({ assignments: initial }: StaffTaskBoardProps) {
  const [assignments, setAssignments] = useState(initial)
  const [completing, setCompleting] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const pending = assignments.filter((a) => a.status === 'pending')
  const done = assignments.filter((a) => a.status === 'completed')
  const blocked = assignments.filter((a) => a.status === 'blocked')

  async function completeTask(assignmentId: string) {
    setUploading(true)
    try {
      let photoUrl: string | null = null

      if (photo) {
        const ext = photo.name.split('.').pop()
        const filename = `${assignmentId}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('completion-photos')
          .upload(filename, photo)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('completion-photos')
          .getPublicUrl(filename)
        photoUrl = urlData.publicUrl
      }

      // Update assignment status
      const { error: statusError } = await supabase
        .from('task_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId)

      if (statusError) throw statusError

      // Insert completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({ assignment_id: assignmentId, proof_photo_url: photoUrl, notes: notes || null })

      if (completionError) throw completionError

      toast.success('Task marked as complete!')
      setCompleting(null)
      setPhoto(null)
      setNotes('')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  async function markBlocked(assignmentId: string) {
    const { error } = await supabase
      .from('task_assignments')
      .update({ status: 'blocked' })
      .eq('id', assignmentId)

    if (error) {
      toast.error(error.message)
    } else {
      toast('Task flagged as blocked')
      router.refresh()
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No tasks assigned for today</p>
        <p className="text-sm mt-1">Enjoy your day!</p>
      </div>
    )
  }

  const selectedAssignment = assignments.find((a) => a.id === completing)

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            To do · {pending.length}
          </h2>
          <div className="space-y-2">
            {pending.map((a) => (
              <TaskCard
                key={a.id}
                assignment={a}
                onComplete={() => setCompleting(a.id)}
                onBlock={() => markBlocked(a.id)}
              />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            Completed · {done.length}
          </h2>
          <div className="space-y-2">
            {done.map((a) => (
              <TaskCard key={a.id} assignment={a} done />
            ))}
          </div>
        </section>
      )}

      {blocked.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            Blocked · {blocked.length}
          </h2>
          <div className="space-y-2">
            {blocked.map((a) => (
              <TaskCard key={a.id} assignment={a} />
            ))}
          </div>
        </section>
      )}

      {/* Complete dialog */}
      <Dialog open={!!completing} onOpenChange={() => { setCompleting(null); setPhoto(null); setNotes('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark task complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-sm">{selectedAssignment?.task?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{selectedAssignment?.task?.room?.name}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Add a photo (optional)</Label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                {photo ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={URL.createObjectURL(photo)}
                      alt="Preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">Tap to add photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about this task…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => completing && completeTask(completing)}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Mark as complete</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskCard({
  assignment,
  onComplete,
  onBlock,
  done,
}: {
  assignment: TaskAssignment
  onComplete?: () => void
  onBlock?: () => void
  done?: boolean
}) {
  const statusConfig = {
    completed: { color: 'bg-green-50 border-green-100', badge: 'default' as const },
    blocked: { color: 'bg-red-50 border-red-100', badge: 'destructive' as const },
    pending: { color: 'bg-white border-gray-200', badge: 'secondary' as const },
  }

  const config = statusConfig[assignment.status]

  return (
    <div className={`rounded-lg border p-4 ${config.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900">{assignment.task?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{assignment.task?.room?.name}</p>
          {assignment.completion?.proof_photo_url && (
            <div className="mt-2 relative w-16 h-16 rounded overflow-hidden">
              <Image
                src={assignment.completion.proof_photo_url}
                alt="Proof"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {assignment.status === 'pending' && (
            <>
              <Button size="sm" onClick={onComplete} className="h-7 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Done
              </Button>
              <Button size="sm" variant="outline" onClick={onBlock} className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50">
                <AlertCircle className="w-3 h-3 mr-1" /> Block
              </Button>
            </>
          )}
          {assignment.status === 'completed' && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {assignment.status === 'blocked' && (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
        </div>
      </div>
    </div>
  )
}
