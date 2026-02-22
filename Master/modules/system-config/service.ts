import { db } from '@/lib/db'
import { z } from 'zod'
import { PAGE_ACCESS_CONFIG_KEY } from '@/lib/page-access'
import type { PageAccessRules } from '@/lib/page-access'

export const systemConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.enum(['whatsapp', 'ai', 'email', 'system', 'limits', 'permissions']),
  description: z.string().optional(),
})

export type SystemConfigInput = z.infer<typeof systemConfigSchema>

export class SystemConfigService {
  /**
   * Get all system configurations
   */
  async getAllConfigs() {
    return db.systemConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
      include: {
        updater: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  /**
   * Get configuration by key
   */
  async getConfigByKey(key: string) {
    return db.systemConfig.findUnique({
      where: { key },
      include: {
        updater: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  /**
   * Get configurations by category
   */
  async getConfigsByCategory(category: string) {
    return db.systemConfig.findMany({
      where: { category },
      orderBy: { key: 'asc' },
      include: {
        updater: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  /**
   * Create or update configuration
   */
  async setConfig(input: SystemConfigInput & { updatedBy: string }) {
    const existing = await db.systemConfig.findUnique({
      where: { key: input.key },
    })

    if (existing) {
      return db.systemConfig.update({
        where: { key: input.key },
        data: {
          value: input.value,
          category: input.category,
          description: input.description,
          updatedBy: input.updatedBy,
        },
        include: {
          updater: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    } else {
      return db.systemConfig.create({
        data: {
          key: input.key,
          value: input.value,
          category: input.category,
          description: input.description,
          updatedBy: input.updatedBy,
        },
        include: {
          updater: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfig(key: string) {
    return db.systemConfig.delete({
      where: { key },
    })
  }

  /**
   * Get configuration value as string
   */
  async getValue(key: string): Promise<string | null> {
    const config = await db.systemConfig.findUnique({
      where: { key },
      select: { value: true },
    })
    return config?.value || null
  }

  /**
   * Get configuration value as number
   */
  async getNumberValue(key: string): Promise<number | null> {
    const value = await this.getValue(key)
    if (!value) return null
    const num = parseFloat(value)
    return isNaN(num) ? null : num
  }

  /**
   * Get configuration value as boolean
   */
  async getBooleanValue(key: string): Promise<boolean | null> {
    const value = await this.getValue(key)
    if (!value) return null
    return value.toLowerCase() === 'true' || value === '1'
  }

  /**
   * Get page access rules (path -> roles[]) from config. Returns null if not set.
   */
  async getPageAccessRules(): Promise<PageAccessRules | null> {
    const raw = await this.getValue(PAGE_ACCESS_CONFIG_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as PageAccessRules
      }
    } catch {
      // ignore
    }
    return null
  }

  /**
   * Save page access rules. Overwrites existing config for PAGE_ACCESS_CONFIG_KEY.
   */
  async setPageAccessRules(rules: PageAccessRules, updatedBy: string) {
    return this.setConfig({
      key: PAGE_ACCESS_CONFIG_KEY,
      value: JSON.stringify(rules),
      category: 'permissions',
      description: 'Role-based page access: path -> list of role names',
      updatedBy,
    })
  }
}

export const systemConfigService = new SystemConfigService()

