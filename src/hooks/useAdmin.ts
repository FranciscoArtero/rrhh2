import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { buildApiUrl } from '@/lib/url'

export const useAdmin = () => {
    const [loading, setLoading] = useState(false)

    // STATS
    const getEstadisticas = useCallback(async () => {
        if (typeof window === 'undefined') return null
        const url = buildApiUrl('/api/admin/stats')
        if (!url) return null

        try {
            const res = await fetch(url)
            const data = await res.json()
            return data.success ? data.data : null
        } catch {
            return null
        }
    }, [])

    // LOCALES
    const getLocales = useCallback(async () => {
        if (typeof window === 'undefined') return []
        const url = buildApiUrl('/api/locales')
        if (!url) return []

        try {
            const res = await fetch(url)
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
            const path = isEdit ? `/api/locales/${local.id}` : '/api/locales'
            const url = buildApiUrl(path)

            if (!url) {
                toast.error("Error de configuración de API")
                return false
            }

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
        const url = buildApiUrl(`/api/locales/${id}`)
        if (!url) return false
        try {
            const res = await fetch(url, { method: 'DELETE' })
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
        if (typeof window === 'undefined') return []
        const url = buildApiUrl('/api/empleadas')
        if (!url) return []

        try {
            const res = await fetch(url)
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
            const path = isEdit ? `/api/empleadas/${empleada.id}` : '/api/empleadas'
            const url = buildApiUrl(path)

            if (!url) {
                toast.error("Error de configuración")
                return null
            }

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
        const url = buildApiUrl(`/api/empleadas/${id}`)
        if (!url) return false
        try {
            const res = await fetch(url, { method: 'DELETE' })
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
        const url = buildApiUrl(`/api/empleadas/${id}/reset-pin`)
        if (!url) {
            setLoading(false)
            return null
        }
        try {
            const res = await fetch(url, { method: 'POST' })
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
        const url = buildApiUrl(`/api/empleados/${id}/foto`)
        if (!url) return false
        try {
            const res = await fetch(url, { method: 'DELETE' })
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
        if (typeof window === 'undefined') return []
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key])
            })

            const url = buildApiUrl(`/api/fichajes/admin?${params.toString()}`)
            if (!url) return []

            const res = await fetch(url)
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
