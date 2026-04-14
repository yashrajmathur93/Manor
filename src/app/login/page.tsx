'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Home, Loader2, ChevronLeft } from 'lucide-react'

type Screen = 'main' | 'phone-enter' | 'phone-otp' | 'email'

export default function LoginPage() {
  const [screen, setScreen] = useState<Screen>('main')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)

    // Format: ensure +91 prefix for India
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g, '')}`
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('OTP sent!')
      setPhone(formatted)
      setScreen('phone-otp')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Manor</h1>
          <p className="text-sm text-gray-500 mt-1">Household management</p>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            {screen !== 'main' && (
              <button
                onClick={() => { setScreen('main'); setOtp(''); setLoading(false) }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2 -mt-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <CardTitle className="text-lg">
              {screen === 'main' && 'Welcome to Manor'}
              {screen === 'phone-enter' && 'Enter your mobile number'}
              {screen === 'phone-otp' && 'Enter the OTP'}
              {screen === 'email' && 'Sign in with email'}
            </CardTitle>
            <CardDescription>
              {screen === 'main' && 'Choose how you want to sign in'}
              {screen === 'phone-enter' && 'We\'ll send a 6-digit code to your number'}
              {screen === 'phone-otp' && `Code sent to ${phone}`}
              {screen === 'email' && 'Use your email and password'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* MAIN SCREEN */}
            {screen === 'main' && (
              <>
                {/* Google */}
                <Button
                  variant="outline"
                  className="w-full gap-3 h-11"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                {/* Phone */}
                <Button
                  variant="outline"
                  className="w-full gap-3 h-11"
                  onClick={() => setScreen('phone-enter')}
                  disabled={loading}
                >
                  <span className="text-base">📱</span>
                  Continue with mobile number
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <Separator className="flex-1" />
                  <span className="text-xs text-gray-400">or</span>
                  <Separator className="flex-1" />
                </div>

                <button
                  onClick={() => setScreen('email')}
                  className="w-full text-sm text-gray-500 hover:text-gray-800 text-center py-1"
                >
                  Sign in with email & password
                </button>
              </>
            )}

            {/* PHONE — ENTER NUMBER */}
            {screen === 'phone-enter' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98765 43210"
                      value={phone.replace('+91', '')}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400">Indian numbers only (+91). International? Use email login.</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || phone.replace(/\D/g, '').length < 10}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : 'Send OTP'}
                </Button>
              </form>
            )}

            {/* PHONE — ENTER OTP */}
            {screen === 'phone-otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    className="text-center text-xl tracking-widest font-mono"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : 'Verify & Sign in'}
                </Button>
                <button
                  type="button"
                  onClick={() => setScreen('phone-enter')}
                  className="w-full text-sm text-gray-400 hover:text-gray-700 text-center"
                >
                  Didn't get the code? Go back
                </button>
              </form>
            )}

            {/* EMAIL */}
            {screen === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : 'Sign in'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          New staff members — just enter your mobile number to get started.
        </p>
      </div>
    </div>
  )
}
