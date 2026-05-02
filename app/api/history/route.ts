import { NextRequest, NextResponse } from 'next/server'

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY

export async function GET() {
  if (!JSONBIN_BIN_ID || !JSONBIN_MASTER_KEY) {
    return NextResponse.json({ error: 'JSONBin is not configured' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_MASTER_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to read JSONBin')
    }

    const data = await response.json()
    return NextResponse.json({ data: data.record })
  } catch (error) {
    console.error('JSONBin read error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load JSONBin data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!JSONBIN_BIN_ID || !JSONBIN_MASTER_KEY) {
    return NextResponse.json({ error: 'JSONBin is not configured' }, { status: 400 })
  }

  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 })
    }

    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': JSONBIN_MASTER_KEY,
        'Content-Type': 'application/json',
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify({ messages, updatedAt: new Date().toISOString() })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update JSONBin')
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('JSONBin save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync chat history' },
      { status: 500 }
    )
  }
}
