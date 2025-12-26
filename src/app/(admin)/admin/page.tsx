"use client"

import { useEffect, useState } from "react"
import { StatsCard } from "@/components/admin/StatsCard"
import { DataTable } from "@/components/admin/DataTable"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Users, Store, Clock, Activity, CalendarDays, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts' // Importing directly




export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/reportes/estadisticas-dashboard')
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                } else {
                    const errData = await res.json().catch(() => null)
                    setError(errData?.details || errData?.error || "Error al cargar datos del servidor")
                }
            } catch (e) {
                console.error(e)
                setError("Error de conexión")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>

    if (error) return (
        <div className="h-64 flex flex-col items-center justify-center text-red-500">
            <p className="font-bold">Ocurrió un error</p>
            <p className="text-sm">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">Reintentar</Button>
        </div>
    )

    if (!stats) return null

    return (
        <div className="space-y-8 animate-in fade-in">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Empleados/as Activos"
                    value={stats.activeEmployees}
                    icon={Users}
                    description="Total registrado"
                />
                <StatsCard
                    title="Locales Activos"
                    value={stats.activeLocales}
                    icon={Store}
                    description="Operativos"
                />
                <StatsCard
                    title="Fichajes de Hoy"
                    value={stats.todayPunches}
                    icon={Clock}
                    description="entradas y salidas"
                />
                <StatsCard
                    title="En Turno Ahora"
                    value={stats.workingNow ? stats.workingNow.length : 0}
                    icon={Activity}
                    description="Trabajando actualmente"
                />
            </div>

            {/* Additional Metrics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Horas Semana"
                    value={stats.totalWeeklyHours}
                    icon={TrendingUp}
                    description="Total trabajadas"
                />
                <StatsCard
                    title="Promedio Hora/Emp"
                    value={stats.avgHoursPerEmployee}
                    icon={Users}
                    description="Esta semana"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                {/* Weekly Chart */}
                <Card className="col-span-4 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Actividad Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.weeklyChart}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748B"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748B"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="fichajes" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Working Now List */}
                <Card className="col-span-3 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-green-600 animate-pulse" /> Trabajando Ahora</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.workingNow && stats.workingNow.length > 0 ? (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {stats.workingNow.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex gap-3 items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                            <div>
                                                <div className="font-medium text-sm">{item.nombre}</div>
                                                <div className="text-xs text-slate-500">{item.local}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                            {new Date(item.horaEntrada).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                                <Users className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">Nadie trabajando en este momento.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Punches Table */}
            <Card className="shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-base font-semibold">Últimos Fichajes Registrados</CardTitle>
                </CardHeader>
                <div className="p-0">
                    <DataTable
                        data={stats.recentPunches}
                        columns={[
                            { header: 'Empleado/a', accessorKey: 'empleado' as any },
                            { header: 'Local', accessorKey: 'local' as any },
                            {
                                header: 'Tipo', cell: (row: any) => (
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {row.tipo}
                                    </span>
                                )
                            },
                            { header: 'Hora', cell: (row) => <span className="font-mono text-sm">{new Date(row.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span> },
                            {
                                header: 'Metodo', cell: (row) => {
                                    const map: any = { 'WEBAUTHN_HUELLA': 'Huella', 'WEBAUTHN_FACE': 'FaceID', 'RECONOCIMIENTO_FACIAL': 'Facial IA', 'PIN_EMERGENCIA': 'PIN' };
                                    return <span className="text-xs text-slate-500">{map[row.metodo] || 'Otro'}</span>
                                }
                            }
                        ]}
                    />
                </div>
            </Card>
        </div>
    )
}
