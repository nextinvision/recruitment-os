import React from 'react'
import { LoginResponse } from '../shared/types'

interface DashboardProps {
  user: LoginResponse['user']
  stagingJobCount: number
  onViewStaging: () => void
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  stagingJobCount,
  onViewStaging,
  onLogout,
}) => {
  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            Welcome, {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {user.email} • {user.role}
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px' }}>
        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            border: '1px solid #c8e6c9'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#2e7d32', marginBottom: '4px' }}>
              {stagingJobCount}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Jobs in Staging
            </div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#1976d2', marginBottom: '4px' }}>
              Ready
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Extension Active
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            How to Capture Jobs
          </h3>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#333' }}>
            <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Step 1: Visit Job Portal</div>
              <div>Go to LinkedIn, Indeed, or Naukri job listing pages</div>
            </div>
            <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Step 2: Click "Capture Jobs"</div>
              <div>A blue button will appear on the top-right of the page</div>
            </div>
            <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Step 3: Review & Submit</div>
              <div>Open this popup to review captured jobs and submit them</div>
            </div>
          </div>
        </div>

        {/* Supported Platforms */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Supported Platforms
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['LinkedIn', 'Indeed', 'Naukri'].map((platform) => (
              <div
                key={platform}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {platform}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onViewStaging}
            style={{
              padding: '12px',
              backgroundColor: stagingJobCount > 0 ? '#0073b1' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: stagingJobCount > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {stagingJobCount > 0 
              ? `View Staging Area (${stagingJobCount} job${stagingJobCount > 1 ? 's' : ''})`
              : 'Staging Area (Empty)'
            }
          </button>
          
          <a
            href="https://www.linkedin.com/jobs/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '12px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block'
            }}
          >
            Open LinkedIn Jobs →
          </a>
        </div>
      </div>
    </div>
  )
}

