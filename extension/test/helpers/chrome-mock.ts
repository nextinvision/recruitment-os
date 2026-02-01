/**
 * Chrome API Mock for Testing
 * Use this in your tests to mock Chrome extension APIs
 */

export const chromeMock = {
  storage: {
    local: {
      data: {} as Record<string, any>,
      get: jest.fn((keys: string | string[] | null, callback: (result: any) => void) => {
        const result: any = {}
        if (keys === null) {
          Object.assign(result, chromeMock.storage.local.data)
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = chromeMock.storage.local.data[key]
          })
        } else {
          result[keys] = chromeMock.storage.local.data[keys]
        }
        callback(result)
      }),
      set: jest.fn((data: Record<string, any>, callback?: () => void) => {
        Object.assign(chromeMock.storage.local.data, data)
        if (callback) callback()
      }),
      remove: jest.fn((keys: string | string[], callback?: () => void) => {
        if (Array.isArray(keys)) {
          keys.forEach(key => delete chromeMock.storage.local.data[key])
        } else {
          delete chromeMock.storage.local.data[keys]
        }
        if (callback) callback()
      })
    }
  },
  runtime: {
    sendMessage: jest.fn((message: any, callback?: (response: any) => void) => {
      // Mock message handling
      if (callback) {
        setTimeout(() => {
          callback({ success: true, data: {} })
        }, 0)
      }
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
}

// Make it available globally for tests
if (typeof global !== 'undefined') {
  (global as any).chrome = chromeMock
}

