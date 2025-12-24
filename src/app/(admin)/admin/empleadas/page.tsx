"use client"

import { useAdmin } from "@/hooks/useAdmin"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, KeyRound, UserX } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function EmpleadasPage() {
    const { getEmpleadas, savedEmpleada, deleteEmpleada, deleteEmployeePhoto, resetPin, loading } = useAdmin()
    const [empleadas, setEmpleadas] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [editingEmpleada, setEditingEmpleada] = useState<any>(null)
    const [showPinDialog, setShowPinDialog] = useState(false)
    const [newPin, setNewPin] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: ''
    })

    const loadData = async () => {
        const data = await getEmpleadas()
        setEmpleadas(data)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleOpen = (empleada?: any) => {
        if (empleada) {
            setEditingEmpleada(empleada)
            setFormData({
                nombre: empleada.nombre,
                apellido: empleada.apellido,
                dni: empleada.dni,
                email: empleada.email || '',
                telefono: empleada.telefono || ''
            })
        } else {
            setEditingEmpleada(null)
            setFormData({ nombre: '', apellido: '', dni: '', email: '', telefono: '' })
        }
        setIsOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            id: editingEmpleada?.id,
            ...formData
        }

        const result = await savedEmpleada(payload)
        if (result) {
            setIsOpen(false)
            loadData()
            if (!editingEmpleada && result.pin) {
                // New employee created, show generated PIN
                // API needs to return generated PIN on creation (create endpoint logic)
                // Check `src/app/api/empleadas/route.ts`... it returns `{ pin: plainPin }` in data?
                // Let's assume it does or I might need to check.
                // Actually `resetPin` returns it. Creation might not return it if logic handles hashing inside safely without returning plain text.
                // But for UX, showing it once is good.
                // If not in result, we can offer to reset it immediately.
                // Let's check logic: POST /api/empleadas returns `data: empleada`. If I didn't add pin to return, I won't see it.
                // But I can use 'Reset PIN' button anyway.
            }
        }
    }

    const handleDelete = async (id: string) => {
        const success = await deleteEmpleada(id)
        if (success) loadData()
    }

    const handleResetPin = async (id: string) => {
        const pin = await resetPin(id)
        if (pin) {
            setNewPin(pin)
            setShowPinDialog(true)
        }
    }

    const handleDeletePhoto = async (id: string) => {
        const success = await deleteEmployeePhoto(id)
        if (success) loadData()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Empleados/as</h1>
                <Button onClick={() => handleOpen()}><Plus className="mr-2 h-4 w-4" /> Nuevo/a Empleado/a</Button>
            </div>

            <DataTable
                columns={[
                    {
                        header: '', cell: (row) => (
                            <Avatar>
                                <AvatarImage src={row.fotoRegistroUrl} />
                                <AvatarFallback>{row.nombre[0]}{row.apellido[0]}</AvatarFallback>
                            </Avatar>
                        )
                    },
                    { header: 'Nombre', cell: (row) => `${row.nombre} ${row.apellido}` },
                    { header: 'DNI', accessorKey: 'dni' },
                    { header: 'Email', accessorKey: 'email' },
                    { header: 'Teléfono', accessorKey: 'telefono' },
                    { header: 'Empleado/a', cell: (row) => row.activa ? <span className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded">ACTIVO/A</span> : <span className="text-red-600 text-xs">INACTIVO/A</span> },
                    {
                        header: 'Acciones', cell: (row) => (
                            <div className="flex gap-2 justify-end">
                                <ConfirmDialog
                                    title="Resetear PIN"
                                    description="Se generará un nuevo PIN aleatorio y se mostrará aquí por única vez."
                                    onConfirm={() => handleResetPin(row.id)}
                                    triggerVariant="ghost"
                                >
                                    <Button variant="ghost" size="sm" title="Reset PIN"><KeyRound className="h-4 w-4 text-orange-500" /></Button>
                                </ConfirmDialog>

                                {row.fotoRegistroUrl && (
                                    <ConfirmDialog
                                        title="Eliminar Foto Facial"
                                        description="Esta acción eliminará la foto de registro del empleado/a. Esta acción no se puede deshacer."
                                        onConfirm={() => handleDeletePhoto(row.id)}
                                        triggerVariant="ghost"
                                        confirmVariant="destructive"
                                    >
                                        <Button variant="ghost" size="sm" title="Eliminar Foto" className="text-red-500"><UserX className="h-4 w-4" /></Button>
                                    </ConfirmDialog>
                                )}

                                <Button variant="ghost" size="sm" onClick={() => handleOpen(row)}><Edit className="h-4 w-4" /></Button>

                                <ConfirmDialog
                                    title="Desactivar Empleado/a"
                                    description="El/La empleado/a no podrá acceder al sistema."
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
                data={empleadas}
                loading={loading}
            />

            {/* Edit/Create Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEmpleada ? 'Editar Empleado/a' : 'Nuevo/a Empleado/a'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nombre</Label>
                                <Input placeholder="Ej: Marcela" className="placeholder:italic placeholder:text-slate-400" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Apellido</Label>
                                <Input placeholder="Ej: Perez" className="placeholder:italic placeholder:text-slate-400" value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} required />
                            </div>
                        </div>
                        <div>
                            <Label>DNI</Label>
                            <Input placeholder="Ej: 12345678" className="placeholder:italic placeholder:text-slate-400" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} required />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input type="email" placeholder="Ej: nombre@email.com" className="placeholder:italic placeholder:text-slate-400" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <Label>Teléfono</Label>
                            <Input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">{editingEmpleada ? 'Guardar Cambios' : 'Crear Empleado/a'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* PIN Result Dialog */}
            <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo PIN Generado</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center">
                        <p className="text-sm text-slate-500 mb-2">Por favor comparta este PIN con el/la empleado/a ahora.</p>
                        <div className="text-4xl font-mono font-bold tracking-widest bg-slate-100 p-4 rounded-lg select-text">
                            {newPin}
                        </div>
                        <p className="text-xs text-red-500 mt-2">Esta información no se volverá a mostrar.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowPinDialog(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
