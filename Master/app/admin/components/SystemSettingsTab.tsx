'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Textarea, Button, Spinner } from '@/ui'
import { PAGES, ROLES } from '@/lib/page-access'
import type { PageAccessRules } from '@/lib/page-access'

interface SystemConfig {
  id: string
  key: string
  value: string
  category: 'whatsapp' | 'ai' | 'email' | 'system' | 'limits'
  description?: string
  updatedBy: string
  updatedAt: string
  createdAt: string
  updater: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

type SettingsCategory = 'whatsapp' | 'ai' | 'email' | 'system' | 'limits' | 'permissions'

const CATEGORY_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp Integration',
  ai: 'AI Services',
  email: 'Email Settings',
  system: 'System Settings',
  limits: 'System Limits',
  permissions: 'Page Access',
}

const DEFAULT_CONFIGS = {
  whatsapp: [
    { key: 'whatsapp.business_account_id', value: '', description: 'WhatsApp Business Account ID' },
    { key: 'whatsapp.phone_number_id', value: '', description: 'WhatsApp Phone Number ID' },
    { key: 'whatsapp.access_token', value: '', description: 'WhatsApp Access Token', type: 'password' },
  ],
  ai: [
    { key: 'ai.provider', value: 'openai', description: 'AI Service Provider (openai, anthropic, etc.)' },
    { key: 'ai.api_key', value: '', description: 'OpenAI API Key', type: 'password' },
    { key: 'ai.model', value: 'gpt-4', description: 'AI Model to use' },
    { key: 'ai.enable_resume_analysis', value: 'true', description: 'Enable Resume Analysis' },
    { key: 'ai.enable_linkedin_optimization', value: 'true', description: 'Enable LinkedIn Optimization' },
    { key: 'ai.enable_job_matching', value: 'true', description: 'Enable Job-Candidate Matching' },
  ],
  email: [
    { key: 'email.smtp_host', value: '', description: 'SMTP Host' },
    { key: 'email.smtp_port', value: '587', description: 'SMTP Port' },
    { key: 'email.smtp_user', value: '', description: 'SMTP Username' },
    { key: 'email.smtp_password', value: '', description: 'SMTP Password', type: 'password' },
    { key: 'email.from_address', value: '', description: 'From Email Address' },
    { key: 'email.from_name', value: 'Recruitment OS', description: 'From Name' },
  ],
  system: [
    { key: 'system.default_timezone', value: 'UTC', description: 'Default Timezone' },
    { key: 'system.date_format', value: 'YYYY-MM-DD', description: 'Date Format' },
    { key: 'system.time_format', value: 'HH:mm', description: 'Time Format' },
  ],
  limits: [
    { key: 'limits.job_scraping_per_day', value: '100', description: 'Maximum jobs to scrape per day' },
    { key: 'limits.file_upload_size_mb', value: '10', description: 'Maximum file upload size (MB)' },
    { key: 'limits.resume_analysis_per_day', value: '50', description: 'Maximum resume analyses per day' },
  ],
}

interface SystemSettingsTabProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function SystemSettingsTab({ showToast }: SystemSettingsTabProps) {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('whatsapp')
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({ value: '', description: '' })
  const [pageRules, setPageRules] = useState<PageAccessRules | null>(null)
  const [pageRulesLoading, setPageRulesLoading] = useState(false)
  const [pageRulesSaving, setPageRulesSaving] = useState(false)

  useEffect(() => {
    if (activeCategory === 'permissions') {
      loadPageRules()
    } else {
      loadConfigs()
    }
  }, [activeCategory])

