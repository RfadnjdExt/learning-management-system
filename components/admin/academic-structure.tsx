"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"


export function AcademicStructure({ institutionId }: { institutionId: string }) {
  const [semesters, setSemesters] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSemesterForm, setShowSemesterForm] = useState(false)
  const [showClassForm, setShowClassForm] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])

  // Enrollment State
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<any>(null)
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<string>>(new Set())
  const [enrollSearch, setEnrollSearch] = useState("")

  const [semesterForm, setSemesterForm] = useState({ name: "", start_date: "", end_date: "" })
  const [classForm, setClassForm] = useState({ name: "", guru_id: "", description: "" })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [institutionId])

  async function fetchData() {
    const [semestersRes, classesRes, teachersRes, studentsRes] = await Promise.all([
      supabase.from("semesters").select("*").eq("institution_id", institutionId),
      supabase.from("classes").select("*").eq("institution_id", institutionId),
      supabase.from("users").select("*").eq("institution_id", institutionId).eq("role", "guru"),
      supabase.from("users").select("*").eq("institution_id", institutionId).eq("role", "murid").order("full_name"),
    ])

    setSemesters(semestersRes.data || [])
    setClasses(classesRes.data || [])
    setTeachers(teachersRes.data || [])
    setAllStudents(studentsRes.data || [])
    setIsLoading(false)
  }

  async function handleAddSemester(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from("semesters").insert({
      institution_id: institutionId,
      ...semesterForm,
    })

    if (error) {
      toast.error("Failed to add semester: " + error.message)
      return
    }

    toast.success("Semester added successfully")
    setSemesterForm({ name: "", start_date: "", end_date: "" })
    setShowSemesterForm(false)
    fetchData()
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSemester) return

    const { error } = await supabase.from("classes").insert({
      institution_id: institutionId,
      semester_id: selectedSemester,
      ...classForm,
    })

    if (error) {
      toast.error("Failed to add class: " + error.message)
      return
    }

    toast.success("Class added successfully")
    setClassForm({ name: "", guru_id: "", description: "" })
    setShowClassForm(false)
    fetchData()
  }

  async function handleOpenEnroll(cls: any) {
    setSelectedClassForEnroll(cls)
    setEnrollSearch("")

    // Fetch current enrollments
    const { data } = await supabase
      .from("class_enrollments")
      .select("user_id")
      .eq("class_id", cls.id)

    const currentIds = new Set((data || []).map((d: any) => d.user_id))
    setEnrolledStudentIds(currentIds)
    setShowEnrollDialog(true)
  }

  async function handleSaveEnrollment() {
    if (!selectedClassForEnroll) return

    const classId = selectedClassForEnroll.id

    // Fetch latest current to diff against
    const { data: existingData } = await supabase
      .from("class_enrollments")
      .select("user_id")
      .eq("class_id", classId)

    const existingIds = new Set((existingData || []).map((d: any) => d.user_id))

    const toAdd = [...enrolledStudentIds].filter(id => !existingIds.has(id as string))
    const toRemove = [...existingIds].filter(id => !enrolledStudentIds.has(id as string))

    // Perform updates
    if (toAdd.length > 0) {
      const records = toAdd.map(uid => ({ class_id: classId, user_id: uid }))
      const { error } = await supabase.from("class_enrollments").insert(records)
      if (error) { toast.error("Error adding students: " + error.message); return }
    }

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("class_id", classId)
        .in("user_id", toRemove)
      if (error) { toast.error("Error removing students: " + error.message); return }
    }

    toast.success("Data santri berhasil diperbarui")
    setShowEnrollDialog(false)
  }

  function toggleStudentEnroll(studentId: string) {
    const newSet = new Set(enrolledStudentIds)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setEnrolledStudentIds(newSet)
  }

  // Filter students for dialog
  const filteredStudents = allStudents.filter(s =>
    s.full_name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(enrollSearch.toLowerCase())
  )

  if (isLoading) return <div className="text-center py-10">Loading...</div>

  return (
    <Tabs defaultValue="semesters" className="space-y-4">
      <TabsList>
        <TabsTrigger value="semesters">Semesters</TabsTrigger>
        <TabsTrigger value="classes">Classes</TabsTrigger>
      </TabsList>

      <TabsContent value="semesters">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Semesters</CardTitle>
                <CardDescription>Academic periods</CardDescription>
              </div>
              <Button onClick={() => setShowSemesterForm(!showSemesterForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Semester
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showSemesterForm && (
              <form onSubmit={handleAddSemester} className="space-y-4 p-4 bg-muted rounded-lg">
                <Input
                  placeholder="Semester name (e.g., Semester 1 2024)"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={semesterForm.start_date}
                    onChange={(e) => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={semesterForm.end_date}
                    onChange={(e) => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Semester</Button>
                  <Button type="button" variant="outline" onClick={() => setShowSemesterForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {semesters.map((semester) => (
                <Card key={semester.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{semester.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(semester.start_date).toLocaleDateString()} -{" "}
                        {new Date(semester.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${semester.is_active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}
                    >
                      {semester.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="classes">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>Class sections and assignments</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setShowClassForm(!showClassForm)
                  if (!selectedSemester && semesters.length > 0) {
                    setSelectedSemester(semesters[0].id)
                  }
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showClassForm && (
              <form onSubmit={handleAddClass} className="space-y-4 p-4 bg-muted rounded-lg">
                <select
                  value={selectedSemester || ""}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Class name (e.g., Kelas A)"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                />
                <select
                  value={classForm.guru_id}
                  onChange={(e) => setClassForm({ ...classForm, guru_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button type="submit">Add Class</Button>
                  <Button type="button" variant="outline" onClick={() => setShowClassForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {classes.map((cls) => (
                <Card key={cls.id} className="p-4">
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-muted-foreground">{cls.description || "No description"}</p>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEnroll(cls)}>
                      <Users className="w-4 h-4 mr-2" />
                      Kelola Santri
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Kelola Santri: {selectedClassForEnroll?.name}</DialogTitle>
                  <DialogDescription>
                    Pilih santri yang akan dimasukkan ke kelas ini.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                  <Input
                    placeholder="Cari nama santri..."
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                  />

                  <div className="border rounded-md flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredStudents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Tidak ada santri ditemukan</p>
                    ) : (
                      filteredStudents.map(student => (
                        <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={enrolledStudentIds.has(student.id)}
                            onCheckedChange={() => toggleStudentEnroll(student.id)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`student-${student.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {student.full_name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground text-right">
                    Total Terpilih: {enrolledStudentIds.size}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>Batal</Button>
                  <Button onClick={handleSaveEnrollment}>Simpan Perubahan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
