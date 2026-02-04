'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, Toast } from '@/components/ui'
import { fetchWithAuth } from '@/lib/fetchClient'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })

      const json = await res.json()

      if (json.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setToast({ message: json.error || 'Login gagal', type: 'error' })
      }
    } catch (error) {
      console.error('Login error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Masuk ke panel admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            label="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            autoComplete="username"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            autoComplete="current-password"
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={loading}
          >
            Masuk
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/request"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Kembali ke halaman request
          </a>
        </div>
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
