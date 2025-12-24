"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEmpleadaAuth } from "@/hooks/useEmpleadaAuth"
import PublicLayout from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorMessage } from "@/components/shared/ErrorMessage"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const { refresh } = useEmpleadaAuth()
    const [dni, setDni] = useState("")
    const [pin, setPin] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch('/api/auth/employee/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, pin })
            })
            const data = await res.json()

            if (data.success) {
                await refresh() // Update context
                router.push('/empleado')
            } else {
                setError(data.error || "Error al iniciar sesión")
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <PublicLayout title="Ingreso Empleados/as">
            <form onSubmit={handleSubmit} className="space-y-6">
                <ErrorMessage message={error} />

                <div className="space-y-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                        id="dni"
                        type="text"
                        placeholder="Ej: 12345678"
                        className="placeholder:italic placeholder:text-slate-400"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        required
                        pattern="[0-9]*"
                        inputMode="numeric"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pin">PIN de acceso</Label>
                    <Input
                        id="pin"
                        type="password"
                        placeholder="Ej: 1234"
                        className="placeholder:italic placeholder:text-slate-400"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        pattern="[0-9]*"
                        inputMode="numeric"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <Link href="/api/auth/signin" className="text-slate-500 hover:text-primary underline">
                    ¿Sos admin? Ingresá aquí
                </Link>
            </div>
        </PublicLayout>
    )
}
