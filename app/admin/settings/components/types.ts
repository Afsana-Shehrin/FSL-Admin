//  In your types.ts file
export interface Admin {
  admin: {
    admin_id: string
    email: string
    username: string
    full_name?: string
    role?: string
    phone?: string | null
    image?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
    last_login_at?: string
    last_login_formatted?: string
  }
}
export interface DatabaseAdmin {
  admin_id: string
  email: string
  username: string
  full_name: string | null
  role: string
  is_active: boolean | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  admin_profiles?: DatabaseAdminProfile[] | null
}

export interface DatabaseAdminProfile {
  admin_id: string
  full_name: string | null
  phone: string | null
  profile_image_url: string | null
  created_at: string
  updated_at: string
}

// Keep the flat interface for backward compatibility if needed
export interface FlatAdmin {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
  phone?: string
  profile_image_url?: string
  profile_image_base64?: string
}

export interface Sport {
  id: string
  name: string
  icon: string
  isActive: boolean
}

export interface SportFormData {
  name: string
  icon: string
  isActive: boolean
}