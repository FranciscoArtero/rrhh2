"use client"

import { useFichajes } from "@/hooks/useFichajes"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Badge } from "@/components/ui/badge"

export default function HistoryPage() {
    const { getHistorial } = useFichajes()
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState<string>("")
    const [currentYear, setCurrentYear] = useState<number>(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const now = new Date()
        setSelectedMonth(now.getMonth().toString())
        setCurrentYear(now.getFullYear())
    }, [])

    useEffect(() => {
        if (!mounted || !selectedMonth) return

        async function loadData() {
            setLoading(true)
            const hist = await getHistorial(Number(selectedMonth) + 1, currentYear)
            setHistory(hist)
            setLoading(false)
        }
        loadData()
    }, [selectedMonth, currentYear, mounted, getHistorial])

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    if (!mounted) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Mi Historial</h1>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                    {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                            {month} {currentYear}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="space-y-4">
                    {history.length > 0 ? history.map((item: any) => (
                        <Card key={item.id} className="relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${item.tipo === 'ENTRADA' ? 'bg-green-500' : 'bg-primary'}`} />
                            <CardContent className="p-4 pl-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg">
                                            {new Date(item.timestamp).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-slate-500">{item.local?.nombre || 'Sin local'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-mono font-bold">
                                            {new Date(item.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </div>
                                        <Badge variant={item.tipo === 'ENTRADA' ? "default" : "secondary"} className="mt-1">
                                            {item.tipo}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-10 text-slate-500">
                            No hay registros este mes
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
