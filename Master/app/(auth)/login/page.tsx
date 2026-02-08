'use client'

import { useState } from 'react'
import { Input, Button, Alert } from '@/ui'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirect') || '/dashboard'
        
        window.location.href = redirectTo
      } else {
        setError(data.error || 'Login failed. Please check your credentials.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1F3A5F] via-[#1F3A5F] to-[#152A4A] relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Accent Gradient Overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F4B400] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F4B400] opacity-5 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#F4B400] via-[#F4B400] to-[#E0A300] bg-clip-text text-transparent">
                Careerist
              </span>
            </h1>
            <p className="text-xl text-white/90 font-light">
              Recruitment Management System
            </p>
          </div>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-[#F4B400]/20 flex items-center justify-center border border-[#F4B400]/30">
                <svg className="w-6 h-6 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-white">Streamline Recruitment</h3>
                <p className="text-white/70">Manage candidates, jobs, and placements all in one place</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-[#F4B400]/20 flex items-center justify-center border border-[#F4B400]/30">
                <svg className="w-6 h-6 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-white">Track Performance</h3>
                <p className="text-white/70">Monitor revenue, payments, and team productivity</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-[#F4B400]/20 flex items-center justify-center border border-[#F4B400]/30">
                <svg className="w-6 h-6 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-white">Team Collaboration</h3>
                <p className="text-white/70">Work together seamlessly with your recruitment team</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1F3A5F]/80 to-transparent"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-[#1F3A5F] mb-2">Careerist</h1>
            <p className="text-[#64748B]">Recruitment Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-2">
                Welcome Back
              </h2>
              <p className="text-[#64748B]">
                Sign in to continue to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="error" dismissible onDismiss={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
                disabled={loading}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#F4B400] border-[#E5E7EB] rounded focus:ring-[#F4B400] focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-[#64748B]">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-[#F4B400] hover:text-[#E0A300] transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    // TODO: Implement forgot password
                  }}
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
                isLoading={loading}
                leftIcon={
                  !loading && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  )
                }
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <p className="text-xs text-[#64748B] text-center mb-3">
                Demo Credentials
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-[#F4B400]/10 rounded-lg border border-[#F4B400]/20">
                  <span className="text-[#64748B]">Admin:</span>
                  <span className="font-mono text-[#0F172A]">admin@careerist.com</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-[#F4B400]/10 rounded-lg border border-[#F4B400]/20">
                  <span className="text-[#64748B]">Manager:</span>
                  <span className="font-mono text-[#0F172A]">manager1@careerist.com</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-[#F4B400]/10 rounded-lg border border-[#F4B400]/20">
                  <span className="text-[#64748B]">Password:</span>
                  <span className="font-mono text-[#0F172A]">password123</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-[#64748B]">
            © {new Date().getFullYear()} Careerist. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
