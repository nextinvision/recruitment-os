import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

const getRedisClient = () => {
  if (globalForRedis.redis) {
    return globalForRedis.redis
  }

  const redisUrl = process.env.REDIS_URL
  const redisPassword = process.env.REDIS_PASSWORD
  const redisHost = process.env.REDIS_HOST || 'localhost'
  const redisPort = parseInt(process.env.REDIS_PORT || '6380')

  // Use connection string if provided
  if (redisUrl) {
    const client = new Redis(redisUrl, {
      password: redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
    })

    client.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    globalForRedis.redis = client
    return client
  }

  // Otherwise, use host/port/password configuration
  const client = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword || 'recruitment_redis_password',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: 3,
  })

  client.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  globalForRedis.redis = client
  return client
}

export const redis = getRedisClient()

/**
 * Cache helper functions
 */
export class CacheService {
  private client: Redis

  constructor() {
    this.client = redis
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set value in cache with optional TTL (time to live in seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.client.setex(key, ttl, serialized)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      })

      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          await this.client.del(...keys)
        }
      })

      await new Promise<void>((resolve, reject) => {
        stream.on('end', resolve)
        stream.on('error', reject)
      })
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, by = 1): Promise<number> {
    try {
      return await this.client.incrby(key, by)
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return 0
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds)
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error)
    }
  }
}

export const cacheService = new CacheService()

