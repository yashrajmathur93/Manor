'use client'

import { useState } from 'react'
import { TaskAssignment } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, AlertCircle, Clock, ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'

interface OwnerTaskBoardProps {
  assignments: TaskAssignment[]
}

export function OwnerTaskBoard({ assignments }: OwnerTaskBoardProps) {
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)

  const pending = assignments.filter((a) => a.status === 'pending')
  const completed = assignments.filter((a) => a.status === 'completed')
  const blocked = assignments.filter((a) => a.status === 'blocked')

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No tasks assigned today</p>
        <p className="text-sm mt-1">Go to Tasks to set up assignments</p>
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Today&apos;s Tasks</h2>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 h-6">
              All ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-3 h-6">
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-3 h-6">
              Done ({completed.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {(['all', 'pending', 'completed', 'blocked'] as const).map((tab) => {
          const list =
            tab === 'all'
              ? assignments
              : tab === 'pending'
              ? pending
              : tab === 'completed'
              ? completed
              : blocked

          return (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="space-y-2">
                {list.map((a) => (
                  <OwnerTaskCard
                    key={a.id}
                    assignment={a}
                    onViewPhoto={setViewPhoto}
                  />
                ))}
                {list.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">Nothing here</p>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Completion Photo</DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              <Image src={viewPhoto} alt="Completion proof" fill className="object-cover" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function OwnerTaskCard({
  assignment,
  onViewPhoto,
}: {
  assignment: TaskAssignment
  onViewPhoto: (url: string) => void
}) {
  const statusIcon = {
    completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    blocked: <AlertCircle className="w-4 h-4 text-red-400" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
  }[assignment.status]

  const borderColor = {
    completed: 'border-green-100 bg-green-50',
    blocked: 'border-red-100 bg-red-50',
    pending: 'border-gray-200 bg-white',
  }[assignment.status]

  const assigneeName = (assignment.assignee as { full_name: string } | undefined)?.full_name ?? 'Unassigned'
  const initials = assigneeName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className={`rounded-lg border p-3 ${borderColor}`}>
      <div className="flex items-center gap-3">
        {statusIcon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{assignment.task?.name}</p>
          <p className="text-xs text-gray-500">{assignment.task?.room?.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {assignment.completion?.proof_photo_url && (
            <button
              onClick={() => onViewPhoto(assignment.completion!.proof_photo_url!)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs bg-gray-100">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500 hidden sm:block">{assigneeName.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  )
}
