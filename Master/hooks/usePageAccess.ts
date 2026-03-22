'use client'

import { useState, useEffect, useCallback } from 'react'
import { canAccessPath } from '@/lib/page-access'
import type { PageAccessRules } from '@/lib/page-access'

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
}

let cachedRules: PageAccessRules | null = null
let lastFetchTime = 0
const CACHE_DURATION = 60000 // 1 minute

export function usePageAccess() {
    const [user, setUser] = useState<User | null>(null)
    const [pageRules, setPageRules] = useState<PageAccessRules | null>(cachedRules)
    const [loading, setLoading] = useState(!cachedRules)

    useEffect(() => {
        // Get user from localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
            try {
                setUser(JSON.parse(userData))
            } catch (err) {
                console.error('Failed to parse user data from localStorage', err)
            }
        }

        // Fetch page rules if not cached or cache expired
        const now = Date.now()
        if (!cachedRules || now - lastFetchTime > CACHE_DURATION) {
            setLoading(true)
            fetch('/api/access/page-rules', { credentials: 'include' })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data?.rules) {
                        cachedRules = data.rules
                        lastFetchTime = Date.now()
                        setPageRules(data.rules)
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch page rules', err)
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            setLoading(false)
        }
    }, [])

    const canAccess = useCallback(
        (path: string) => {
            if (loading || !pageRules || !user) return true // Default to true while loading or if missing info
            return canAccessPath(path, user.role, pageRules)
        },
        [loading, pageRules, user]
    )

    return {
        user,
        pageRules,
        loading,
        canAccess,
    }
}
