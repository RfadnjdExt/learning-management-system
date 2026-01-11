"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

export function EvaluationTemplates({ institutionId }: { institutionId: string }) {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "", evaluator_label: "Guru" })
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [institutionId])

  async function fetchTemplates() {
    const { data } = await supabase.from("evaluation_templates").select("*").eq("institution_id", institutionId)
    setTemplates(data || [])
    setIsLoading(false)
  }

  async function handleAddTemplate(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.from("evaluation_templates").insert({
      institution_id: institutionId,
      ...formData,
      evaluation_criteria: {
        tajweed: ["Belum Hafal", "Hafal Tidak Lancar", "Hafal Lancar", "Hafal Sangat Lancar"],
        hafalan: ["Belum Hafal", "Hafal Tidak Lancar", "Hafal Lancar", "Hafal Sangat Lancar"],
        tartil: ["Belum Hafal", "Hafal Tidak Lancar", "Hafal Lancar", "Hafal Sangat Lancar"],
      },
    })

    if (!error) {
      setFormData({ name: "", description: "", evaluator_label: "Guru" })
      setShowForm(false)
      fetchTemplates()
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (confirm("Hapus template ini?")) {
      await supabase.from("evaluation_templates").delete().eq("id", templateId)
      fetchTemplates()
    }
  }

  if (isLoading) return <div className="text-center py-10">Memuat...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Daftar Template</CardTitle>
            <CardDescription>Kelola template penilaian untuk institusi Anda</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Template Baru
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleAddTemplate} className="space-y-4 p-4 bg-muted rounded-lg">
            <Input
              placeholder="Nama template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              placeholder="Deskripsi"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              placeholder="Label Penilai (contoh: Guru, Ustadz)"
              value={formData.evaluator_label}
              onChange={(e) => setFormData({ ...formData, evaluator_label: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit">Simpan Template</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Penilai: {template.evaluator_label}</p>
                </div>
                <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
