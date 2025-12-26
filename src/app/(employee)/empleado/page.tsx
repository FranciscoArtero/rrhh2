"use client"

import { useEmpleadaAuth } from "@/hooks/useEmpleadaAuth"
import { useFichajes } from "@/hooks/useFichajes"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useRouter } from "next/navigation"
import { Clock, MapPin } from "lucide-react"

export default function DashboardPage() {
    const { empleada } = useEmpleadaAuth()
    const { getHoy, getHistorial } = useFichajes()
    const router = useRouter()

    const [status, setStatus] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState<Date | null>(null)

    useEffect(() => {
        setCurrentDate(new Date())
        async function loadData() {
            const today = await getHoy()
            const hist = await getHistorial(undefined, undefined) // default month
            setStatus(today)
            setHistory(hist?.slice(0, 5) || [])
            setLoading(false)
        }
        loadData()
    }, [getHoy, getHistorial])

    const greeting = () => {
        if (!currentDate) return "Hola"
        const hour = currentDate.getHours()
        if (hour < 12) return "Buenos días"
        if (hour < 20) return "Buenas tardes"
        return "Buenas noches"
    }

    if (loading || !currentDate) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{greeting()}, {empleada?.nombre}!</h1>
                <p className="text-slate-500">{currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            {/* Main Status Card */}
            <Card className={`border-l-4 ${status?.isClockedIn ? 'border-l-green-500' : (status?.lastPunch?.tipo === 'SALIDA' ? 'border-l-primary' : 'border-l-slate-300')}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Estado Actual</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
                        {status?.isClockedIn ? (
                            <>
                                <div className="text-green-600 font-bold text-xl">🟢 ENTRADA REGISTRADA</div>
                                <div className="text-sm text-slate-600">
                                    Check-in: {new Date(status.lastPunch.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>
                                <div className="text-sm text-slate-600 flex items-center gap-1">
                                    <MapPin className="h-4 w-4" /> {status.lastPunch.local?.nombre || 'Ubicación desconocida'}
                                </div>
                            </>
                        ) : status?.lastPunch?.tipo === 'SALIDA' && new Date(status.lastPunch.timestamp).getDate() === currentDate?.getDate() ? (
                            <>
                                <div className="text-primary font-bold text-xl">🔵 JORNADA COMPLETADA</div>
                                <div className="text-sm text-slate-600">
                                    Salida: {new Date(status.lastPunch.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-500 font-medium text-lg">⚪ NO HAS FICHADO HOY</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Big Action Button */}
            <div className="flex justify-center py-4">
                <Button
                    size="lg"
                    className="rounded-full w-40 h-40 text-xl shadow-xl flex flex-col gap-2"
                    onClick={() => router.push('/empleado/fichar')}
                >
                    <Clock className="h-10 w-10" />
                    FICHAR
                </Button>
            </div>

            {/* Recent History */}
            <div>
                <h3 className="font-semibold mb-3">Últimos movimientos</h3>
                <div className="space-y-3">
                    {history.map((item: any) => (
                        <Card key={item.id} className="p-4 flex justify-between items-center text-sm">
                            <div>
                                <div className="font-medium text-slate-900">
                                    {item.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {new Date(item.timestamp).toLocaleDateString()} - {item.local?.nombre}
                                </div>
                            </div>
                            <div className="font-bold font-mono">
                                {new Date(item.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                        </Card>
                    ))}
                    {history.length === 0 && <p className="text-center text-sm text-slate-400">Sin movimientos recientes</p>}
                </div>
            </div>
        </div>
    )
}
