"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search, Award, Star, Zap, Trophy, Medal, Crown } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const iconMap: Record<string, any> = {
    "award": Award,
    "star": Star,
    "zap": Zap,
    "trophy": Trophy,
    "medal": Medal,
    "crown": Crown
}

type Badge = {
    id: string
    slug: string
    name: string
    description: string
    icon: string
    category: string
}

export default function AdminBadgesPage() {
    const [badges, setBadges] = useState<Badge[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<Badge>>({
        name: "",
        description: "",
        icon: "🏆",
        category: "achievement",
        slug: ""
    })
    const [editingId, setEditingId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchBadges()
    }, [])

    async function fetchBadges() {
        setLoading(true)
        const { data, error } = await supabase
            .from("badges")
            .select("*")
            .order("name")

        if (error) {
            toast.error("Gagal memuat badges")
        } else {
            setBadges(data || [])
        }
        setLoading(false)
    }

    function handleOpenDialog(badge?: Badge) {
        if (badge) {
            setEditingId(badge.id)
            setFormData({
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                category: badge.category,
                slug: badge.slug
            })
        } else {
            setEditingId(null)
            setFormData({
                name: "",
                description: "",
                icon: "🏆",
                category: "achievement",
                slug: ""
            })
        }
        setIsDialogOpen(true)
    }

    async function handleSubmit() {
        if (!formData.name || !formData.slug || !formData.icon) {
            toast.warning("Mohon lengkapi data (Nama, Slug, Icon)")
            return
        }

        try {
            if (editingId) {
                // Update
                const { error } = await supabase
                    .from("badges")
                    .update(formData)
                    .eq("id", editingId)

                if (error) throw error
                toast.success("Badge berhasil diperbarui")
            } else {
                // Create
                const { error } = await supabase
                    .from("badges")
                    .insert([formData])

                if (error) throw error
                toast.success("Badge berhasil dibuat")
            }

            setIsDialogOpen(false)
            fetchBadges()
        } catch (error: any) {
            console.error(error)
            toast.error("Gagal menyimpan: " + error.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Apakah Anda yakin ingin menghapus badge ini?")) return

        setIsDeleting(id)
        try {
            const { error } = await supabase.from("badges").delete().eq("id", id)
            if (error) throw error

            toast.success("Badge dihapus")
            setBadges(badges.filter(b => b.id !== id))
        } catch (error: any) {
            toast.error("Gagal menghapus: " + error.message)
        } finally {
            setIsDeleting(null)
        }
    }

    const filteredBadges = badges.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Manajemen Badges</h1>
                    <p className="text-muted-foreground">Kelola daftar pencapaian (gamification) untuk siswa.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Badge
                </Button>
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Cari badge..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Icon</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Slug (Kode)</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Memuat...</TableCell>
                            </TableRow>
                        ) : filteredBadges.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Tidak ada badge ditemukan.</TableCell>
                            </TableRow>
                        ) : (
                            filteredBadges.map((badge) => {
                                const IconComponent = iconMap[badge.icon]
                                return (
                                    <TableRow key={badge.id}>
                                        <TableCell className="text-2xl">
                                            {IconComponent ? <IconComponent className="w-6 h-6 text-primary" /> : badge.icon}
                                        </TableCell>
                                        <TableCell className="font-medium">{badge.name}</TableCell>
                                        <TableCell>{badge.description}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {badge.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{badge.slug}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(badge)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(badge.id)}
                                                disabled={isDeleting === badge.id}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Badge" : "Buat Badge Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi informasi badge. Slug harus unik dan digunakan dalam kode.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Nama</Label>
                            <Input
                                className="col-span-3"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Slug (ID)</Label>
                            <Input
                                className="col-span-3 font-mono"
                                placeholder="misal: 10_setoran"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Icon</Label>
                            <div className="col-span-3">
                                <Select
                                    value={formData.icon}
                                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(iconMap).map((key) => {
                                            const IconComp = iconMap[key]
                                            return (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex items-center gap-2">
                                                        <IconComp className="w-4 h-4" />
                                                        <span className="capitalize">{key}</span>
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                        <SelectItem value="emoji">
                                            <div className="flex items-center gap-2">
                                                <span>📝</span>
                                                <span>Custom Emoji (Ketik Manual)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.icon && !iconMap[formData.icon] && (
                                    <Input
                                        className="mt-2"
                                        placeholder="Ketik emoji atau nama icon..."
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Kategori</Label>
                            <Input
                                className="col-span-3"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Deskripsi</Label>
                            <Input
                                className="col-span-3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
