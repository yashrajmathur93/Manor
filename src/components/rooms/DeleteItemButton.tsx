'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteItemButtonProps {
  itemId: string
  itemName: string
}

export function DeleteItemButton({ itemId, itemName }: DeleteItemButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('items').delete().eq('id', itemId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`"${itemName}" removed`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            size="icon"
            variant="destructive"
            className="w-6 h-6"
          />
        }
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Trash2 className="w-3 h-3" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove item?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove &quot;{itemName}&quot; from this room.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
