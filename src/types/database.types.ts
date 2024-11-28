export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  timezone: string
  theme: 'light' | 'dark'
  created_at: string
}

export interface Schedule {
  id: string
  user_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  category: string
  is_recurring: boolean
  recurring_pattern: any | null
  created_at: string
} 