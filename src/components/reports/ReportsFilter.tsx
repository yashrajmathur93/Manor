'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ReportsFilterProps {
  staff: { id: string; full_name: string }[]
  currentPeriod: string
  currentStaff?: string
}

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

export function ReportsFilter({ staff, currentPeriod, currentStaff }: ReportsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Period pills */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => updateFilter('period', p.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              currentPeriod === p.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Staff filter */}
      {staff.length > 0 && (
        <Select
          value={currentStaff ?? 'all'}
          onValueChange={(v) => updateFilter('staff', v)}
        >
          <SelectTrigger className="h-9 text-sm w-44">
            <SelectValue placeholder="All staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All staff</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
