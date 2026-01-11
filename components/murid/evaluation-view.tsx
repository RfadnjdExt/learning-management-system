"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function EvaluationView({ userId }: { userId: string }) {
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [filteredEvaluations, setFilteredEvaluations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc">("date-desc")

  const supabase = createClient()

  useEffect(() => {
    fetchEvaluations()
  }, [userId])

  useEffect(() => {
    applyFiltersAndSort()
  }, [evaluations, searchTerm, filterLevel, sortBy])

  async function fetchEvaluations() {
    // FIX: Use explicit foreign key !evaluator_id to avoid ambiguity
    const { data } = await supabase
      .from("evaluations")
      .select("*, session:sessions(session_date), guru:users!evaluator_id(full_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    setEvaluations(data || [])
    setIsLoading(false)
  }

  function applyFiltersAndSort() {
    let filtered = [...evaluations]

    // Apply search filter (Safe check)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (evaluation) =>
          (evaluation.guru?.full_name || "").toLowerCase().includes(lowerSearch) ||
          (evaluation.additional_notes || "").toLowerCase().includes(lowerSearch),
      )
    }

    // Apply level filter
    if (filterLevel !== "all") {
      filtered = filtered.filter((evaluation) => evaluation.hafalan_level === filterLevel)
    }

    // Apply sort
    if (sortBy === "date-asc") {
      filtered.sort((a, b) => new Date(a.session?.session_date).getTime() - new Date(b.session?.session_date).getTime())
    } else {
      filtered.sort((a, b) => new Date(b.session?.session_date).getTime() - new Date(a.session?.session_date).getTime())
    }

    setFilteredEvaluations(filtered)
  }

  if (isLoading) {
    return <div className="text-center py-10">Memuat...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter & Cari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan guru atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Level Hafalan</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">Semua Level</option>
                <option value="belum_hafal">Belum Hafal</option>
                <option value="hafal_tidak_lancar">Tidak Lancar</option>
                <option value="hafal_lancar">Lancar</option>
                <option value="hafal_sangat_lancar">Sangat Lancar</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Urutkan</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date-desc" | "date-asc")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="date-desc">Terbaru</option>
                <option value="date-asc">Terlama</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations List */}
      <div className="space-y-3">
        {filteredEvaluations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Tidak ada evaluasi ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          filteredEvaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{evaluation.guru?.full_name || "Guru Tidak Dikenal"}</CardTitle>
                    <CardDescription>{new Date(evaluation.session?.session_date).toLocaleDateString("id-ID")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">Hafalan</p>
                    <p className="font-medium capitalize text-sm">{evaluation.hafalan_level?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">Tajwid</p>
                    <p className="font-medium capitalize text-sm">{evaluation.tajweed_level?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">Tartil</p>
                    <p className="font-medium capitalize text-sm">{evaluation.tartil_level?.replace(/_/g, " ")}</p>
                  </div>
                </div>
                {evaluation.additional_notes && (
                  <div className="p-3 border rounded text-sm bg-background">
                    <p className="text-muted-foreground mb-1 text-xs">Catatan:</p>
                    {evaluation.additional_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
