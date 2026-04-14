import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import { AddFloorDialog } from '@/components/rooms/AddFloorDialog'
import { AddRoomDialog } from '@/components/rooms/AddRoomDialog'
import { EditFloorDialog } from '@/components/rooms/EditFloorDialog'
import { EditRoomButtons } from '@/components/rooms/EditRoomButtons'

export default async function RoomsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: floors } = await supabase
    .from('floors')
    .select('*')
    .order('order_index')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, floor:floors(name)')
    .order('order_index')

  const floorList = floors ?? []
  const roomList = rooms ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">House Map</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your floors, rooms, and everything in them</p>
        </div>
        <AddFloorDialog />
      </div>

      {floorList.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-gray-600">No floors yet</p>
          <p className="text-sm mt-1 mb-6">Start by adding a floor to your home</p>
          <AddFloorDialog trigger={<Button>Add your first floor</Button>} />
        </div>
      ) : (
        <div className="space-y-8">
          {floorList.map((floor) => {
            const floorRooms = roomList.filter((r) => r.floor_id === floor.id)
            return (
              <section key={floor.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-gray-900">{floor.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {floorRooms.length} {floorRooms.length === 1 ? 'room' : 'rooms'}
                    </Badge>
                    <EditFloorDialog floorId={floor.id} floorName={floor.name} />
                  </div>
                  <AddRoomDialog floorId={floor.id} floorName={floor.name} />
                </div>

                {floorRooms.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                    <p className="text-sm">No rooms on this floor yet</p>
                    <AddRoomDialog
                      floorId={floor.id}
                      floorName={floor.name}
                      trigger={
                        <button className="text-sm text-gray-600 underline mt-1 hover:text-gray-900">
                          Add a room
                        </button>
                      }
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {floorRooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="aspect-video bg-gray-100 relative">
                          {room.cover_photo_url ? (
                            <Image
                              src={room.cover_photo_url}
                              alt={room.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {room.name}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditRoomButtons roomId={room.id} roomName={room.name} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
