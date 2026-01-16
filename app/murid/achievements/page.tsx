import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { BadgeList } from "@/components/gamification/badge-list"
import { getEarnedBadges, getAllBadges, checkBadges, Badge, UserBadge } from "@/lib/gamification"
import { Trophy } from "lucide-react"

export default async function AchievementsPage() {
    const { userData } = await getCurrentUserWithRole()

    // Trigger check on load (in a real app, maybe do this on login or evaluation submission, but here ensures latest)
    await checkBadges(userData.id)

    // Fetch data
    const [allBadges, earnedBadges] = await Promise.all([
        getAllBadges(),
        getEarnedBadges(userData.id)
    ])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Trophy className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Pencapaian Saya</h1>
                    <p className="text-muted-foreground">Koleksi lencana dari perjalanan menghafalmu</p>
                </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border flex gap-4 items-center">
                <div className="text-2xl font-bold">{earnedBadges.length} / {allBadges.length}</div>
                <div className="text-sm text-muted-foreground">Lencana Terkumpul</div>
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${(earnedBadges.length / allBadges.length) * 100}%` }}
                    />
                </div>
            </div>

            <BadgeList allBadges={allBadges} userBadges={earnedBadges} />
        </div>
    )
}
