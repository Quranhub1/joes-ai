import { NextResponse } from 'next/server'
import { getUsageStats } from '../../../lib/usage-tracker'

export async function GET() {
  try {
    const stats = getUsageStats(24) // Last 24 hours

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
      period: '24 hours'
    })
  } catch (error) {
    console.error('Usage stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}