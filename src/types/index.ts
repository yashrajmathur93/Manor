export type Role = 'owner' | 'staff'

export type TaskStatus = 'pending' | 'completed' | 'blocked'

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'one_time'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url: string | null
  created_at: string
}

export interface Floor {
  id: string
  name: string
  order_index: number
  created_at: string
}

export interface Room {
  id: string
  floor_id: string
  name: string
  cover_photo_url: string | null
  order_index: number
  created_at: string
  floor?: Floor
}

export interface Item {
  id: string
  room_id: string
  name: string
  photo_url: string | null
  created_at: string
  room?: Room
}

export interface Task {
  id: string
  name: string
  room_id: string
  item_id: string | null
  recurrence_type: RecurrenceType
  recurrence_days: number[] | null // 0=Sun, 1=Mon ... 6=Sat
  is_active: boolean
  created_at: string
  room?: Room
  item?: Item
}

export interface TaskAssignment {
  id: string
  task_id: string
  assigned_to: string
  date: string // YYYY-MM-DD
  status: TaskStatus
  created_at: string
  task?: Task
  assignee?: Profile
  completion?: TaskCompletion
}

export interface TaskCompletion {
  id: string
  assignment_id: string
  completed_at: string
  proof_photo_url: string | null
  notes: string | null
}
