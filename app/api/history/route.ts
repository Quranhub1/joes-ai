import { NextRequest, NextResponse } from 'next/server'

const JSONBIN_API = 'https://api.jsonbin.io/v3/b'

export async function GET() {
  const binId = process.env.JSONBIN_BIN_ID
  const masterKey = process.env.JSONBIN_MASTER_KEY

  if (!binId || !masterKey) {
    // Return empty history if not configured
    return NextResponse.json({ records: [] })
  }

  try {
    const res = await fetch(`${JSONBIN_API}/${binId}/latest`, {
      headers: {
        'X-Master-Key': masterKey
      }
    })

    if (!res.ok) {
      // Bin might not exist yet, return empty
      return NextResponse.json({ records: [] })
    }

    const data = await res.json()
    return NextResponse.json(data.record || { records: [] })
  } catch (error) {
    console.error('Failed to fetch history:', error)
    return NextResponse.json({ records: [] })
  }
}

export async function POST(request: NextRequest) {
  const binId = process.env.JSONBIN_BIN_ID
  const masterKey = process.env.JSONBIN_MASTER_KEY

  if (!binId || !masterKey) {
    return NextResponse.json({ error: 'JSONBin not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    
    const res = await fetch(`${JSONBIN_API}/${binId}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': masterKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to save history' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save history:', error)
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 })
  }
}