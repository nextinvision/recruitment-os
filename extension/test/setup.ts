import { chromeMock } from './helpers/chrome-mock'

// Setup Chrome API mocks globally
if (typeof global !== 'undefined') {
  (global as any).chrome = chromeMock
}

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://www.linkedin.com/jobs/',
    pathname: '/jobs/',
    hostname: 'www.linkedin.com'
  },
  writable: true
})

