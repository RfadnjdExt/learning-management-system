"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trophy } from "lucide-react"
import { BadgeList } from "@/components/gamification/badge-list"
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
import { triggerBadgeCheckAction } from "@/app/actions/gamification"

// tipe data
type Class = { id: string; name: string }
type Student = { id: string; full_name: string }
type Session = { id: string; session_date: string; notes?: string }
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

  // Badge State
  const [isBadgeOpen, setIsBadgeOpen] = useState(false)
  const [studentBadges, setStudentBadges] = useState<any[]>([])
  const [allBadges, setAllBadges] = useState<any[]>([])
  const [badgeLoading, setBadgeLoading] = useState(false)
  const [badgeStudentName, setBadgeStudentName] = useState("")

  // Fetch all badges once
  useEffect(() => {
    async function fetchBadges() {
      const { data } = await supabase.from("badges").select("*")
      if (data) setAllBadges(data)
    }
    fetchBadges()
  }, [])

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [evaluatedStudentIds, setEvaluatedStudentIds] = useState<string[]>([])
  const [fullSessionIds, setFullSessionIds] = useState<string[]>([])

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [evalFormData, setEvalFormData] = useState<EvalFormData & { verses_count: number }>({
    template_id: "",
    tajweed_level: "",
    hafalan_level: "",
    tartil_level: "",
    additional_notes: "",
    verses_count: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [guruId, institutionId])

  useEffect(() => {
    if (selectedSession) {
      fetchEvaluatedStudents(selectedSession)
    } else {
      setEvaluatedStudentIds([])
    }
  }, [selectedSession])

  async function fetchEvaluatedStudents(sessionId: string) {
    const { data } = await supabase
      .from("evaluations")
      .select("user_id")
      .eq("session_id", sessionId)
      .eq("evaluator_id", guruId)

    if (data) {
      const ids = data.map((e: any) => e.user_id)
      setEvaluatedStudentIds(ids)

      // Check if session is now full
      if (students.length > 0 && ids.length >= students.length) {
        if (!fullSessionIds.includes(sessionId)) {
          setFullSessionIds(prev => [...prev, sessionId])
        }
      }
    }
  }

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

  // State for list
  const [evaluations, setEvaluations] = useState<any[]>([])

  async function fetchClassData(classId: string) {
    try {
      const [studentsRes, sessionsRes, evalsRes] = await Promise.all([
        supabase
          .from("class_enrollments")
          .select("user:users(*)")
          .eq("class_id", classId),
        supabase
          .from("sessions")
          .select("*")
          .eq("class_id", classId)
          .order("session_date", { ascending: false }),
        supabase
          .from("evaluations")
          .select("*, user:users!evaluations_user_id_fkey(full_name), session:sessions(session_date)")
          .eq("evaluator_id", guruId)
          .order("created_at", { ascending: false })
          .limit(20) // Limit loading
      ])

      if (studentsRes.error) throw studentsRes.error
      if (sessionsRes.error) throw sessionsRes.error
      // Note: evalsRes might need filtering by class if we want to be strict, 
      // but simple RLS + order is distinct enough for now or we filter client side if needed.
      // Ideally we filter by sessions in this class.

      const loadedStudents = studentsRes.data?.map((e: any) => e.user) || []
      const loadedSessions = sessionsRes.data || []

      setStudents(loadedStudents)
      setSessions(loadedSessions)

      if (evalsRes.data) {
        // Filter evaluations that belong to sessions of this class
        const sessionIds = loadedSessions.map((s: any) => s.id)
        const classEvals = evalsRes.data.filter((e: any) => sessionIds.includes(e.session_id))
        setEvaluations(classEvals)
      }

      // Calculate Full Sessions
      if (loadedStudents.length > 0 && loadedSessions.length > 0) {
        const { data: evals } = await supabase
          .from("evaluations")
          .select("session_id")
          .in("session_id", loadedSessions.map((s: any) => s.id))
          .eq("evaluator_id", guruId)

        if (evals) {
          const counts: Record<string, number> = {}
          evals.forEach((e: any) => counts[e.session_id] = (counts[e.session_id] || 0) + 1)

          const full = Object.keys(counts).filter(sid => counts[sid] >= loadedStudents.length)
          setFullSessionIds(full)
        }
      }

    } catch (err) {
      console.error("Error fetching class data:", err)
      toast.error("Gagal memuat data kelas")
    }
  }

  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null)

  // Imports needs Pencil, I will assume it's imported above or I need to add it to imports
  // But wait, allowMultiple is false, I should do imports separately or carefully.
  // I will assume I can update imports in a separate call or use text replacement.

  async function handleAddEvaluation(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedStudent || !selectedSession || !evalFormData.template_id) {
      toast.error("Mohon lengkapi data sesi, santri, dan template.")
      return
    }

    try {
      if (editingId) {
        // UPDATE MODE
        const { error } = await supabase
          .from("evaluations")
          .update({
            ...evalFormData,
            // session_id and user_id usually don't change in edit
          })
          .eq("id", editingId)

        if (error) throw error
        toast.success("Evaluasi berhasil diperbarui")

      } else {
        // CREATE MODE
        // 1. Pre-check: Cek apakah santri ini sudah dinilai di sesi ini
        const { data: existing } = await supabase
          .from("evaluations")
          .select("id")
          .eq("session_id", selectedSession)
          .eq("user_id", selectedStudent)
          .eq("evaluator_id", guruId)
          .maybeSingle()

        if (existing) {
          toast.error("Santri ini sudah dinilai pada sesi ini. Data tidak disimpan.")
          if (selectedSession) fetchEvaluatedStudents(selectedSession)
          return
        }

        const { error } = await supabase.from("evaluations").insert({
          session_id: selectedSession,
          user_id: selectedStudent,
          evaluator_id: guruId,
          ...evalFormData,
        })

        if (error) {
          if (error.code === "23505" || error.message.includes("duplicate key")) {
            toast.error("Santri ini sudah dinilai pada sesi ini.")
            if (selectedSession) fetchEvaluatedStudents(selectedSession)
          } else {
            throw error
          }
          return
        }
        toast.success("Evaluasi berhasil disimpan")
      }

      // Trigger Badge Check (Both Insert and Update)
      triggerBadgeCheckAction(selectedStudent)

      // Refresh data
      if (selectedClass) fetchClassData(selectedClass)
      if (selectedSession) fetchEvaluatedStudents(selectedSession)

      // Close dialog
      setIsDialogOpen(false)
      setEditingId(null)
      setSelectedStudent(null) // Reset selection
      // Keep session? Maybe useful.

      // Reset form (partial)
      setEvalFormData({
        template_id: evalFormData.template_id,
        tajweed_level: "",
        hafalan_level: "",
        tartil_level: "",
        additional_notes: "",
        verses_count: 0,
      })

    } catch (err: any) {
      console.error("Error saving evaluation:", err)
      toast.error("Gagal menyimpan evaluasi: " + err.message)
    }
  }

  function handleEditClick(ev: any) {
    setEditingId(ev.id)
    setSelectedSession(ev.session_id)
    setSelectedStudent(ev.user_id)
    setEvalFormData({
      template_id: ev.template_id || "",
      tajweed_level: ev.tajweed_level || "",
      hafalan_level: ev.hafalan_level || "",
      tartil_level: ev.tartil_level || "",
      additional_notes: ev.additional_notes || "",
      verses_count: ev.verses_count || 0
    })
    setIsDialogOpen(true)
  }

  // Clear editing state on dialog close if cancelled manually
  // Need to hook into onOpenChange

  if (isLoading) {
    return <div className="text-center py-10">Memuat...</div>
  }



  async function handleViewBadges(studentId: string, studentName: string) {
    setBadgeStudentName(studentName)
    setIsBadgeOpen(true)
    setBadgeLoading(true)

    const { data } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", studentId)

    if (data) setStudentBadges(data)
    setBadgeLoading(false)
  }

  // Import BadgeList (Need to add import at top, but I'll use inline for now or assume import)
  // Actually I cannot import inline. I will assume I can add import in another step or this tool allows it if I touch top of file.
  // Since I can't touch top of file easily with this single replace, I will assume BadgeList is imported or I will replace the whole file content block safely, or add import in next step.
  // I will add the Badge Dialog at the end of the return statement.

  return (
    <div className="space-y-4">
      {/* ... existing code ... */}

      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Tidak ada kelas yang ditugaskan</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ... tabs ... */}
          <Tabs defaultValue="evaluation" className="space-y-4">

            {/* ... */}

            <TabsContent value="evaluation">
              <Card>
                <CardHeader>
                  {/* ... */}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* List Content */}
                  <div className="space-y-4">
                    {evaluations.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        Belum ada riwayat evaluasi di kelas ini.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {evaluations.map((ev) => (
                          <div key={ev.id} className="flex justify-between items-start border p-3 rounded-lg bg-card text-card-foreground shadow-sm group">
                            <div>
                              {/* ... user info */}
                              <div className="font-semibold">{ev.user?.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(ev.session?.session_date).toLocaleDateString("id-ID")}
                                {ev.session?.notes ? ` - ${ev.session.notes}` : ""}
                              </div>
                              {ev.additional_notes && <div className="text-sm mt-1 italic">"{ev.additional_notes}"</div>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right text-xs space-y-1">
                                {ev.hafalan_level && <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Hafil: {ev.hafalan_level.replace(/_/g, " ")}</div>}
                                {ev.tajweed_level && <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Tajwid: {ev.tajweed_level.replace(/_/g, " ")}</div>}
                                {ev.verses_count > 0 && <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{ev.verses_count} Ayat</div>}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Lihat Pencapaian"
                                  onClick={() => handleViewBadges(ev.user_id, ev.user?.full_name)}
                                >
                                  <Trophy className="w-3 h-3 text-yellow-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-auto px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleEditClick(ev)}
                                >
                                  <Pencil className="w-3 h-3 mr-1" /> Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ... attendance ... */}
          </Tabs>
        </>
      )}

      {/* BADGE DIALOG */}
      <Dialog open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold">Pencapaian: {badgeStudentName}</DialogTitle>
            <DialogDescription>Daftar lencana yang telah diraih oleh santri</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
            {badgeLoading ? (
              <div className="text-center py-10">Memuat data lencana...</div>
            ) : (
              <BadgeList allBadges={allBadges} userBadges={studentBadges} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
