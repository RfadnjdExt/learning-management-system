
import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { InstitutionSettings } from "@/components/admin/institution-settings"
import { redirect } from "next/navigation"

export default async function AdminSettingsPage() {
    const { userData } = await getCurrentUserWithRole()
    const supabase = await createClient()

    // Fetch institution data
    const { data: institution, error } = await supabase
        .from("institutions")
        .select("*")
        .eq("id", userData.institution_id)
        .single()

    if (error || !institution) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold text-red-600">Terjadi Kesalahan</h1>
                <p>Tidak dapat memuat detail institusi.</p>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Pengaturan</h1>
                <p className="text-muted-foreground">Kelola profil dan pengaturan institusi</p>
            </div>

            <div className="max-w-2xl">
                <InstitutionSettings initialData={institution} />
            </div>
        </div>
    )
}
