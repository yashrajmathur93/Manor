import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ImageIcon } from 'lucide-react'
import { AddItemDialog } from '@/components/rooms/AddItemDialog'
import { DeleteItemButton } from '@/components/rooms/DeleteItemButton'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: room } = await supabase
    .from('rooms')
    .select('*, floor:floors(name)')
    .eq('id', roomId)
    .single()

  if (!room) notFound()

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at')

  const itemList = items ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/rooms"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        House Map
      </Link>

      {/* Room header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{room.name}</h1>
            <Badge variant="secondary" className="text-xs">
              {(room.floor as { name: string } | null)?.name}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {itemList.length} {itemList.length === 1 ? 'item' : 'items'} catalogued
          </p>
        </div>
        <AddItemDialog roomId={roomId} roomName={room.name} />
      </div>

      {/* Room cover photo */}
      {room.cover_photo_url && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden mb-6 bg-gray-100">
          <Image src={room.cover_photo_url} alt={room.name} fill className="object-cover" />
        </div>
      )}

      {/* Item grid */}
      {itemList.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-600">No items yet</p>
          <p className="text-sm mt-1 mb-5">Add everything that lives in this room</p>
          <AddItemDialog
            roomId={roomId}
            roomName={room.name}
            trigger={<Button>Add first item</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {itemList.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white"
            >
              <div className="aspect-square bg-gray-100 relative">
                {item.photo_url ? (
                  <Image src={item.photo_url} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                {/* Delete button on hover */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteItemButton itemId={item.id} itemName={item.name} />
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
