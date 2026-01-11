import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { EvaluationTemplates } from "@/components/admin/evaluation-templates"

export default async function AdminTemplatesPage() {
  const { userData } = await getCurrentUserWithRole()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Template Evaluasi</h1>
        <p className="text-muted-foreground">Kelola template penilaian Mutabaah</p>
      </div>

      <EvaluationTemplates institutionId={userData.institution_id} />
    </div>
  )
}
