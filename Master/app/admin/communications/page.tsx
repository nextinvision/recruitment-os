'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataTable } from '@/ui/DataTable'
import { Modal } from '@/ui/Modal'
import { TemplateBuilder } from '@/ui/TemplateBuilder'

interface MessageTemplate {
  id: string
  name: string
  type: string
  channel: string
  subject?: string
  content: string
  variables: string[]
  enabled: boolean
  createdAt: string
  creator: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

interface Message {
  id: string
  channel: string
  recipientType: string
  recipientId: string
  recipientPhone?: string
  recipientEmail?: string
  subject?: string
  content: string
  status: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  errorMessage?: string
  createdAt: string
  template?: {
    id: string
    name: string
  } | null
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function CommunicationsPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'templates' | 'messages'>('templates')
  const [messageFilters, setMessageFilters] = useState({
    channel: '',
    status: '',
    recipientType: '',
  })

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/messages/templates', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    setMessagesLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (messageFilters.channel) params.append('channel', messageFilters.channel)
      if (messageFilters.status) params.append('status', messageFilters.status)
      if (messageFilters.recipientType) params.append('recipientType', messageFilters.recipientType)
      params.append('limit', '100')

      const response = await fetch(`/api/messages?${params.toString()}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, messageFilters.channel, messageFilters.status, messageFilters.recipientType])

  const handleCreate = () => {
    setEditingTemplate(null)
    setShowModal(true)
  }

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setShowModal(true)
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/messages/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        await loadTemplates()
      }
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Template Name',
      render: (template: MessageTemplate) => (
        <div>
          <div className="font-medium text-gray-900">{template.name}</div>
          <div className="text-sm text-gray-500">{template.type}</div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (template: MessageTemplate) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          template.channel === 'WHATSAPP' ? 'bg-green-100 text-green-800' :
          template.channel === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {template.channel}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (template: MessageTemplate) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          template.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {template.enabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template: MessageTemplate) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(template)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(template.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-sm text-gray-600 mt-1">Manage message templates and view message logs</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Template
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Message Logs
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'templates' && (
          <DataTable
            data={templates}
            columns={columns}
            searchable
            searchPlaceholder="Search templates..."
          />
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={messageFilters.channel}
                    onChange={(e) => setMessageFilters({ ...messageFilters, channel: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Channels</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={messageFilters.status}
                    onChange={(e) => setMessageFilters({ ...messageFilters, status: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="SENT">Sent</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="READ">Read</option>
                    <option value="FAILED">Failed</option>
                    <option value="BOUNCED">Bounced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                  <select
                    value={messageFilters.recipientType}
                    onChange={(e) => setMessageFilters({ ...messageFilters, recipientType: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="candidate">Candidate</option>
                    <option value="client">Client</option>
                    <option value="lead">Lead</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages Table */}
            {messagesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <DataTable
                data={messages}
                columns={[
                  {
                    key: 'recipient',
                    header: 'Recipient',
                    render: (message: Message) => (
                      <div>
                        <div className="font-medium text-gray-900">
                          {message.recipientEmail || message.recipientPhone || message.recipientId}
                        </div>
                        <div className="text-sm text-gray-500">{message.recipientType}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'channel',
                    header: 'Channel',
                    render: (message: Message) => (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        message.channel === 'WHATSAPP' ? 'bg-green-100 text-green-800' :
                        message.channel === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.channel}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (message: Message) => (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        message.status === 'SENT' || message.status === 'DELIVERED' || message.status === 'READ' ? 'bg-green-100 text-green-800' :
                        message.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        message.status === 'FAILED' || message.status === 'BOUNCED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.status}
                      </span>
                    ),
                  },
                  {
                    key: 'template',
                    header: 'Template',
                    render: (message: Message) => (
                      <span className="text-sm text-gray-600">
                        {message.template?.name || 'Direct Message'}
                      </span>
                    ),
                  },
                  {
                    key: 'sender',
                    header: 'Sent By',
                    render: (message: Message) => (
                      <span className="text-sm text-gray-600">
                        {message.sender.firstName} {message.sender.lastName}
                      </span>
                    ),
                  },
                  {
                    key: 'sentAt',
                    header: 'Sent At',
                    render: (message: Message) => (
                      <span className="text-sm text-gray-600">
                        {message.sentAt ? new Date(message.sentAt).toLocaleString() : '-'}
                      </span>
                    ),
                  },
                ]}
                searchable
                searchPlaceholder="Search messages..."
              />
            )}
          </div>
        )}

        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setEditingTemplate(null)
              loadTemplates()
            }}
            title={editingTemplate ? 'Edit Template' : 'Create Template'}
          >
            <TemplateBuilder
              template={editingTemplate}
              onSave={() => {
                setShowModal(false)
                setEditingTemplate(null)
                loadTemplates()
              }}
              onCancel={() => {
                setShowModal(false)
                setEditingTemplate(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

