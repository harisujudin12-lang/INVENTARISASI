'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickLoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    quickLogin()
  }, [])

  async function quickLogin() {
    try {
      setStatus('Mengirim request ke /api/simple-login...')
      
      const res = await fetch('/api/simple-login', {
        method: 'POST',
        credentials: 'include',
      })

      const json = await res.json()
      console.log('[QuickLogin] Response:', json)

      if (json.success && json.data?.token) {
        setStatus(`✅ Token diterima. Menyimpan ke localStorage...`)
        
        // Save to localStorage
        localStorage.setItem('admin_token', json.data.token)
        console.log('[QuickLogin] ✅ Token saved to localStorage')
        
        setStatus(`✅ Logged in as ${json.data.username}. Redirecting...`)
        
        // Wait 1 second then redirect
        setTimeout(() => {
          router.push('/admin')
          router.refresh()
        }, 1000)
      } else {
        setError(json.error || 'Login gagal')
        setStatus('❌ Login gagal')
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setError(errMsg)
      setStatus(`❌ Error: ${errMsg}`)
      console.error('[QuickLogin] Error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Quick Login</h1>
        
        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm">{status}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p>• Attempting to generate token...</p>
          <p>• Token akan disimpan ke localStorage</p>
          <p>• Anda akan redirect ke /admin</p>
        </div>

        <button
          onClick={quickLogin}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Coba Lagi
        </button>

        <a
          href="/admin/login"
          className="mt-4 block text-center text-blue-500 hover:text-blue-700"
        >
          ← Kembali ke Login
        </a>
      </div>
    </div>
  )
}
