import { createAdminClient } from './admin'

export async function ensureSuperAdmin() {
  try {
    console.log('Checking for Super Admin...')
    
    const supabase = createAdminClient()
    
    // Check if Super Admin exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'fantasysports@gmail.com')
      .eq('role', 'Super Admin')
      .single()

    if (checkError || !existingAdmin) {
      console.log('Super Admin not found, calling API to create...')
      
      // Call the API route to create Super Admin
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/seed-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to create Super Admin:', error)
      } else {
        const result = await response.json()
        console.log('Super Admin created successfully:', result)
      }
    } else {
      console.log('Super Admin already exists')
    }
  } catch (error) {
    console.error('Error ensuring Super Admin:', error)
  }
}