
import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { ClassManager } from "@/components/guru/class-manager"

type Props = {
    params: Promise<{ id: string }>
}

export default async function ClassDetailsPage({ params }: Props) {
    const { userData } = await getCurrentUserWithRole()
    const { id } = await params

    return (
        <div className="p-6">
            <ClassManager classId={id} guruId={userData.id} />
        </div>
    )
}
