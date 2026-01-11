"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AdminDashboardContent({ institutionId }: { institutionId: string }) {
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentClasses, setRecentClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [usersRes, classesRes] = await Promise.all([
        supabase
          .from("users")
          .select("*")
          .eq("institution_id", institutionId)
          .limit(5)
          .order("created_at", { ascending: false }),
        supabase
          .from("classes")
          .select("*, guru:users(full_name)")
          .eq("institution_id", institutionId)
          .limit(5)
          .order("created_at", { ascending: false }),
      ])

      setRecentUsers(usersRes.data || [])
      setRecentClasses(classesRes.data || [])
      setIsLoading(false)
    }

    fetchData()
  }, [institutionId, supabase])

  if (isLoading) {
    return <div className="text-center py-10">Memuat...</div>
  }

  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">Pengguna Baru</TabsTrigger>
        <TabsTrigger value="classes">Kelas Baru</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <Card>
          <CardHeader>
            <CardTitle>Pengguna Baru</CardTitle>
            <CardDescription>Pengguna terbaru yang terdaftar di institusi Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Nama</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Peran</th>
                    <th className="text-left py-2 px-4">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{user.full_name}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="classes">
        <Card>
          <CardHeader>
            <CardTitle>Kelas Baru</CardTitle>
            <CardDescription>Kelas terbaru yang dibuat di institusi Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Nama Kelas</th>
                    <th className="text-left py-2 px-4">Guru</th>
                    <th className="text-left py-2 px-4">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClasses.map((cls: any) => (
                    <tr key={cls.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{cls.name}</td>
                      <td className="py-2 px-4">{cls.guru?.full_name || "—"}</td>
                      <td className="py-2 px-4 text-muted-foreground">
                        {new Date(cls.created_at).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
