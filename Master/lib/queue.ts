import { Queue, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

/**
 * Get Redis connection configuration for BullMQ
 * BullMQ requires maxRetriesPerRequest: null for blocking operations
 * Uses the same authentication logic as the main Redis client
 */
function getQueueConnection(): Redis {
  const redisUrl = process.env.REDIS_URL
  const redisPassword = process.env.REDIS_PASSWORD
  const redisHost = process.env.REDIS_HOST || 'localhost'
  const redisPort = parseInt(process.env.REDIS_PORT || '6380')

  // Base connection options for BullMQ
  // BullMQ requires maxRetriesPerRequest: null for blocking commands
  const baseOptions = {
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: null as null, // Required by BullMQ for blocking operations
    enableReadyCheck: true,
    lazyConnect: false,
  }

  // If REDIS_URL is provided, use it
  if (redisUrl) {
    return new Redis(redisUrl, {
      ...baseOptions,
      password: redisPassword,
    })
  }

  // Otherwise, use host/port/password configuration
  return new Redis({
    ...baseOptions,
    host: redisHost,
    port: redisPort,
    password: redisPassword || 'recruitment_redis_password',
  })
}

// Create a shared Redis connection for BullMQ
// BullMQ can share the same connection or use separate ones
const queueConnection = getQueueConnection()

// Handle connection errors
queueConnection.on('error', (err) => {
  console.error('[Queue] Redis Connection Error:', err)
})

queueConnection.on('connect', () => {
  console.log('[Queue] Redis connected successfully')
})

queueConnection.on('ready', () => {
  console.log('[Queue] Redis ready for queue operations')
})

// Follow-up automation queue
export const followUpQueue = new Queue('follow-up-automation', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
})

// Queue events for monitoring
export const followUpQueueEvents = new QueueEvents('follow-up-automation', {
  connection: queueConnection,
})

// Export queue connection for workers
export { queueConnection }
