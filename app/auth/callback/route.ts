import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/admin'

  if (code) {
    const supabase = createClient()
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.redirect(new URL('/sign-in?error=auth_failed', requestUrl.origin))
    }
  }

  // Redirect to admin dashboard
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}