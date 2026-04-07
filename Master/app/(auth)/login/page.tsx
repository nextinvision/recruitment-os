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
  const leftPanelFeatures = [
    {
      title: 'Pipeline Visibility',
      description:
        'Track each candidate stage with clear progress, ownership, and outcomes.',
      icon: (
        <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7h18M7 12h10M10 17h4"
          />
        </svg>
      ),
    },
    {
      title: 'Operational Control',
      description:
        'Coordinate jobs, interviews, and placements from one professional workspace.',
      icon: (
        <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-6m3 6V7m3 10v-4m3 7H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      title: 'Team Alignment',
      description:
        'Keep recruiters and managers aligned with shared context and activity history.',
      icon: (
        <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-1a4 4 0 00-5-3.87M9 20H2v-1a4 4 0 015.87-3.5M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75M12 13a4 4 0 100-8 4 4 0 000 8z"
          />
        </svg>
      ),
    },
  ]

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
        let redirectTo = urlParams.get('redirect') || '/dashboard'

        // Prevent redirecting to static internal files like index.html
        if (redirectTo.includes('index.html')) {
          redirectTo = '/dashboard'
        }

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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-sky-50/95 to-blue-50/90">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-sky-100/80 via-white/50 to-sky-50/90 backdrop-blur-[2px] border-r border-sky-200/60">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.35]">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 1.5px 1.5px, rgba(14, 116, 144, 0.12) 1px, transparent 0)`,
              backgroundSize: '34px 34px',
            }}
          />
        </div>

        {/* Accent Gradient Overlay */}
        <div className="absolute -top-24 -right-20 w-[30rem] h-[30rem] bg-sky-300/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-[28rem] h-[28rem] bg-blue-200/30 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col justify-center px-14 py-14 text-slate-800">
          <div className="max-w-2xl">
            <div className="flex items-center mb-8">
              <img
                src="/logo.png"
                alt="Careerist Logo"
                className="w-40 h-40 object-contain"
              />
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-slate-900">
              Built for modern recruitment agencies.
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl leading-relaxed">
              Centralize hiring operations with structure, visibility, and confident decision making across every role and pipeline.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4">
              {leftPanelFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-sky-200/70 bg-white/65 backdrop-blur-md p-5 shadow-sm shadow-sky-900/5 transition-all duration-200 hover:bg-white/85 hover:border-sky-300/80"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-sky-100/90 flex items-center justify-center border border-sky-200/80">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
                <span>Secure access</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <span>Real-time tracking</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Team-ready workflow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-sky-100/50 to-transparent pointer-events-none" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Careerist Logo"
                className="w-52 h-52 object-contain"
              />
            </div>
            <p className="text-[#64748B]">Recruitment Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-sky-900/5 border border-sky-100/90 p-8 sm:p-10">
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

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#F4B400] border-[#E5E7EB] rounded focus:ring-[#F4B400] focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-[#64748B]">
                    Remember me
                  </span>
                </label>
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
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-[#64748B] space-y-1">
            <p>© {new Date().getFullYear()} Careerist. All rights reserved.</p>
            <p>
              Managed &amp; Developed by{' '}
              <a
                href="https://mindwebsolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 hover:text-sky-800 transition-colors"
              >
                Mind Web Solutions
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
