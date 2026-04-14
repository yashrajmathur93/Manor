'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddFloorDialogProps {
  trigger?: React.ReactNode
}

export function AddFloorDialog({ trigger }: AddFloorDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { error } = await supabase
      .from('floors')
      .insert({ name: name.trim(), order_index: Math.floor(Date.now() / 1000) })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Floor "${name}" added`)
      setName('')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1.5" /> Add Floor
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a floor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="floor-name">Floor name</Label>
              <Input
                id="floor-name"
                placeholder="e.g. Ground Floor, First Floor, Basement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add floor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
