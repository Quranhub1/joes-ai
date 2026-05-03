interface UsageRecord {
  timestamp: number
  endpoint: string
  method: string
  userId?: string
  ip?: string
  success: boolean
  duration: number
  cached?: boolean
}

// In-memory usage tracking (in production, use a database)
const usageRecords: UsageRecord[] = []
const MAX_USAGE_RECORDS = 10000

export function trackUsage(record: Omit<UsageRecord, 'timestamp'>): void {
  const fullRecord: UsageRecord = {
    ...record,
    timestamp: Date.now()
  }

  usageRecords.push(fullRecord)

  // Keep only recent records
  if (usageRecords.length > MAX_USAGE_RECORDS) {
    usageRecords.splice(0, usageRecords.length - MAX_USAGE_RECORDS)
  }
}

export function getUsageStats(hours: number = 24): {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cachedRequests: number
  averageResponseTime: number
  requestsByEndpoint: Record<string, number>
  requestsByHour: Array<{ hour: string; count: number }>
} {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000)
  const recentRecords = usageRecords.filter(r => r.timestamp > cutoff)

  const totalRequests = recentRecords.length
  const successfulRequests = recentRecords.filter(r => r.success).length
  const failedRequests = totalRequests - successfulRequests
  const cachedRequests = recentRecords.filter(r => r.cached).length

  const responseTimes = recentRecords.map(r => r.duration).filter(t => t > 0)
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0

  const requestsByEndpoint: Record<string, number> = {}
  recentRecords.forEach(record => {
    requestsByEndpoint[record.endpoint] = (requestsByEndpoint[record.endpoint] || 0) + 1
  })

  // Group by hour
  const requestsByHour: Array<{ hour: string; count: number }> = []
  const hourMap = new Map<string, number>()

  recentRecords.forEach(record => {
    const hour = new Date(record.timestamp).toISOString().substring(0, 13) + ':00'
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  })

  hourMap.forEach((count, hour) => {
    requestsByHour.push({ hour, count })
  })

  requestsByHour.sort((a, b) => a.hour.localeCompare(b.hour))

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    cachedRequests,
    averageResponseTime,
    requestsByEndpoint,
    requestsByHour
  }
}

// Clean up old records periodically
setInterval(() => {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // Keep 7 days
  const initialLength = usageRecords.length
  const filteredRecords = usageRecords.filter(r => r.timestamp > cutoff)
  usageRecords.length = 0
  usageRecords.push(...filteredRecords)

  if (initialLength !== filteredRecords.length) {
    console.log(`Cleaned up ${initialLength - filteredRecords.length} old usage records`)
  }
}, 60 * 60 * 1000) // Clean up every hour