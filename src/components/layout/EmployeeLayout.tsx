"use client"

import { useEmpleadaAuth } from "@/hooks/useEmpleadaAuth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "../shared/LoadingSpinner"
import { Home, Clock, History, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const { empleada, loading } = useEmpleadaAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !empleada) {
            router.push('/login')
        }
    }, [loading, empleada, router])

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>
    if (!empleada) return null

    const navItems = [
        { href: '/empleado', icon: Home, label: 'Inicio' },
        { href: '/empleado/fichar', icon: Clock, label: 'Fichar' },
        { href: '/empleado/historial', icon: History, label: 'Historial' },
        { href: '/empleado/perfil', icon: User, label: 'Perfil' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                        <Image src="/logo.png" alt="La Vene" fill className="object-contain" />
                    </div>
                    <div className="font-bold text-lg text-primary">La Vene</div>
                </div>
                <div className="text-sm font-medium">Hola, {empleada.nombre}</div>
            </header>

            {/* Content */}
            <main className="flex-1 p-4 pb-20">
                {children}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 z-20 pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                                isActive ? "text-primary" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
