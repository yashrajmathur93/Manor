'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditRoomButtonsProps {
  roomId: string
  roomName: string
}

export function EditRoomButtons({ roomId, roomName }: EditRoomButtonsProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(roomName)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase.from('rooms').update({ name: name.trim() }).eq('id', roomId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Room renamed')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`"${roomName}" deleted`)
      router.refresh()
    }
  }

  return (
    <>
      {/* Edit button */}
      <span
        onClick={(e) => { e.preventDefault(); setName(roomName); setOpen(true) }}
        className="cursor-pointer"
      >
        <Button size="icon" variant="ghost" className="w-6 h-6 text-gray-400 hover:text-gray-700">
          <Pencil className="w-3 h-3" />
        </Button>
      </span>

      {/* Delete button */}
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button size="icon" variant="ghost" className="w-6 h-6 text-gray-400 hover:text-red-500" />}
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        >
          <Trash2 className="w-3 h-3" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &quot;{roomName}&quot; and all its items permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Room name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
