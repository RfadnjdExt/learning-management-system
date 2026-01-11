"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const DEMO_CREDENTIALS = [
  { email: "admin@tahfidz.test", password: "Admin123456!", role: "Admin" },
  { email: "guru@tahfidz.test", password: "Guru123456!", role: "Guru (Ustadz)" },
  { email: "murid1@tahfidz.test", password: "Murid123456!", role: "Santri 1" },
  { email: "murid2@tahfidz.test", password: "Murid123456!", role: "Santri 2" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fillDemoCredentials = (credential: (typeof DEMO_CREDENTIALS)[0]) => {
    setEmail(credential.email)
    setPassword(credential.password)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await loginAction(email, password)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.redirectUrl) {
        router.push(result.redirectUrl)
      }
    } catch (err) {
      console.log("[v0] Login error:", err)
      setError("Terjadi kesalahan yang tidak terduga")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Mutabaah Online</CardTitle>
            <CardDescription>Sistem Evaluasi Pembelajaran Tahfidz</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Removed Dev Hint: First Time Setup */}

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  <strong>Gagal Masuk:</strong> {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@anda.com"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sedang Masuk..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
            &larr; Kembali ke Beranda
          </Link>
        </div>

        <Card className="w-full bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Akun Demo</CardTitle>
            <CardDescription>
              Klik untuk isi otomatis. Gunakan akun ini untuk mencoba aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((cred, idx) => (
                <button
                  key={idx}
                  onClick={() => fillDemoCredentials(cred)}
                  className="w-full text-left p-3 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                  type="button"
                >
                  <div className="text-sm font-medium text-gray-900">{cred.role}</div>
                  <div className="text-xs text-gray-600 mt-1 font-mono">{cred.email}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Password: <span className="font-mono">{cred.password}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Removed Dev Hint: Setup Instructions Card */}
      </div>
    </div>
  )
}
