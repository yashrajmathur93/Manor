'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface InviteStaffDialogProps {
  trigger?: React.ReactNode
}

export function InviteStaffDialog({ trigger }: InviteStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'staff' | 'owner'>('staff')
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !fullName.trim()) return
    setLoading(true)

    const password = generatePassword()

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      })

      if (error) throw error

      setTempPassword(password)
      setStep('success')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function copyCredentials() {
    await navigator.clipboard.writeText(
      `Manor login details:\nEmail: ${email}\nPassword: ${tempPassword}\nURL: ${window.location.origin}/login`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setStep('form')
      setEmail('')
      setFullName('')
      setRole('staff')
      setTempPassword('')
    }, 300)
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
        {trigger ?? (
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-1.5" /> Invite Member
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
        <DialogContent>
          {step === 'form' ? (
            <>
              <DialogHeader>
                <DialogTitle>Invite a member</DialogTitle>
                <DialogDescription>
                  A temporary password will be generated for them to log in.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole((v ?? 'staff') as 'staff' | 'owner')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff — can only see their assigned tasks</SelectItem>
                      <SelectItem value="owner">Owner — full access to everything</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !email.trim() || !fullName.trim()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Account created!</DialogTitle>
                <DialogDescription>
                  Share these login details with {fullName}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Password</span>
                    <span className="text-gray-900 font-semibold">{tempPassword}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Ask them to log in and change their password. This password is shown only once.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={copyCredentials}>
                    {copied ? (
                      <><Check className="w-4 h-4 mr-2 text-green-500" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" /> Copy login details</>
                    )}
                  </Button>
                  <Button onClick={handleClose}>Done</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
