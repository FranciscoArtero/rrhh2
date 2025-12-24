"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import PublicLayout from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorMessage } from "@/components/shared/ErrorMessage"
import Link from "next/link"

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email,
                password
            })

            if (res?.error) {
                setError("Credenciales inválidas")
            } else {
                router.push('/admin')
            }
        } catch (err) {
            setError("Error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <PublicLayout title="Panel Administrativo">
            <form onSubmit={handleSubmit} className="space-y-6">
                <ErrorMessage message={error} />

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="Ej: admin@lavene.com"
                        className="placeholder:italic placeholder:text-slate-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        className="placeholder:italic placeholder:text-slate-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <Link href="/login" className="text-slate-500 hover:text-primary underline">
                    ¿Sos empleado/a? Ingresá aquí
                </Link>
            </div>
        </PublicLayout>
    )
}
