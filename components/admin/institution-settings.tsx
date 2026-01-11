"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Institution {
    id: string
    name: string
    code: string
    address: string | null
    phone: string | null
    email: string | null
    description: string | null
}

export function InstitutionSettings({ initialData }: { initialData: Institution }) {
    const [formData, setFormData] = useState(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from("institutions")
                .update({
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    description: formData.description,
                })
                .eq("id", initialData.id)

            if (error) throw error

            toast.success("Pengaturan berhasil disimpan")
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profil Institusi</CardTitle>
                <CardDescription>
                    Perbarui informasi dasar institusi Anda.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Institusi</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="code">Kode Institusi</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Kode unik tidak dapat diubah.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Admin</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">No. Telepon</Label>
                        <Input
                            id="phone"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Contoh: 08123456789"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Alamat Lengkap</Label>
                        <Textarea
                            id="address"
                            value={formData.address || ""}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi Singkat</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Motto atau deskripsi singkat..."
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
