import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    stats: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      averageResponseTime: 0
    },
    timestamp: new Date().toISOString(),
    period: '24 hours'
  })
}