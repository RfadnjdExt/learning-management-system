
import { BadgeCard } from "./badge-card"
import { Badge, UserBadge } from "@/lib/gamification"

interface BadgeListProps {
    allBadges: Badge[]
    userBadges: UserBadge[]
    compact?: boolean
}

export function BadgeList({ allBadges, userBadges, compact = false }: BadgeListProps) {
    // Map earned status
    const earnedMap = new Map<string, string>() // badgeId -> awardedAt
    userBadges.forEach(ub => earnedMap.set(ub.badge_id, ub.awarded_at))

    const displayBadges = compact
        ? allBadges.filter(b => earnedMap.has(b.id)).slice(0, 3) // Show top 3 earned
        : allBadges

    if (compact && displayBadges.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground border rounded-md border-dashed">
                Belum ada pencapaian. Ayo mulai menghafal!
            </div>
        )
    }

    return (
        <div className={`grid gap-4 ${compact ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3"}`}>
            {displayBadges.map((badge) => {
                const isEarned = earnedMap.has(badge.id)
                const awardedAt = earnedMap.get(badge.id)

                return (
                    <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isLocked={!isEarned}
                        earnedAt={awardedAt}
                    />
                )
            })}
        </div>
    )
}
