import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
    triggerText?: string
    triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    title: string
    description: string
    confirmText?: string
    confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    cancelText?: string
    onConfirm: () => void
    children?: React.ReactNode
}

export function ConfirmDialog({
    triggerText,
    triggerVariant = "default",
    title,
    description,
    confirmText = "Continuar",
    confirmVariant = "default",
    cancelText = "Cancelar",
    onConfirm,
    children
}: ConfirmDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children ? children : <Button variant={triggerVariant}>{triggerText}</Button>}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className={confirmVariant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>{confirmText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
