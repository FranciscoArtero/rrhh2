"use client"

import { useAdmin } from "@/hooks/useAdmin"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Search, MapPin, ExternalLink } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

export default function LocalesPage() {
    const { getLocales, savedLocal, deleteLocal, loading } = useAdmin()
    const [locales, setLocales] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [editingLocal, setEditingLocal] = useState<any>(null)

    // Form States
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: '',
        radioMetros: '100'
    })

    // Geocoding States
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [importLink, setImportLink] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const loadData = async () => {
        const data = await getLocales()
        setLocales(data)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleOpen = (local?: any) => {
        setSearchQuery('')
        setSearchResults([])
        setImportLink('')

        if (local) {
            setEditingLocal(local)
            setFormData({
                nombre: local.nombre,
                direccion: local.direccion,
                latitud: local.latitud.toString(),
                longitud: local.longitud.toString(),
                radioMetros: local.radioMetros.toString()
            })
        } else {
            setEditingLocal(null)
            setFormData({ nombre: '', direccion: '', latitud: '', longitud: '', radioMetros: '100' })
        }
        setIsOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            id: editingLocal?.id,
            nombre: formData.nombre,
            direccion: formData.direccion,
            latitud: parseFloat(formData.latitud),
            longitud: parseFloat(formData.longitud),
            radioMetros: parseInt(formData.radioMetros)
        }

        const success = await savedLocal(payload)
        if (success) {
            setIsOpen(false)
            loadData()
        }
    }

    const handleDelete = async (id: string) => {
        const success = await deleteLocal(id)
        if (success) loadData()
    }

    // --- GEOCODING LOGIC ---

    const handleSearchAddress = async () => {
        if (!searchQuery) return
        setIsSearching(true)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            setSearchResults(data)
        } catch (error) {
            toast.error("Error buscando dirección")
        } finally {
            setIsSearching(false)
        }
    }

    const selectAddress = (result: any) => {
        setFormData({
            ...formData,
            direccion: result.display_name.split(',')[0], // Take first part usually street
            latitud: result.lat,
            longitud: result.lon
        })
        setSearchResults([])
        // Optional: Keep full address in a separate state or overwrite
    }

    const handleParseLink = () => {
        if (!importLink) return

        // Regex for @lat,lon
        const match = importLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
        if (match) {
            setFormData({
                ...formData,
                latitud: match[1],
                longitud: match[2]
            })
            toast.success("Coordenadas extraídas del link")
        } else {
            // Try search query param if present ?q=lat,lon or similar
            const match2 = importLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/)
            if (match2) {
                setFormData({
                    ...formData,
                    latitud: match2[1],
                    longitud: match2[2]
                })
                toast.success("Coordenadas extraídas del link")
            } else {
                toast.error("No se encontraron coordenadas en el link (buscamos formato @lat,lon)")
            }
        }
    }

    const verifyOnMap = () => {
        if (!formData.latitud || !formData.longitud) return
        window.open(`https://www.google.com/maps/search/?api=1&query=${formData.latitud},${formData.longitud}`, '_blank')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Locales</h1>
                <Button onClick={() => handleOpen()}><Plus className="mr-2 h-4 w-4" /> Agregar Local</Button>
            </div>

            <DataTable
                columns={[
                    { header: 'Nombre', accessorKey: 'nombre' },
                    { header: 'Dirección', accessorKey: 'direccion' },
                    { header: 'Lat/Lng', cell: (row) => <div className="text-xs font-mono">{Number(row.latitud).toFixed(4)}, {Number(row.longitud).toFixed(4)}</div> },
                    { header: 'Radio (m)', accessorKey: 'radioMetros' },
                    {
                        header: 'Acciones', cell: (row) => (
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => handleOpen(row)}><Edit className="h-4 w-4" /></Button>
                                <ConfirmDialog
                                    title="Desactivar Local"
                                    description="¿Estás seguro? El local dejará de estar disponible para fichajes."
                                    onConfirm={() => handleDelete(row.id)}
                                    triggerVariant="ghost"
                                    confirmVariant="destructive"
                                >
                                    <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </ConfirmDialog>
                            </div>
                        )
                    }
                ]}
                data={locales}
                loading={loading}
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingLocal ? 'Editar Local' : 'Nuevo Local'}</DialogTitle>
                    </DialogHeader>

                    {/* --- BUSCADOR --- */}
                    <div className="bg-slate-50 p-4 rounded-md border text-sm space-y-4">
                        <div className="font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Herramientas de Ubicación
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Nominatim Search */}
                            <div className="space-y-2">
                                <Label>Buscar Dirección (Calle y Altura, Ciudad)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ej: Av. Corrientes 1234, CABA"
                                        className="placeholder:italic placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
                                    />
                                    <Button variant="secondary" size="icon" onClick={handleSearchAddress} disabled={isSearching}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="border rounded-md bg-white max-h-40 overflow-y-auto divide-y shadow-sm">
                                        {searchResults.map((res: any, i) => (
                                            <div
                                                key={i}
                                                className="p-2 hover:bg-slate-100 cursor-pointer text-xs"
                                                onClick={() => selectAddress(res)}
                                            >
                                                {res.display_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Google Maps Link */}
                            <div className="space-y-2">
                                <Label>Pegar link de Google Maps</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://maps.google.com/..."
                                        className="placeholder:italic placeholder:text-slate-400"
                                        value={importLink}
                                        onChange={e => setImportLink(e.target.value)}
                                    />
                                    <Button variant="secondary" size="sm" onClick={handleParseLink}>
                                        Extraer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div>
                            <Label>Nombre del Local</Label>
                            <Input placeholder="Ej: Local Centro" className="placeholder:italic placeholder:text-slate-400" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                        </div>
                        <div>
                            <Label>Dirección</Label>
                            <Input placeholder="Ej: Av. Corrientes 1234, CABA" className="placeholder:italic placeholder:text-slate-400" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Latitud</Label>
                                <Input type="number" step="any" placeholder="Ej: -34.6037" className="placeholder:italic placeholder:text-slate-400" value={formData.latitud} onChange={e => setFormData({ ...formData, latitud: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Longitud</Label>
                                <Input type="number" step="any" placeholder="Ej: -58.3816" className="placeholder:italic placeholder:text-slate-400" value={formData.longitud} onChange={e => setFormData({ ...formData, longitud: e.target.value })} required />
                            </div>
                        </div>

                        {/* --- MAP PREVIEW --- */}
                        {formData.latitud && formData.longitud && (
                            <div className="space-y-2">
                                <Label>Vista Previa</Label>
                                <div className="w-full h-40 bg-slate-100 rounded border overflow-hidden relative group">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(formData.longitud) - 0.005}%2C${Number(formData.latitud) - 0.005}%2C${Number(formData.longitud) + 0.005}%2C${Number(formData.latitud) + 0.005}&layer=mapnik&marker=${formData.latitud}%2C${formData.longitud}`}
                                        className="opacity-90"
                                    ></iframe>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="default"
                                        className="absolute bottom-2 right-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={verifyOnMap}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-2" /> Verificar en Google Maps
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Radio permitido (metros)</Label>
                            <Input type="number" value={formData.radioMetros} onChange={e => setFormData({ ...formData, radioMetros: e.target.value })} required />
                            <p className="text-xs text-slate-500 mt-1">Distancia máxima desde el punto central para permitir fichar.</p>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{editingLocal ? 'Guardar Cambios' : 'Crear Local'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
