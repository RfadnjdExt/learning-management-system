import { createClient } from "@/lib/supabase/server"

export type Badge = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  created_at: string
}

export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
  badge?: Badge
}

export async function checkBadges(userId: string) {
  const supabase = await createClient()

  // 1. Fetch current stats & history
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("additional_notes, created_at, session:sessions(session_date)")
    .eq("user_id", userId)
    .order("session_id", { ascending: false }) // Approximate order by session

  const evalCount = evaluations?.length || 0

  if (!evaluations) return []

  // 2. Fetch earned badges
  const { data: earnedBadges, error: earnedError } = await supabase
    .from("user_badges")
    .select("badge:badges(slug)")
    .eq("user_id", userId)

  if (earnedError) console.error("Error fetching earned badges:", earnedError)

  const earnedSlugs = new Set(earnedBadges?.map((ub: any) => ub.badge?.slug) || [])

  // 3. Define Badge Rules
  const newBadges: string[] = []

  // Rule: First Step
  if (evalCount >= 1 && !earnedSlugs.has("first-step")) {
    newBadges.push("first-step")
  }

  // Rule: High Achiever (10 evals)
  if (evalCount >= 10 && !earnedSlugs.has("high-achiever")) {
    newBadges.push("high-achiever")
  }

  // Rule: Hafal Juz 30 (Check notes for "Juz 30")
  const hasJuz30 = evaluations.some(e =>
    e.additional_notes?.toLowerCase().includes("juz 30") ||
    e.additional_notes?.toLowerCase().includes("juz amma")
  )
  if (hasJuz30 && !earnedSlugs.has("hafal-juz-30")) {
    newBadges.push("hafal-juz-30")
  }

  // Rule: 7 Days Streak
  // Calculate streak from unique session dates
  const uniqueDates = Array.from(new Set(
    evaluations
      .map((e: any) => e.session?.session_date) // Cast to any to handle Supabase join type
      .filter(Boolean)
      .sort()
  ))

  let currentStreak = 0
  let maxStreak = 0

  // Simple streak logic (consecutive days)
  if (uniqueDates.length > 0) {
    currentStreak = 1
    maxStreak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1])
      const curr = new Date(uniqueDates[i])
      const diffTime = Math.abs(curr.getTime() - prev.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak
    }
  }

  if (maxStreak >= 7 && !earnedSlugs.has("streak-7-days")) {
    newBadges.push("streak-7-days")
  }

  // 4. Award Badges
  if (newBadges.length > 0) {
    // Get badge IDs
    const { data: badgeDefs } = await supabase
      .from("badges")
      .select("id, slug")
      .in("slug", newBadges)

    if (badgeDefs) {
      const badgesToInsert = badgeDefs.map((b) => ({
        user_id: userId,
        badge_id: b.id,
      }))

      const { error: insertError } = await supabase.from("user_badges").insert(badgesToInsert)
      if (insertError) {
        console.error("Error awarding badges:", insertError)
      } else {
        console.log(`Awarded badges [${newBadges.join(", ")}] to user ${userId}`)
      }
    }
  }

  return newBadges
}

export async function getEarnedBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false })

  // Transform to match type if needed, but Supabase response usually matches if typed correctly or we trust it.
  // Casting for simplicity in this generated file
  return (data || []) as UserBadge[]
}

export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("badges")
    .select("*")
    .order("category", { ascending: true })

  return (data || []) as Badge[]
}
