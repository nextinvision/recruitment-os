import React, { useState } from 'react'
import { TestResult } from '../shared/api-tester'
import { ApiTester } from '../shared/api-tester'
import { getBackendUrl } from '../shared/constants'
import { STORAGE_KEYS } from '../shared/constants'

export const ApiTestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [token, setToken] = useState<string | null>(null)

  React.useEffect(() => {
    // Load token from storage
    chrome.storage.local.get([STORAGE_KEYS.TOKEN], (result) => {
      if (result[STORAGE_KEYS.TOKEN]) {
        setToken(result[STORAGE_KEYS.TOKEN])
      }
    })
  }, [])

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    const tester = new ApiTester(getBackendUrl())
    
    if (token) {
      tester.setToken(token)
    }

    try {
      // Test login first
      console.log('🧪 Testing login...')
      const loginResult = await tester.testLogin()
      const newResults: TestResult[] = [loginResult]

      // If login successful, extract token and user ID
      if (loginResult.status === 'pass') {
        // Login to get token and user ID
        const loginResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@recruitment.com',
            password: 'admin123',
          }),
        })
        
        if (loginResponse.ok) {
          const data = await loginResponse.json()
          const newToken = data.token
          const userId = data.user?.id
          
          tester.setToken(newToken)
          if (userId) {
            tester.setUserId(userId)
            console.log('✅ User ID extracted:', userId)
          } else {
            console.warn('⚠️ User ID not found in login response')
          }
          
          setToken(newToken)
        } else if (token) {
          // Use existing token if login test passed but we already have token
          tester.setToken(token)
          
          // Try to get user ID from stored user data
          const storageResult = await new Promise<any>((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.USER], resolve)
          })
          
          if (storageResult[STORAGE_KEYS.USER]?.id) {
            tester.setUserId(storageResult[STORAGE_KEYS.USER].id)
            console.log('✅ User ID from storage:', storageResult[STORAGE_KEYS.USER].id)
          }
        }

        // Run authenticated tests
        newResults.push(await tester.testGetJobs())
        newResults.push(await tester.testCreateJob())
        newResults.push(await tester.testBulkJobs())
        newResults.push(await tester.testGetCandidates())
        newResults.push(await tester.testCreateCandidate())
        newResults.push(await tester.testGetApplications())
      }

      setResults(newResults)
    } catch (error) {
      console.error('Test error:', error)
      setResults([
        {
          endpoint: 'All Tests',
          method: 'TEST',
          status: 'fail',
          message: `❌ Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ])
    } finally {
      setIsRunning(false)
    }
  }

  const passCount = results.filter((r) => r.status === 'pass').length
  const failCount = results.filter((r) => r.status === 'fail').length
  const skipCount = results.filter((r) => r.status === 'skip').length

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
        API Test Suite
      </h2>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={runTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: isRunning ? '#ccc' : '#0073b1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>
              ✅ Pass: {passCount}
            </span>
            <span style={{ color: '#c33', fontWeight: 600 }}>
              ❌ Fail: {failCount}
            </span>
            <span style={{ color: '#666', fontWeight: 600 }}>
              ⏭️ Skip: {skipCount}
            </span>
          </div>
        </div>
      )}

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              marginBottom: '8px',
              backgroundColor:
                result.status === 'pass'
                  ? '#e8f5e9'
                  : result.status === 'fail'
                  ? '#ffebee'
                  : '#f5f5f5',
              borderRadius: '4px',
              fontSize: '13px',
              borderLeft: `4px solid ${
                result.status === 'pass'
                  ? '#2e7d32'
                  : result.status === 'fail'
                  ? '#c33'
                  : '#666'
              }`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {result.message}
            </div>
            {result.statusCode && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Status: {result.statusCode} | Duration: {result.duration}ms
              </div>
            )}
            {result.error && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#c33',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                }}
              >
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Click "Run All Tests" to test all APIs
        </div>
      )}
    </div>
  )
}

