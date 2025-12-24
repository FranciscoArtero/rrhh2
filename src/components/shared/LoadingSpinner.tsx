import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export function LoadingSpinner({ className }: { className?: string }) {
    return (
        <div className={cn("flex justify-center items-center p-4", className)}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}
