interface QueuedRequest {
  id: string
  request: Request
  resolve: (value: Response) => void
  reject: (error: Error) => void
  timestamp: number
}

class RequestQueue {
  private queue: QueuedRequest[] = []
  private processing = false
  private requestInterval = 100 // ms between requests (10 requests/second max)

  async add(request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: Math.random().toString(36).substring(7),
        request,
        resolve,
        reject,
        timestamp: Date.now()
      }

      this.queue.push(queuedRequest)
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const queuedRequest = this.queue.shift()
      if (!queuedRequest) continue

      try {
        // Forward the request to the actual handler
        const response = await fetch(queuedRequest.request)
        queuedRequest.resolve(response)
      } catch (error) {
        queuedRequest.reject(error as Error)
      }

      // Wait before processing next request
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestInterval))
      }
    }

    this.processing = false
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getStats(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    }
  }
}

// Global queue instance
export const imageGenerationQueue = new RequestQueue()