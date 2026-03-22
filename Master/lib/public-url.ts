import type { NextRequest } from 'next/server'

/**
 * Absolute public base URL for links in emails, SMS, etc.
 * Prefer env in production; fall back to request headers when the app is behind a proxy.
 */
export function getPublicAppUrl(request?: NextRequest | null): string {
    const fromEnv =
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        process.env.APP_URL?.trim() ||
        process.env.VERCEL_URL?.trim()
    if (fromEnv) {
        const u = fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`
        return u.replace(/\/$/, '')
    }

    if (request) {
        const origin = request.headers.get('origin')
        if (origin && /^https?:\/\//i.test(origin)) {
            return origin.replace(/\/$/, '')
        }
        const forwardedHost = request.headers.get('x-forwarded-host')
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
        if (forwardedHost) {
            return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`.replace(/\/$/, '')
        }
        const host = request.headers.get('host')
        if (host) {
            const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'
            return `${proto}://${host}`.replace(/\/$/, '')
        }
    }

    return 'http://localhost:3000'
}
