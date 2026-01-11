"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function UserManagement({ institutionId }: { institutionId: string }) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: "", full_name: "", role: "murid" })
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [institutionId])

  async function fetchUsers() {
    const { data } = await supabase.from("users").select("*").eq("institution_id", institutionId)
    setUsers(data || [])
    setIsLoading(false)
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.email || !formData.full_name) {
      toast.error("Mohon isi semua kolom")
      return
    }

    // Check if institutionId is present before adding
    if (!institutionId) {
      toast.error("Admin saat ini tidak terhubung ke institusi manapun.")
      return
    }

    const { error } = await supabase.from("users").insert({
      institution_id: institutionId,
      ...formData,
    })

    if (error) {
      toast.error("Gagal menambah pengguna: " + error.message)
      return
    }

    toast.success("Pengguna berhasil ditambahkan")
    setFormData({ email: "", full_name: "", role: "murid" })
    setShowForm(false)
    fetchUsers()
  }

  async function handleDeleteUser(userId: string) {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      const { error } = await supabase.from("users").delete().eq("id", userId)
      if (error) {
        toast.error("Gagal menghapus pengguna: " + error.message)
      } else {
        toast.success("Pengguna berhasil dihapus")
        fetchUsers()
      }
    }
  }

  if (isLoading) return <div className="text-center py-10">Memuat...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>Kelola pengguna institusi dan peran mereka</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleAddUser} className="space-y-4 p-4 bg-muted rounded-lg">
            <div>
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Contoh: Ahmad Fulan"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ahmad@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Peran (Role)</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="murid">Santri (Murid)</option>
                <option value="guru">Ustadz (Guru)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Nama</th>
                <th className="text-left py-2 px-4">Email</th>
                <th className="text-left py-2 px-4">Peran</th>
                <th className="text-left py-2 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">{user.full_name}</td>
                  <td className="py-2 px-4">{user.email}</td>
                  <td className="py-2 px-4">
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs capitalize">
                      {user.role === 'murid' ? 'Santri' : user.role === 'guru' ? 'Ustadz' : user.role}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Hapus pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
