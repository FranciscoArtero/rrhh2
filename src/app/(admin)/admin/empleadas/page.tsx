"use client"

import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default function EmpleadasPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Gestión de Empleados</h1>
            <p>Mantenimiento: Página desactivada temporalmente para debug de build.</p>
            <Button variant="outline" className="mt-4">Volver</Button>
        </div>
    )
}
