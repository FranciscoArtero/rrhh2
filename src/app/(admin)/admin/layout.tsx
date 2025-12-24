import AdminWrapper from "./AdminWrapper"

export const dynamic = 'force-dynamic'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AdminWrapper>
            {children}
        </AdminWrapper>
    )
}
