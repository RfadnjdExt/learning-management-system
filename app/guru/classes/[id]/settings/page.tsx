"use client"

import { useState, useEffect, use } from "react"
import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ClassSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [className, setClassName] = useState("")
    const [settings, setSettings] = useState({
        enable_leaderboard: true,
    })

    const router = useRouter()
    const supabase = createClient()
    const classId = id

    useEffect(() => {
        fetchClassSettings()
    }, [])

    async function fetchClassSettings() {
        try {
            const { data, error } = await supabase
                .from("classes")
                .select("name, enable_leaderboard")
                .eq("id", classId)
                .single()

            if (error) throw error

            setClassName(data.name)
            setSettings({
                enable_leaderboard: data.enable_leaderboard ?? true
            })
            setLoading(false)

        } catch (error: any) {
            console.error("Error fetching settings:", error)
            toast.error("Gagal memuat pengaturan kelas")
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            const { error } = await supabase
                .from("classes")
                .update({
                    enable_leaderboard: settings.enable_leaderboard
                })
                .eq("id", classId)

            if (error) throw error

            toast.success("Pengaturan berhasil disimpan")
            router.refresh()

        } catch (error: any) {
            console.error("Error saving settings:", error)
            toast.error("Gagal menyimpan pengaturan: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-6">Memuat...</div>

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Button>
            </div>

            <div>
                <h1 className="text-2xl font-bold">Pengaturan Kelas</h1>
                <p className="text-muted-foreground">Kelola konfigurasi untuk kelas {className}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fitur Kelas</CardTitle>
                    <CardDescription>Aktifkan atau nonaktifkan fitur untuk kelas ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label className="text-base">Papan Peringkat (Leaderboard)</Label>
                            <p className="text-sm text-muted-foreground">
                                Tampilkan peringkat mingguan santri berdasarkan jumlah setoran ayat.
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_leaderboard}
                            onCheckedChange={(checked) => setSettings({ ...settings, enable_leaderboard: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
            </div>
        </div>
    )
}
