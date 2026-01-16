"use server"

import { checkBadges } from "@/lib/gamification"
import { revalidatePath } from "next/cache"

export async function triggerBadgeCheckAction(userId: string) {
    try {
        const newBadges = await checkBadges(userId)

        if (newBadges.length > 0) {
            revalidatePath("/murid/dashboard")
            revalidatePath("/murid/achievements")
        }

        return { success: true, newBadges }
    } catch (error) {
        console.error("Error triggerBadgeCheckAction:", error)
        return { success: false, error: "Failed to check badges" }
    }
}
