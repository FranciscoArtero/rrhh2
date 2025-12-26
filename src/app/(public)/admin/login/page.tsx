import PublicLayout from "@/components/layout/PublicLayout"
import AdminLoginForm from "@/components/auth/AdminLoginForm"

export default function AdminLoginPage() {
    return (
        <PublicLayout title="Panel Administrativo">
            <AdminLoginForm />
        </PublicLayout>
    )
}
