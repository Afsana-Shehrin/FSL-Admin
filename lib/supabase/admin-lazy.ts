import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized singleton for admin client
let adminClientInstance: SupabaseClient | null = null

export const getAdminClient = (): SupabaseClient => {
  if (adminClientInstance) {
    return adminClientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return adminClientInstance
}
