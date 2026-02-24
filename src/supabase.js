import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://qzrokjgvrscbazldbypr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cm9ramd2cnNjYmF6bGRieXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjE0MTIsImV4cCI6MjA4NzUzNzQxMn0.40hvKcu3MzaUK5QCgMpclSaxMLGAr7QHzkY7M-v3zuo'
  ,{
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)