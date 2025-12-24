"use client"

import { useEmpleadaAuth } from "@/hooks/useEmpleadaAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Smartphone } from "lucide-react"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"
import { DeviceRegistration } from "@/components/employee/DeviceRegistration"
import { PhotoRegistration } from "@/components/employee/PhotoRegistration"

export default function ProfilePage() {
    const { empleada, logout } = useEmpleadaAuth()
    const [devices, setDevices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDevices() {
            try {
                const res = await fetch('/api/dispositivos')
                const data = await res.json()
                if (data.success) {
                    setDevices(data.data)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadDevices()
    }, [])

    const deleteDevice = async (id: string) => {
        try {
            const res = await fetch(`/api/dispositivos/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setDevices(devices.filter(d => d.id !== id))
                toast.success("Dispositivo eliminado")
            } else {
                toast.error("Error al eliminar dispositivo")
            }
        } catch (e) {
            toast.error("Error inesperado")
        }
    }

    if (!empleada) return <LoadingSpinner />

    return (
        <div className="space-y-6">

            {/* Profile Info */}
            <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={empleada.fotoRegistroUrl || undefined} />
                    <AvatarFallback className="text-xl bg-primary text-white">
                        {empleada.nombre[0]}{empleada.apellido[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{empleada.nombre} {empleada.apellido}</h2>
                    <p className="text-slate-500">{empleada.email}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Mis Dispositivos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <LoadingSpinner /> : (
                        <div className="space-y-4">
                            {devices.map((device) => (
                                <div key={device.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <div className="font-medium text-sm">{device.nombre}</div>
                                            <div className="text-xs text-slate-500">
                                                {device.ultimoUso ? new Date(device.ultimoUso).toLocaleDateString() : 'Nunca usado'}
                                            </div>
                                        </div>
                                    </div>
                                    <ConfirmDialog
                                        title="Eliminar dispositivo"
                                        description="¿Estás seguro? Tendrás que volver a registrarlo para usarlo."
                                        onConfirm={() => deleteDevice(device.id)}
                                        triggerVariant="ghost"
                                        confirmVariant="destructive"
                                    >
                                        <Button variant="ghost" size="sm" className="text-red-500">Eliminar</Button>
                                    </ConfirmDialog>
                                </div>
                            ))}
                            {devices.length === 0 && <p className="text-sm text-slate-400">No tienes dispositivos registrados</p>}
                        </div>
                    )}
                </CardContent>
            </Card>

            <DeviceRegistration
                onRegistroExitoso={() => {
                    window.location.reload();
                }}
                empleadoId={empleada.id}
            />

            <PhotoRegistration
                empleadoId={empleada.id}
                fotoActualUrl={empleada.fotoRegistroUrl}
                onRegistroExitoso={() => window.location.reload()}
            />

            <Button variant="destructive" className="w-full flex gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
            </Button>
        </div >
    )
}
