import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getBaseUrl } from '@/lib/config'

export const useAdmin = () => {
    const [loading, setLoading] = useState(false)

    // STATS
    const getEstadisticas = useCallback(async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/admin/stats`)
            const data = await res.json()
            return data.success ? data.data : null
        } catch {
            return null
        }
    }, [])

    // LOCALES
    const getLocales = useCallback(async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/locales`)
            const data = await res.json()
            return data.success ? data.data : []
        } catch {
            return []
        }
    }, [])

    const savedLocal = async (local: any) => {
        setLoading(true)
        try {
            const isEdit = !!local.id
            const method = isEdit ? 'PUT' : 'POST'
            const url = isEdit ? `${getBaseUrl()}/api/locales/${local.id}` : `${getBaseUrl()}/api/locales`

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(local)
            })
            const data = await res.json()

            if (data.success) {
                toast.success(`Local ${isEdit ? 'actualizado' : 'creado'} correctamente`)
                return true
            } else {
                toast.error("Error al guardar local")
                return false
            }
        } catch {
            toast.error("Error inesperado")
            return false
        } finally {
            setLoading(false)
        }
    }

    const deleteLocal = async (id: string) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/locales/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Local eliminado")
                return true
            }
            return false
        } catch {
            return false
        }
    }

    // EMPLEADAS
    const getEmpleadas = useCallback(async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/empleadas`)
            const data = await res.json()
            return data.success ? data.data : []
        } catch {
            return []
        }
    }, [])

    const savedEmpleada = async (empleada: any) => {
        setLoading(true)
        try {
            const isEdit = !!empleada.id
            const method = isEdit ? 'PUT' : 'POST'
            const url = isEdit ? `${getBaseUrl()}/api/empleadas/${empleada.id}` : `${getBaseUrl()}/api/empleadas`

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empleada)
            })
            const data = await res.json()

            if (data.success) {
                toast.success(`Empleada ${isEdit ? 'actualizada' : 'creada'} correctamente`)
                return data.data
            } else {
                toast.error("Error al guardar empleada")
                return null
            }
        } catch {
            toast.error("Error inesperado")
            return null
        } finally {
            setLoading(false)
        }
    }

    const deleteEmpleada = async (id: string) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/empleadas/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Empleada desactivada")
                return true
            }
            return false
        } catch {
            return false
        }
    }

    const resetPin = async (id: string) => {
        setLoading(true)
        try {
            const res = await fetch(`${getBaseUrl()}/api/empleadas/${id}/reset-pin`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                toast.success("PIN reseteado exitosamente")
                return data.data.newPin
            } else {
                toast.error("Error al resetear PIN")
                return null
            }
        } catch {
            toast.error("Error inesperado")
            return null
        } finally {
            setLoading(false)
        }
    }

    const deleteEmployeePhoto = async (id: string) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/empleados/${id}/foto`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                toast.success("Foto eliminada correctamente")
                return true
            } else {
                toast.error("Error al eliminar foto")
                return false
            }
        } catch {
            return false
        }
    }

    // FICHAJES
    const getFichajes = useCallback(async (filters: any) => {
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key])
            })

            const res = await fetch(`${getBaseUrl()}/api/fichajes/admin?${params.toString()}`)
            const data = await res.json()
            return data.success ? data.data : []
        } catch {
            return []
        }
    }, [])

    return {
        loading,
        getEstadisticas,
        getLocales,
        savedLocal,
        deleteLocal,
        getEmpleadas,
        savedEmpleada,
        deleteEmpleada,
        deleteEmployeePhoto,
        resetPin,
        getFichajes
    }
}
