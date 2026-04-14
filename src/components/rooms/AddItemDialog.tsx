'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface AddItemDialogProps {
  roomId: string
  roomName: string
  trigger?: React.ReactNode
}

export function AddItemDialog({ roomId, roomName, trigger }: AddItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    try {
      let photoUrl: string | null = null

      if (photo) {
        const ext = photo.name.split('.').pop()
        const filename = `${roomId}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(filename, photo)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(filename)
        photoUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('items').insert({
        room_id: roomId,
        name: name.trim(),
        photo_url: photoUrl,
      })

      if (error) throw error

      toast.success(`"${name}" added to ${roomName}`)
      setName('')
      setPhoto(null)
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
        {trigger ?? (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Item
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add item to {roomName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Item name</Label>
              <Input
                id="item-name"
                placeholder="e.g. Sofa, Dining Table, TV Cabinet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
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
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">Click or tap to add photo</span>
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
