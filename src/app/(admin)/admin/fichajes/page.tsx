"use client"

import { useAdmin } from "@/hooks/useAdmin"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToCSV } from "@/lib/export"
import { Download, Search, X } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function FichajesPage() {
    const { getFichajes, getLocales, getEmpleadas, loading } = useAdmin()
    const [fichajes, setFichajes] = useState<any[]>([])
    const [locales, setLocales] = useState<any[]>([])
    const [empleadas, setEmpleadas] = useState<any[]>([])

    // Filters
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        idLocal: '',
        idEmpleada: ''
    })

    useEffect(() => {
        // Load options
        Promise.all([getLocales(), getEmpleadas()]).then(([l, e]) => {
            setLocales(l)
            setEmpleadas(e)
        })
        // Load initial data
        handleFilter()
    }, [])

    const handleFilter = async () => {
        const data = await getFichajes(filters)
        setFichajes(data)
    }

    const handleClear = () => {
        setFilters({ dateFrom: '', dateTo: '', idLocal: '', idEmpleada: '' })
        // We want to trigger a search with empty filters, but state update is async.
        // So we pass empty object directly
        getFichajes({}).then(data => setFichajes(data))
    }

    const handleExport = () => {
        // Prepare flat data for CSV
        const flatData = fichajes.map(f => ({
            Fecha: new Date(f.timestamp).toLocaleDateString(),
            Hora: new Date(f.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            Empleada: `${f.empleada.nombre} ${f.empleada.apellido}`,
            DNI: f.empleada.dni,
            Local: f.local?.nombre || 'N/A',
            Tipo: f.tipo,
            Metodo: f.metodoVerificacion,
            Latitud: f.latitud,
            Longitud: f.longitud
        }))
        exportToCSV(flatData, `fichajes-export-${new Date().toISOString().split('T')[0]}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Historial de Fichajes</h1>
                <Button variant="outline" onClick={handleExport} disabled={fichajes.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4 items-end">
                <div className="w-40">
                    <label className="text-xs font-semibold mb-1 block">Desde</label>
                    <Input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
                </div>
                <div className="w-40">
                    <label className="text-xs font-semibold mb-1 block">Hasta</label>
                    <Input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
                </div>
                <div className="w-48">
                    <label className="text-xs font-semibold mb-1 block">Local</label>
                    <Select value={filters.idLocal} onValueChange={v => setFilters({ ...filters, idLocal: v })}>
                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Todos</SelectItem> {/* Workaround: UI select clear */}
                            {locales.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-48">
                    <label className="text-xs font-semibold mb-1 block">Empleada</label>
                    <Select value={filters.idEmpleada} onValueChange={v => setFilters({ ...filters, idEmpleada: v })}>
                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Todas</SelectItem>
                            {empleadas.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleFilter}><Search className="h-4 w-4 mr-2" /> Filtrar</Button>
                    <Button variant="ghost" onClick={handleClear}><X className="h-4 w-4" /></Button>
                </div>
            </div>

            <DataTable
                columns={[
                    { header: 'Fecha', cell: (row) => new Date(row.timestamp).toLocaleDateString() },
                    { header: 'Hora', cell: (row) => new Date(row.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) },
                    { header: 'Empleada', cell: (row) => `${row.empleada.nombre} ${row.empleada.apellido}` },
                    { header: 'Local', cell: (row) => row.local?.nombre || '-' },
                    {
                        header: 'Tipo', cell: (row) => (
                            <span className={`font-bold ${row.tipo === 'ENTRADA' ? 'text-green-600' : 'text-blue-600'}`}>
                                {row.tipo}
                            </span>
                        )
                    },
                    { header: 'Método', accessorKey: 'metodoVerificacion' },
                ]}
                data={fichajes}
                loading={loading}
            />
        </div>
    )
}
