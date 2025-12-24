"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LoadingSpinner } from "../shared/LoadingSpinner"
import { LayoutDashboard, Store, Users, FileText, BarChart3, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login')
        }
    }, [status, router])

    if (status === 'loading') return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>
    if (!session) return null

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/locales', icon: Store, label: 'Locales' },
        { href: '/admin/empleadas', icon: Users, label: 'Empleados/as' },
        { href: '/admin/fichajes', icon: FileText, label: 'Fichajes' },
        { href: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
    ]

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                            <Image src="/logo.png" alt="La Vene" fill className="object-contain" />
                        </div>
                        <h1 className="text-xl font-bold">La Vene</h1>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                    isActive ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="mb-2 text-sm text-slate-400">
                        Logueado como: {session.user?.name}
                    </div>
                    <Button
                        variant="destructive"
                        className="w-full flex gap-2"
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    >
                        <LogOut className="h-4 w-4" /> Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b px-4 py-3 flex items-center lg:hidden sticky top-0 z-20">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="ml-4 font-semibold">La Vene</span>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
