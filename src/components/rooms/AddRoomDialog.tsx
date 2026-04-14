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

interface AddRoomDialogProps {
  floorId: string
  floorName: string
  trigger?: React.ReactNode
}

export function AddRoomDialog({ floorId, floorName, trigger }: AddRoomDialogProps) {
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
      let coverPhotoUrl: string | null = null

      if (photo) {
        const ext = photo.name.split('.').pop()
        const filename = `${floorId}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('room-photos')
          .upload(filename, photo)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('room-photos').getPublicUrl(filename)
        coverPhotoUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('rooms').insert({
        floor_id: floorId,
        name: name.trim(),
        cover_photo_url: coverPhotoUrl,
        order_index: Math.floor(Date.now() / 1000),
      })

      if (error) throw error

      toast.success(`Room "${name}" added`)
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
          <Button size="sm" variant="ghost" className="text-xs h-7">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Room
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a room · {floorName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="room-name">Room name</Label>
              <Input
                id="room-name"
                placeholder="e.g. Kitchen, Master Bedroom, Living Room"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cover photo (optional)</Label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
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
                    <span className="text-xs">Click to add photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add room'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
