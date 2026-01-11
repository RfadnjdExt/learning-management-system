"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
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

// tipe data
type Class = { id: string; name: string }
type Student = { id: string; full_name: string }
type Session = { id: string; session_date: string }
type Template = { id: string; name: string }

type EvalFormData = {
  template_id: string
  tajweed_level: string
  hafalan_level: string
  tartil_level: string
  additional_notes: string
}

export function StudentEvaluation({
  guruId,
  institutionId,
}: {
  guruId: string
  institutionId: string
}) {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [templates, setTemplates] = useState<Template[]>([])

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [evalFormData, setEvalFormData] = useState<EvalFormData>({
    template_id: "",
    tajweed_level: "",
    hafalan_level: "",
    tartil_level: "",
    additional_notes: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [guruId, institutionId])

  async function fetchInitialData() {
    setIsLoading(true)
    try {
      const [classesRes, templatesRes] = await Promise.all([
        supabase.from("classes").select("*").eq("guru_id", guruId),
        supabase.from("evaluation_templates").select("*").eq("institution_id", institutionId),
      ])

      if (classesRes.error) throw classesRes.error
      if (templatesRes.error) throw templatesRes.error

      const classData = classesRes.data || []
      const templateData = templatesRes.data || []

      setClasses(classData)
      setTemplates(templateData)
      setIsLoading(false)

      if (classData.length > 0) {
        const firstClassId = classData[0].id
        setSelectedClass(firstClassId)
        await fetchClassData(firstClassId)
      }
    } catch (err) {
      console.error("Error fetching initial data:", err)
      setIsLoading(false)
    }
  }

  async function fetchClassData(classId: string) {
    try {
      const [studentsRes, sessionsRes] = await Promise.all([
        supabase
          .from("class_enrollments")
          .select("user:users(*)")
          .eq("class_id", classId),
        supabase
          .from("sessions")
          .select("*")
          .eq("class_id", classId)
          .order("session_date", { ascending: false }),
      ])

      if (studentsRes.error) throw studentsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      setStudents(studentsRes.data?.map((e: any) => e.user) || [])
      setSessions(sessionsRes.data || [])
    } catch (err) {
      console.error("Error fetching class data:", err)
      toast.error("Gagal memuat data kelas")
    }
  }

  async function handleAddEvaluation(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedStudent || !selectedSession || !evalFormData.template_id) {
      toast.error("Mohon lengkapi data sesi, santri, dan template.")
      return
    }

    try {
      const { error } = await supabase.from("evaluations").insert({
        session_id: selectedSession,
        user_id: selectedStudent,
        evaluator_id: guruId,
        ...evalFormData,
      })

      if (error) throw error

      toast.success("Evaluasi berhasil disimpan")

      // reset form
      setEvalFormData({
        template_id: "",
        tajweed_level: "",
        hafalan_level: "",
        tartil_level: "",
        additional_notes: "",
      })
      setIsDialogOpen(false)
      setSelectedStudent(null)
      setSelectedSession(null)
    } catch (err: any) {
      console.error("Error adding evaluation:", err)
      toast.error("Gagal menyimpan evaluasi: " + err.message)
    }
  }

  if (isLoading) {
    return <div className="text-center py-10">Memuat...</div>
  }

  return (
    <div className="space-y-4">
      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Tidak ada kelas yang ditugaskan</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {classes.map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedClass(cls.id)
                  fetchClassData(cls.id)
                }}
                className="whitespace-nowrap"
              >
                {cls.name}
              </Button>
            ))}
          </div>

          <Tabs defaultValue="evaluation" className="space-y-4">
            <TabsList>
              <TabsTrigger value="evaluation">Evaluasi</TabsTrigger>
              <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
            </TabsList>

            <TabsContent value="evaluation">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Evaluasi Mutabaah</CardTitle>
                      <CardDescription>Catat evaluasi harian santri</CardDescription>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Evaluasi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Tambah Evaluasi Baru</DialogTitle>
                          <DialogDescription>
                            Input penilaian hafalan santri
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddEvaluation} className="space-y-4 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Pilih Sesi</Label>
                              <select
                                value={selectedSession || ""}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              >
                                <option value="">-- Pilih Sesi --</option>
                                {sessions.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {new Date(s.session_date).toLocaleDateString("id-ID")}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Pilih Santri</Label>
                              <select
                                value={selectedStudent || ""}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              >
                                <option value="">-- Pilih Santri --</option>
                                {students.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Template Penilaian</Label>
                            <select
                              value={evalFormData.template_id}
                              onChange={(e) =>
                                setEvalFormData({ ...evalFormData, template_id: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-input rounded-md bg-background"
                              required
                            >
                              <option value="">-- Pilih Template --</option>
                              {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Tajwid</Label>
                              <select
                                value={evalFormData.tajweed_level}
                                onChange={(e) =>
                                  setEvalFormData({ ...evalFormData, tajweed_level: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                              >
                                <option value="">Pilih...</option>
                                <option value="belum_hafal">Belum Hafal</option>
                                <option value="hafal_tidak_lancar">Tidak Lancar</option>
                                <option value="hafal_lancar">Lancar</option>
                                <option value="hafal_sangat_lancar">Sangat Lancar</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hafalan</Label>
                              <select
                                value={evalFormData.hafalan_level}
                                onChange={(e) =>
                                  setEvalFormData({ ...evalFormData, hafalan_level: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                              >
                                <option value="">Pilih...</option>
                                <option value="belum_hafal">Belum Hafal</option>
                                <option value="hafal_tidak_lancar">Tidak Lancar</option>
                                <option value="hafal_lancar">Lancar</option>
                                <option value="hafal_sangat_lancar">Sangat Lancar</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tartil</Label>
                              <select
                                value={evalFormData.tartil_level}
                                onChange={(e) =>
                                  setEvalFormData({ ...evalFormData, tartil_level: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                              >
                                <option value="">Pilih...</option>
                                <option value="belum_hafal">Belum Hafal</option>
                                <option value="hafal_tidak_lancar">Tidak Lancar</option>
                                <option value="hafal_lancar">Lancar</option>
                                <option value="hafal_sangat_lancar">Sangat Lancar</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Catatan Tambahan</Label>
                            <textarea
                              placeholder="Tulis catatan perkembangan..."
                              value={evalFormData.additional_notes}
                              onChange={(e) =>
                                setEvalFormData({ ...evalFormData, additional_notes: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                            />
                          </div>

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Batal
                            </Button>
                            <Button type="submit">Simpan Evaluasi</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-10 text-muted-foreground">
                    Pilih "Tambah Evaluasi" untuk mulai menilai hafalan santri.
                    <br />
                    (Daftar riwayat evaluasi akan muncul di sini nanti)
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Kehadiran</CardTitle>
                  <CardDescription>Lacak kehadiran santri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10 text-muted-foreground">
                    Pencatatan kehadiran akan segera hadir
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
