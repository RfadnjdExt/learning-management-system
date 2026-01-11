"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SessionManagement({ guruId, institutionId }: { guruId: string; institutionId: string }) {
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    class_id: "",
    session_date: "",
    start_time: "",
    end_time: "",
    notes: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [guruId])

  async function fetchData() {
    const [classesRes, sessionsRes] = await Promise.all([
      supabase.from("classes").select("*").eq("guru_id", guruId),
      supabase
        .from("sessions")
        .select("*, class:classes(name)")
        .eq("guru_id", guruId)
        .order("session_date", { ascending: false }),
    ])

    setClasses(classesRes.data || [])
    setSessions(sessionsRes.data || [])
    setIsLoading(false)
  }

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.class_id || !formData.session_date) {
      toast.error("Kelas dan Tanggal wajib diisi")
      return
    }

    const { error } = await supabase.from("sessions").insert({
      guru_id: guruId,
      ...formData,
    })

    if (!error) {
      toast.success("Sesi berhasil dibuat!")
      setFormData({ class_id: "", session_date: "", start_time: "", end_time: "", notes: "" })
      setIsDialogOpen(false)
      fetchData()
    } else {
      toast.error("Gagal membuat sesi: " + error.message)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (confirm("Hapus sesi ini?")) {
      await supabase.from("sessions").delete().eq("id", sessionId)
      fetchData()
    }
  }

  if (isLoading) return <div className="text-center py-10">Memuat...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Sesi Pembelajaran</CardTitle>
            <CardDescription>Buat dan kelola sesi mengajar Anda</CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Sesi Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Sesi Baru</DialogTitle>
                <DialogDescription>
                  Jadwalkan atau catat sesi pertemuan kelas.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSession} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Kelas</Label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Waktu Mulai</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Selesai</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input
                    placeholder="Catatan (opsional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Buat Sesi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada sesi dibuat</p>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{session.class?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString("id-ID")} • {session.start_time || ""} -{" "}
                      {session.end_time || ""}
                    </p>
                    {session.notes && <p className="text-sm mt-2">{session.notes}</p>}
                  </div>
                  <button onClick={() => handleDeleteSession(session.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
