'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/ui/DataTable'
import { Modal } from '@/ui/Modal'
import { useToast, useConfirmDialog } from '@/ui'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  locked?: boolean
  lastLogin: string | null
  createdAt: string
  manager?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  _count?: {
    jobs: number
    candidates: number
    applications: number
  }
}

function isUser(u: unknown): u is User {
  return (
    u != null &&
    typeof u === 'object' &&
    'id' in u &&
    'email' in u &&
    'firstName' in u &&
    'lastName' in u &&
    'role' in u
  )
}

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface UserManagementTabProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function UserManagementTab({ showToast }: UserManagementTabProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const { showConfirm } = useConfirmDialog()

  useEffect(() => {
    loadUsers()
    loadManagers()
  }, [filterRole])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const url = filterRole !== 'all' 
        ? `/api/users?role=${filterRole}`
        : '/api/users'

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        const list = Array.isArray(data) ? data.filter(isUser) : []
        setUsers(list)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadManagers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users?role=MANAGER', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setManagers(data)
      }
    } catch (err) {
      console.error('Failed to load managers:', err)
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setShowCreateModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleResetPassword = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    showConfirm(
      'Reset Password',
      `Are you sure you want to reset the password for ${user?.firstName} ${user?.lastName}? A new password will need to be set.`,
      async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

          const response = await fetch(`/api/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ newPassword: tempPassword }),
          })

          if (response.ok) {
            showToast(`Password reset successfully. New password: ${tempPassword}`, 'success')
            loadUsers()
          } else {
            const error = await response.json()
            showToast(error.error || 'Failed to reset password', 'error')
          }
        } catch (err) {
          console.error('Failed to reset password:', err)
          showToast('Failed to reset password', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Reset Password',
        cancelText: 'Cancel',
      }
    )
  }

  const handleUnlockAccount = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    showConfirm(
      'Unlock Account',
      `Are you sure you want to unlock the account for ${user?.firstName} ${user?.lastName}?`,
      async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch(`/api/users/${userId}/unlock`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Account unlocked successfully', 'success')
            loadUsers()
          } else {
            const error = await response.json()
            showToast(error.error || 'Failed to unlock account', 'error')
          }
        } catch (err) {
          console.error('Failed to unlock account:', err)
          showToast('Failed to unlock account', 'error')
        }
      },
      {
        variant: 'warning',
        confirmText: 'Unlock',
        cancelText: 'Cancel',
      }
    )
  }

  const handleDeleteUser = async (userId: string) => {
    showConfirm(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('User deleted successfully', 'success')
            loadUsers()
          } else {
            const error = await response.json()
            showToast(error.error || 'Failed to delete user', 'error')
          }
        } catch (err) {
          console.error('Failed to delete user:', err)
          showToast('Failed to delete user', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: User) => (
        <div>
          <div className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-sm text-gray-700">{user?.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
          user?.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {user?.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user?.isActive ? 'Active' : 'Inactive'}
          </span>
          {user?.locked && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
              Locked
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      render: (user: User) => (
        <span className="text-sm text-gray-700">
          {user?.manager ? `${user.manager.firstName} ${user.manager.lastName}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'stats',
      header: 'Activity',
      render: (user: User) => (
        <div className="text-xs text-gray-700">
          {user?._count && (
            <>
              {user._count?.jobs} jobs • {user._count?.candidates} candidates • {user._count?.applications} applications
            </>
          )}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: User) => (
        <span className="text-sm text-gray-700">
          {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          {user && (
          <>
          <button
            onClick={() => handleEditUser(user)}
            className="text-[#1F3A5F] hover:text-[#F4B400] text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleResetPassword(user.id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            Reset Password
          </button>
          {user.locked && (
            <button
              onClick={() => handleUnlockAccount(user.id)}
              className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
            >
              Unlock
            </button>
          )}
          <button
            onClick={() => handleDeleteUser(user.id)}
            className="text-[#EF4444] hover:text-[#DC2626] text-sm font-medium transition-colors"
          >
            Delete
          </button>
          </>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage users, roles, and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-[#F4B400] text-[#1F3A5F] rounded-lg hover:bg-[#E0A300] focus:outline-none focus:ring-2 focus:ring-[#F4B400] focus:ring-offset-2 font-semibold transition-colors"
        >
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-900">Filter by Role:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="RECRUITER">Recruiter</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={users}
          columns={columns}
          searchable
          searchPlaceholder="Search users by name or email..."
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedUser(null)
        }}
        title="Create User"
        size="lg"
      >
        <UserForm
          user={null}
          managers={managers}
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedUser(null)
          }}
          showToast={showToast}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        title="Edit User"
        size="lg"
      >
        <UserForm
          user={selectedUser}
          managers={managers}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            loadUsers()
          }}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          showToast={showToast}
        />
      </Modal>
    </>
  )
}

function UserForm({
  user,
  managers,
  onSuccess,
  onCancel,
  showToast,
}: {
  user: User | null
  managers: Manager[]
  onSuccess: () => void
  onCancel: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'RECRUITER',
    isActive: user?.isActive !== undefined ? user.isActive : true,
    managerId: user?.manager?.id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated')
        return
      }

      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PATCH' : 'POST'

      const payload: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isActive: formData.isActive,
      }

      if (!user) {
        if (!formData.password || formData.password.trim() === '') {
          setError('Password is required for new users')
          setLoading(false)
          return
        }
        payload.password = formData.password
      } else if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password
      }

      if (formData.role === 'RECRUITER') {
        payload.managerId = formData.managerId && formData.managerId.trim() !== '' ? formData.managerId : null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast(user ? 'User updated successfully' : 'User created successfully', 'success')
        onSuccess()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save user' }))
        if (Array.isArray(errorData.error)) {
          setError(errorData.error.join(', '))
        } else if (typeof errorData.error === 'string') {
          setError(errorData.error)
        } else if (errorData.message) {
          setError(errorData.message)
        } else {
          setError('Failed to save user. Please check your input and try again.')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Failed to save user:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            First Name *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Password {user ? '(leave blank to keep current)' : '*'}
        </label>
        <input
          type="password"
          required={!user}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {!user && (
          <div className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters with uppercase, lowercase, number, and special character
          </div>
        )}
        {formData.password && (
          <div className="mt-2 space-y-1">
            <div className={`text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
              {formData.password.length >= 8 ? '✓' : '✗'} At least 8 characters
            </div>
            <div className={`text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
              {/[A-Z]/.test(formData.password) ? '✓' : '✗'} One uppercase letter
            </div>
            <div className={`text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
              {/[a-z]/.test(formData.password) ? '✓' : '✗'} One lowercase letter
            </div>
            <div className={`text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
              {/[0-9]/.test(formData.password) ? '✓' : '✗'} One number
            </div>
            <div className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
              {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '✗'} One special character
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Role *
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value, managerId: '' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="RECRUITER">Recruiter</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Status
          </label>
          <select
            value={formData.isActive ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {formData.role === 'RECRUITER' && managers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Manager (Optional)
          </label>
          <select
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.firstName} {manager.lastName} ({manager.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#F4B400] text-[#1F3A5F] rounded-lg hover:bg-[#E0A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F4B400] disabled:opacity-50 font-semibold transition-colors"
        >
          {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  )
}