  const loadPageRules = async () => {
    setPageRulesLoading(true)
    try {
      const res = await fetch('/api/access/page-rules', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPageRules(data.rules ?? {})
      } else {
        showToast('Failed to load page access rules', 'error')
      }
    } catch (err) {
      console.error('Failed to load page rules:', err)
      showToast('Failed to load page access rules', 'error')
    } finally {
      setPageRulesLoading(false)
    }
  }

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/system-config?category=${activeCategory}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      } else {
        showToast('Failed to load system configuration', 'error')
      }
    } catch (err) {
      console.error('Failed to load configs:', err)
      showToast('Failed to load system configuration', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: SystemConfig) => {
    setEditingConfig(config)
    setFormData({
      value: config.value,
      description: config.description || '',
    })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!editingConfig) return

    setSaving(editingConfig.key)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/system-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          key: editingConfig.key,
          value: formData.value,
          category: editingConfig.category,
          description: formData.description || undefined,
        }),
      })

      if (response.ok) {
        showToast('Configuration saved successfully', 'success')
        setShowEditModal(false)
        setEditingConfig(null)
        loadConfigs()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to save configuration', 'error')
      }
    } catch (err) {
      console.error('Failed to save config:', err)
      showToast('Failed to save configuration', 'error')
    } finally {
      setSaving(null)
    }
  }

  const handleCreate = (key: string, category: string, description: string) => {
    setEditingConfig({
      id: '',
      key,
      value: '',
      category: category as any,
      description,
      updatedBy: '',
      updatedAt: '',
      createdAt: '',
      updater: {
        id: '',
        email: '',
        firstName: '',
        lastName: '',
      },
    })
    setFormData({ value: '', description })
    setShowEditModal(true)
  }

  const getConfig = (key: string): SystemConfig | undefined => {
    return configs.find((c) => c.key === key)
  }

  const handlePageRuleToggle = (path: string, role: string, checked: boolean) => {
    if (!pageRules) return
    const current = pageRules[path] ?? []
    const next = checked ? [...current, role] : current.filter((r) => r !== role)
    setPageRules({ ...pageRules, [path]: next })
  }

  const handleSavePageRules = async () => {
    if (!pageRules) return
    setPageRulesSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('Not authenticated', 'error')
        return
      }
      const res = await fetch('/api/access/page-rules', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rules: pageRules }),
      })
      if (res.ok) {
        showToast('Page access rules saved successfully', 'success')
        const data = await res.json()
        setPageRules(data.rules ?? pageRules)
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save page access rules', 'error')
      }
    } catch (err) {
      console.error('Failed to save page rules:', err)
      showToast('Failed to save page access rules', 'error')
    } finally {
      setPageRulesSaving(false)
    }
  }

  if (loading && activeCategory !== 'permissions') {
    return <Spinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
        <p className="mt-2 text-gray-700">Configure system-wide settings, integrations, and who can access which pages</p>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(Object.keys(CATEGORY_LABELS) as SettingsCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeCategory === category
                  ? 'border-[#1F3A5F] text-[#1F3A5F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </nav>
      </div>

      {/* Page Access (permissions) content */}
      {activeCategory === 'permissions' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Page Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose which roles can access each page. Changes apply to the sidebar and route access.
          </p>
          {pageRulesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : pageRules ? (
            <>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Page</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Path</th>
                      {ROLES.map((role) => (
                        <th key={role} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {PAGES.map(({ path, label }) => (
                      <tr key={path}>
                        <td className="px-4 py-3 text-sm text-gray-900">{label}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{path}</td>
                        {ROLES.map((role) => {
                          const roles = pageRules[path] ?? []
                          const checked = roles.includes(role)
                          return (
                            <td key={role} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => handlePageRuleToggle(path, role, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#1F3A5F] focus:ring-[#1F3A5F]"
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSavePageRules} disabled={pageRulesSaving}>
                  {pageRulesSaving ? 'Saving...' : 'Save page access rules'}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Configuration Content (non-permissions categories) */}
      {activeCategory !== 'permissions' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{CATEGORY_LABELS[activeCategory]}</h3>
          <div className="space-y-4">
            {(DEFAULT_CONFIGS as Record<string, typeof DEFAULT_CONFIGS.whatsapp>)[activeCategory]?.map((defaultConfig: { key: string; value: string; description: string; type?: string }) => {
            const existingConfig = getConfig(defaultConfig.key)
            const value = existingConfig ? existingConfig.value : defaultConfig.value

            return (
              <div key={defaultConfig.key} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {defaultConfig.description}
                    </label>
                    <div className="text-xs text-gray-500 mb-2">Key: {defaultConfig.key}</div>
                    {existingConfig ? (
                      <div className="text-sm text-gray-600">
                        {(defaultConfig as any).type === 'password' && value ? '••••••••' : value || '(empty)'}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Not configured</div>
                    )}
                    {existingConfig?.updater && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last updated by {existingConfig.updater.firstName} {existingConfig.updater.lastName} on{' '}
                        {new Date(existingConfig.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (existingConfig) {
                        handleEdit(existingConfig)
                      } else {
                        handleCreate(defaultConfig.key, activeCategory as string, defaultConfig.description)
                      }
                    }}
                  >
                    {existingConfig ? 'Edit' : 'Configure'}
                  </Button>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingConfig && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingConfig(null)
          }}
          title={`Configure ${editingConfig.key}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Value</label>
              {(editingConfig.key.includes('password') || editingConfig.key.includes('token') || editingConfig.key.includes('api_key')) ? (
                <Input
                  type="password"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Enter value..."
                />
              ) : editingConfig.key.includes('enable_') ? (
                <select
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F4B400] focus:border-[#F4B400]"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <Input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Enter value..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Optional description..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingConfig(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving === editingConfig.key}
              >
                {saving === editingConfig.key ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

