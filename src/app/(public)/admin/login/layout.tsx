// Force dynamic rendering for all pages in this route
// This prevents prerendering which would fail due to NEXTAUTH_URL not being set during build
export const dynamic = 'force-dynamic'

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
