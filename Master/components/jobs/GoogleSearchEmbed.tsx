'use client'

import { useEffect, useRef } from 'react'

interface GoogleSearchEmbedProps {
  searchEngineId: string
  className?: string
}

/**
 * Google Custom Search Engine Embed Component
 * Embeds Google's search interface directly on the page
 * This provides a live search experience for users
 * 
 * Usage:
 * <GoogleSearchEmbed searchEngineId="your-search-engine-id" />
 */
export function GoogleSearchEmbed({ searchEngineId, className = '' }: GoogleSearchEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (!searchEngineId) {
      console.warn('Google Search Engine ID not provided')
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="cse.google.com/cse.js?cx=${searchEngineId}"]`)
    if (existingScript) {
      // Script already loaded, just render the search box
      if (containerRef.current && !containerRef.current.querySelector('.gcse-search')) {
        const searchDiv = document.createElement('div')
        searchDiv.className = 'gcse-search'
        containerRef.current.appendChild(searchDiv)
      }
      return
    }

    // Load Google CSE script
    const script = document.createElement('script')
    script.src = `https://cse.google.com/cse.js?cx=${searchEngineId}`
    script.async = true
    
    script.onload = () => {
      scriptLoadedRef.current = true
      // Trigger Google CSE to render
      if (window.google && (window.google as any).cse) {
        (window.google as any).cse.element.render(containerRef.current)
      }
    }
    
    script.onerror = () => {
      console.error('Failed to load Google Custom Search Engine script')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup: Remove script if component unmounts
      // Note: We keep it for performance, but you can remove if needed
    }
  }, [searchEngineId])

  return (
    <div className={`google-search-embed ${className}`}>
      <div 
        ref={containerRef} 
        className="gcse-search"
        data-gname="jobsearch"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      cse?: {
        element?: {
          render: (container: HTMLElement | null) => void
        }
      }
    }
  }
}

