'use client'

import React from 'react'
import { usePageAccess } from '@/hooks/usePageAccess'

interface AccessControlProps {
    path: string
    children: React.ReactNode
    /** If true, the children will be rendered even if access is denied, but might be disabled or have a "lock" icon.
     * For now, we just hide by default.
     */
    fallback?: React.ReactNode
}

/**
 * AccessControl component to conditionally render children based on user permissions for a given path.
 */
export function AccessControl({ path, children, fallback = null }: AccessControlProps) {
    const { canAccess, loading } = usePageAccess()

    if (loading) {
        // Optionally return a skeleton or nothing while loading
        // For dashboard cards, we might want to wait for loading to finish to avoid flickering
        return null
    }

    if (canAccess(path)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
