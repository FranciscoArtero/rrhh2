
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/admin/DataTable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Download, FileText, CalendarCheck, MapPin } from "lucide-react"
import { downloadCSV } from "@/lib/calculos"

export default function ReportsPage() {
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])

    // Filters
    const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().split('T')[0])
    const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0])
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString())
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())

    // ----------------------------------------------------
    // Handlers
    // ----------------------------------------------------

    const loadHoursEmployee = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reportes/horas-empleado?fechaDesde=${dateFrom}&fechaHasta=${dateTo}`)
            if (res.ok) setReportData(await res.json())
        } finally { setLoading(false) }
    }

    const loadHoursLocal = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reportes/horas-local?fechaDesde=${dateFrom}&fechaHasta=${dateTo}`)
            if (res.ok) setReportData(await res.json())
        } finally { setLoading(false) }
    }

    const loadAttendance = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reportes/asistencia-mensual?mes=${month}&anio=${year}`)
            if (res.ok) setReportData(await res.json())
        } finally { setLoading(false) }
    }

    // Export Handlers
    const exportCSV = (type: 'empleado' | 'local') => {
        if (type === 'empleado') {
            downloadCSV(reportData, ['Nombre', 'Días', 'Hs Normales', 'Hs Extras', 'Hs Nocturnas', 'Total Horas', 'Formato'], `horas_empleados_${dateFrom}_${dateTo}.csv`)
        } else {
            downloadCSV(reportData, ['Local', 'Fichajes', 'Horas Totales', 'Empleados Unicos', 'Formato'], `horas_locales_${dateFrom}_${dateTo}.csv`)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
            </div>

            <Tabs defaultValue="hours-emp" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-6">
                    <TabsTrigger value="hours-emp">Horas Empleado</TabsTrigger>
                    <TabsTrigger value="hours-local">Por Local</TabsTrigger>
                    <TabsTrigger value="attendance">Asistencia</TabsTrigger>

                </TabsList>

                {/* 1. HORAS POR EMPLEADO */}
                <TabsContent value="hours-emp" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Reporte de Horas Trabajadas</CardTitle>
                            <CardDescription>Calcula horas totales, promedio y extras en un rango de fechas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end mb-6">
                                <div className="space-y-2">
                                    <Label>Desde</Label>
                                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hasta</Label>
                                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                </div>
                                <Button onClick={loadHoursEmployee} disabled={loading}>
                                    {loading ? <LoadingSpinner /> : "Generar Reporte"}
                                </Button>
                                {reportData.length > 0 && (
                                    <Button variant="outline" onClick={() => exportCSV('empleado')}>
                                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                                    </Button>
                                )}
                            </div>

                            {reportData.length > 0 ? (
                                <DataTable
                                    data={reportData}
                                    columns={[
                                        { header: "Empleado/a", accessorKey: "nombre" as any },
                                        { header: "Días Trab.", accessorKey: "diasTrabajados" as any },
                                        { header: "Hs Normales", accessorKey: "horasNormales" as any },
                                        { header: "Hs Extras", accessorKey: "horasExtra" as any, cell: (row: any) => <span className={row.horasExtra > 0 ? "text-amber-600 font-bold" : ""}>{row.horasExtra}</span> },
                                        { header: "Hs Nocturnas", accessorKey: "horasNocturnas" as any, cell: (row: any) => <span className={row.horasNocturnas > 0 ? "text-indigo-600 font-bold" : ""}>{row.horasNocturnas}</span> },
                                        { header: "Total", accessorKey: "horasTotales" as any, cell: (row: any) => <span className="font-bold">{row.horasTotales}</span> },
                                        { header: "Formato", accessorKey: "horasFormato" as any },
                                    ]}
                                />
                            ) : (
                                <div className="text-center text-slate-500 py-10">
                                    <p>No se encontraron datos para el rango seleccionado.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. HORAS POR LOCAL */}
                <TabsContent value="hours-local" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Actividad por Local</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end mb-6">
                                <div className="space-y-2">
                                    <Label>Desde</Label>
                                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hasta</Label>
                                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                </div>
                                <Button onClick={loadHoursLocal} disabled={loading}>Generar</Button>
                                {reportData.length > 0 && (
                                    <Button variant="outline" onClick={() => exportCSV('local')}>
                                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                                    </Button>
                                )}
                            </div>

                            {reportData.length > 0 && reportData[0].local && (
                                <DataTable
                                    data={reportData}
                                    columns={[
                                        { header: "Local", accessorKey: "local" as any },
                                        { header: "Cant. Fichajes", accessorKey: "fichajes" as any },
                                        { header: "Horas Totales", accessorKey: "totalHoras" as any },
                                        { header: "Personal Único", accessorKey: "empleadosUnicos" as any },
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. ASISTENCIA MENSUAL */}
                <TabsContent value="attendance" className="space-y-4">
                    <Card className="min-w-full overflow-x-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarCheck className="w-5 h-5" /> Asistencia Mensual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end mb-6">
                                <div className="space-y-2 w-32">
                                    <Label>Mes</Label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_, i) => (
                                                <SelectItem key={i} value={(i + 1).toString()}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 w-32">
                                    <Label>Año</Label>
                                    <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
                                </div>
                                <Button onClick={loadAttendance} disabled={loading}>Ver Asistencia</Button>
                            </div>

                            {/* Custom Grid for Attendance */}
                            {reportData.length > 0 && reportData[0].asistencia && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="text-left p-2 border bg-slate-50 min-w-[150px] sticky left-0 z-10">Empleado/a</th>
                                                <th className="p-2 border bg-slate-50">Resumen</th>
                                                {reportData[0].asistencia.map((d: any) => (
                                                    <th key={d.day} className="p-1 border min-w-[30px] text-center bg-slate-50 font-normal text-xs text-slate-500">
                                                        {d.day}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((emp: any) => (
                                                <tr key={emp.id} className="hover:bg-slate-50">
                                                    <td className="p-2 border font-medium sticky left-0 bg-white z-10">{emp.nombre}</td>
                                                    <td className="p-2 border text-xs text-center">{emp.resumen.porcentaje}% <span className="text-slate-400">({emp.resumen.presentes}d)</span></td>
                                                    {emp.asistencia.map((d: any) => (
                                                        <td key={d.day} className="border p-0 text-center h-8">
                                                            <div className={`w-full h-full flex items-center justify-center
                                                                ${d.status === 'PRESENT' ? 'bg-green-100 text-green-600 font-bold' :
                                                                    d.status === 'WEEKEND' ? 'bg-slate-100 text-slate-300' :
                                                                        'bg-white text-red-100'}`}
                                                            >
                                                                {d.status === 'PRESENT' ? '✓' : d.status === 'ABSENT' ? '·' : ''}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 4. VERIFICACIÓN (Oculto en UI pero mantenido en código si se necesita reactivar) */}
                {/* 
                <TabsContent value="verification" className="space-y-4">
                     ... (Valid content commented out) ...
                </TabsContent> 
                */}

            </Tabs>
        </div>
    )
}
