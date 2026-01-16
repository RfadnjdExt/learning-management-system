"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Calendar, Users, BookOpen, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ClassManagerProps {
    classId: string
    guruId: string
}

export function ClassManager({ classId, guruId }: ClassManagerProps) {
    const [classData, setClassData] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Stats State
    const [attendanceRate, setAttendanceRate] = useState(0)

    // New Session State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newSessionData, setNewSessionData] = useState({ date: "", notes: "" })

    // Detail Session State
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<any>(null)
    const [sessionEvaluations, setSessionEvaluations] = useState<any[]>([])
    const [detailLoading, setDetailLoading] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [classId])

    async function fetchData() {
        setLoading(true)
        // 1. Fetch Class Details
        const { data: cls } = await supabase
            .from("classes")
            .select("*, semester:semesters(name)")
            .eq("id", classId)
            .single()

        if (cls) setClassData(cls)

        // 2. Fetch Students (via Enrollments)
        const { data: enrollmentData } = await supabase
            .from("class_enrollments")
            .select("*, user:users(id, full_name, phone, address)")
            .eq("class_id", classId)

        let currentStudents: any[] = []
        if (enrollmentData) {
            currentStudents = enrollmentData.map((e: any) => e.user).filter(Boolean)
            setStudents(currentStudents)
        }

        // 3. Fetch Sessions
        const { data: sessionData } = await supabase
            .from("sessions")
            .select("*")
            .eq("class_id", classId)
            .order("session_date", { ascending: false })

        let currentSessions: any[] = []
        if (sessionData) {
            // Force local date handling if needed, but display handles it.
            currentSessions = sessionData
            setSessions(sessionData)
        }

        // 4. Calculate Attendance Rate
        // Logic: (Total Evaluations / (Total Sessions * Total Students)) * 100
        if (currentSessions.length > 0 && currentStudents.length > 0) {
            const sessionIds = currentSessions.map(s => s.id)

            // Count total evaluations for these sessions
            // Note: .in() with a large array might hit limits, but for a class context it's fine.
            const { count } = await supabase
                .from("evaluations")
                .select("*", { count: 'exact', head: true })
                .in("session_id", sessionIds)

            const totalPossible = currentSessions.length * currentStudents.length
            const actualEvaluations = count || 0

            const rate = totalPossible > 0 ? (actualEvaluations / totalPossible) * 100 : 0
            setAttendanceRate(Math.round(rate))
        } else {
            setAttendanceRate(0)
        }

        setLoading(false)
    }

    async function handleCreateSession(e: React.FormEvent) {
        e.preventDefault()
        if (!newSessionData.date) {
            toast.error("Tanggal wajib diisi")
            return
        }

        const { error } = await supabase.from("sessions").insert({
            class_id: classId,
            guru_id: guruId,
            session_date: newSessionData.date,
            notes: newSessionData.notes
        })

        if (error) {
            toast.error("Gagal membuat sesi: " + error.message)
        } else {
            toast.success("Sesi berhasil dibuat!")
            setIsCreateOpen(false)
            setNewSessionData({ date: "", notes: "" })
            fetchData() // Refresh list & stats
        }
    }

    async function handleViewDetail(session: any) {
        setSelectedSession(session)
        setIsDetailOpen(true)
        setDetailLoading(true)
        setSessionEvaluations([])

        // Fetch evaluations for this session
        const { data: evals, error } = await supabase
            .from("evaluations")
            .select("*, user:users!user_id(full_name)")
            .eq("session_id", session.id)

        if (error) {
            console.error("Error fetching details:", error)
            toast.error("Gagal memuat detail evaluasi")
        }

        if (evals) {
            setSessionEvaluations(evals)
        }
        setDetailLoading(false)
    }

    if (loading) return <div className="p-8 text-center">Memuat data kelas...</div>
    if (!classData) return <div className="p-8 text-center text-red-500">Kelas tidak ditemukan</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/guru/classes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{classData.name}</h1>
                        <p className="text-muted-foreground">{classData.semester?.name} • {students.length} Santri</p>
                    </div>
                </div>
                <Link href={`/guru/classes/${classId}/settings`}>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Pengaturan
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="sessions">
                        <TabsList>
                            <TabsTrigger value="sessions" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Sesi Pembelajaran
                            </TabsTrigger>
                            <TabsTrigger value="students" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Daftar Santri
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="sessions" className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                                <div>
                                    <h3 className="font-semibold">Kelola Sesi</h3>
                                    <p className="text-sm text-muted-foreground">Catat kehadiran dan nilai hafalan</p>
                                </div>

                                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Buat Sesi Baru
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Buat Sesi Baru</DialogTitle>
                                            <DialogDescription>
                                                Pilih tanggal untuk sesi pembelajaran ini.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateSession} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="date">Tanggal</Label>
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={newSessionData.date}
                                                    onChange={(e) => setNewSessionData({ ...newSessionData, date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Catatan (Opsional)</Label>
                                                <Input
                                                    id="notes"
                                                    placeholder="Contoh: Setoran Surat An-Naba"
                                                    value={newSessionData.notes}
                                                    onChange={(e) => setNewSessionData({ ...newSessionData, notes: e.target.value })}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                                    Batal
                                                </Button>
                                                <Button type="submit">Simpan</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* DETAIL SESSION DIALOG */}
                            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Detail Sesi</DialogTitle>
                                        <DialogDescription>
                                            Informasi sesi dan daftar santri yang dinilai.
                                        </DialogDescription>
                                    </DialogHeader>

                                    {selectedSession && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Tanggal</p>
                                                    <p className="font-medium">
                                                        {new Date(selectedSession.session_date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Catatan</p>
                                                    <p className="font-medium">{selectedSession.notes || "-"}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-3">Daftar Evaluasi ({sessionEvaluations.length})</h4>
                                                {detailLoading ? (
                                                    <p className="text-center text-muted-foreground py-4">Memuat data...</p>
                                                ) : sessionEvaluations.length === 0 ? (
                                                    <p className="text-center text-muted-foreground py-4 border rounded-md">
                                                        Belum ada santri yang dinilai pada sesi ini.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                                        {sessionEvaluations.map((ev) => (
                                                            <div key={ev.id} className="flex justify-between items-start border p-3 rounded-lg">
                                                                <div>
                                                                    <p className="font-medium text-lg">{ev.user?.full_name}</p>
                                                                    <div className="flex gap-2 text-xs mt-1">
                                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-200">
                                                                            Hafalan: {ev.hafalan_level?.replace(/_/g, " ")}
                                                                        </span>
                                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium border border-green-200">
                                                                            Tajwid: {ev.tajweed_level?.replace(/_/g, " ")}
                                                                        </span>
                                                                    </div>
                                                                    {ev.additional_notes && (
                                                                        <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded italic">
                                                                            "{ev.additional_notes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>

                            <div className="space-y-3">
                                {sessions.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">Belum ada sesi yang dibuat.</p>
                                ) : (
                                    sessions.map((session) => (
                                        <Card key={session.id}>
                                            <CardContent className="p-4 flex justify-between items-center">
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-blue-100 p-2 rounded text-blue-700">
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">
                                                            {new Date(session.session_date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground text-ellipsis">
                                                            {session.notes || "Tidak ada catatan"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => handleViewDetail(session)}>
                                                    Detail
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="students">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daftar Santri</CardTitle>
                                    <CardDescription>Santri yang terdaftar di kelas ini</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-muted-foreground border-b">
                                            <tr>
                                                <th className="py-2 px-4">Nama</th>
                                                <th className="py-2 px-4">ID</th>
                                                <th className="py-2 px-4">Info</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {students.length === 0 ? (
                                                <tr><td colSpan={3} className="text-center py-4">Tidak ada santri</td></tr>
                                            ) : (
                                                students.map((student) => (
                                                    <tr key={student.id}>
                                                        <td className="py-3 px-4 font-medium">{student.full_name || "—"}</td>
                                                        <td className="py-3 px-4 font-mono text-xs">{student.id.substring(0, 8)}...</td>
                                                        <td className="py-3 px-4 text-muted-foreground">
                                                            {student.phone || "—"}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Total Sesi</span>
                                <span className="font-semibold">{sessions.length}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground text-sm">Kehadiran Rata-rata</span>
                                <span className="font-semibold">
                                    {attendanceRate}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
