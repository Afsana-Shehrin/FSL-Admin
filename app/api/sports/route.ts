import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin-lazy'

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching sports:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()
    
    // Validate required fields
    if (!body.sport_name || !body.sport_code) {
      return NextResponse.json(
        { error: 'Sport name and code are required' },
        { status: 400 }
      )
    }

    // Check if sport code already exists
    const { data: existingCode } = await supabase
      .from('sports')
      .select('sport_id')
      .eq('sport_code', body.sport_code)
      .single()

    if (existingCode) {
      return NextResponse.json(
        { error: 'Sport code already exists' },
        { status: 409 }
      )
    }

    // Check if sport name already exists
    const { data: existingName } = await supabase
      .from('sports')
      .select('sport_id')
      .eq('sport_name', body.sport_name)
      .single()

    if (existingName) {
      return NextResponse.json(
        { error: 'Sport name already exists' },
        { status: 409 }
      )
    }

    // Insert new sport
    const { data, error } = await supabase
      .from('sports')
      .insert([
        {
          sport_name: body.sport_name,
          sport_code: body.sport_code,
          icon_url: body.icon_url,
          display_order: body.display_order || 0,
          is_active: body.is_active !== undefined ? body.is_active : true,
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating sport:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create sport' },
      { status: 500 }
    )
  }
}