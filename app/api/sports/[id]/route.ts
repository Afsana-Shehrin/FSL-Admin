import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sportId = parseInt(params.id)
    if (isNaN(sportId)) {
      return NextResponse.json(
        { error: 'Invalid sport ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Check if sport exists
    const { data: existingSport } = await supabase
      .from('sports')
      .select('*')
      .eq('sport_id', sportId)
      .single()

    if (!existingSport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 404 }
      )
    }

    // If updating sport code, check if it already exists
    if (body.sport_code && body.sport_code !== existingSport.sport_code) {
      const { data: existingCode } = await supabase
        .from('sports')
        .select('sport_id')
        .eq('sport_code', body.sport_code)
        .neq('sport_id', sportId)
        .single()

      if (existingCode) {
        return NextResponse.json(
          { error: 'Sport code already exists' },
          { status: 409 }
        )
      }
    }

    // If updating sport name, check if it already exists
    if (body.sport_name && body.sport_name !== existingSport.sport_name) {
      const { data: existingName } = await supabase
        .from('sports')
        .select('sport_id')
        .eq('sport_name', body.sport_name)
        .neq('sport_id', sportId)
        .single()

      if (existingName) {
        return NextResponse.json(
          { error: 'Sport name already exists' },
          { status: 409 }
        )
      }
    }

    // Update sport
    const { data, error } = await supabase
      .from('sports')
      .update({
        sport_name: body.sport_name,
        sport_code: body.sport_code,
        icon_url: body.icon_url,
        display_order: body.display_order,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('sport_id', sportId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating sport:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update sport' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sportId = parseInt(params.id)
    if (isNaN(sportId)) {
      return NextResponse.json(
        { error: 'Invalid sport ID' },
        { status: 400 }
      )
    }

    // Check if sport exists
    const { data: existingSport } = await supabase
      .from('sports')
      .select('sport_id')
      .eq('sport_id', sportId)
      .single()

    if (!existingSport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 404 }
      )
    }

    // Delete sport
    const { error } = await supabase
      .from('sports')
      .delete()
      .eq('sport_id', sportId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting sport:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete sport' },
      { status: 500 }
    )
  }
}