import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as BadgeType } from "@/lib/gamification"
import { Award, Star, Zap, Trophy, Medal, Crown, BookOpen, Flame, Target } from "lucide-react"

// Map icon strings to components
const iconMap: Record<string, any> = {
    "award": Award,
    "star": Star,
    "zap": Zap,
    "trophy": Trophy,
    "medal": Medal,
    "crown": Crown,
    "book-open": BookOpen,
    "flame": Flame,
    "target": Target
}

// Helper to get colors based on category
const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes("milestone")) return "orange"
    if (cat.includes("hafalan")) return "blue"
    if (cat.includes("kualitas") || cat.includes("mumtaz")) return "purple"
    if (cat.includes("kedisiplinan")) return "green"
    if (cat.includes("keaktifan")) return "pink"
    if (cat.includes("streak") || cat.includes("rajin")) return "red"
    return "slate"
}

// Map color names to Tailwind classes (backgrounds and text)
const colorClasses: Record<string, { bg: string, text: string, border: string, iconBg: string }> = {
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", iconBg: "bg-orange-100" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", iconBg: "bg-blue-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", iconBg: "bg-purple-100" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100", iconBg: "bg-green-100" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100", iconBg: "bg-pink-100" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", iconBg: "bg-red-100" },
    slate: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", iconBg: "bg-slate-100" },
}

interface BadgeCardProps {
    badge: BadgeType
    earnedAt?: string // Date string if earned
    isLocked?: boolean
}

export function BadgeCard({ badge, earnedAt, isLocked = false }: BadgeCardProps) {
    const IconComponent = iconMap[badge.icon] || Star
    const colorKey = getCategoryColor(badge.category)
    const colors = colorClasses[colorKey]

    if (isLocked) {
        return (
            <div className="group h-full p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 opacity-60 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center justify-between mb-4 gap-4">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                        {badge.category}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                        <IconComponent className="h-5 w-5" />
                    </div>
                </div>
                <h4 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">{badge.name}</h4>
                <p className="text-sm text-slate-400 dark:text-slate-600 leading-relaxed">
                    {badge.description}
                </p>
            </div>
        )
    }

    return (
        <div className={`group h-full p-6 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 bg-white dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 ${colors.border}`}>
            <div className="flex items-center justify-between mb-4 gap-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                    {badge.category}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.text} shrink-0`}>
                    <IconComponent className="h-5 w-5" />
                </div>
            </div>

            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 min-h-[3.5rem] flex items-start">
                {badge.name}
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed min-h-[2.5rem] line-clamp-2">
                {badge.description}
            </p>

            <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full w-full ${colors.text.replace('text-', 'bg-')}`}></div>
                </div>
                <span className={`text-[10px] font-bold ${colors.text}`}>
                    {earnedAt ? new Date(earnedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: '2-digit' }) : "UNLOCKED"}
                </span>
            </div>
        </div>
    )
}
