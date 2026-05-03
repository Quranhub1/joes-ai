import { NextResponse } from 'next/server'

// NextAuth is disabled - return error for all requests
export async function GET() {
  return NextResponse.json({ error: 'NextAuth is disabled' }, { status: 500 })
}

export async function POST() {
  return NextResponse.json({ error: 'NextAuth is disabled' }, { status: 500 })
}