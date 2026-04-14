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

interface EditFloorDialogProps {
  floorId: string
  floorName: string
}

export function EditFloorDialog({ floorId, floorName }: EditFloorDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(floorName)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase.from('floors').update({ name: name.trim() }).eq('id', floorId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Floor renamed')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    const { error } = await supabase.from('floors').delete().eq('id', floorId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`"${floorName}" deleted`)
      router.refresh()
    }
  }

  return (
    <>
      <span onClick={() => { setName(floorName); setOpen(true) }} className="cursor-pointer inline-flex">
        <Button size="icon" variant="ghost" className="w-7 h-7 text-gray-400 hover:text-gray-700">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </span>

      <AlertDialog>
        <AlertDialogTrigger render={
          <Button size="icon" variant="ghost" className="w-7 h-7 text-gray-400 hover:text-red-500" />
        }>
          <Trash2 className="w-3.5 h-3.5" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete floor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &quot;{floorName}&quot; and all its rooms and items permanently.
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename floor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Floor name</Label>
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
