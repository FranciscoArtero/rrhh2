import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getBaseUrl } from '@/lib/config'


export const useFichajes = () => {
    const [loading, setLoading] = useState(false)

    const getHoy = useCallback(async () => {
        if (typeof window === 'undefined') return null
        try {
            const res = await fetch(`${getBaseUrl()}/api/fichajes/hoy`)
            if (!res.ok) throw new Error('Error')
            const data = await res.json()
            return data.data
        } catch (e) {
            console.error(e)
            return null
        }
    }, [])

    const getHistorial = useCallback(async (month?: number, year?: number) => {
        if (typeof window === 'undefined') return []
        try {
            const params = new URLSearchParams()
            if (month) params.append('month', month.toString())
            if (year) params.append('year', year.toString())

            const res = await fetch(`${getBaseUrl()}/api/fichajes/mi-historial?${params.toString()}`)
            if (!res.ok) throw new Error('Error fetching history')
            const data = await res.json()
            return data.data
        } catch (e) {
            console.error(e)
            return []
        }
    }, [])

    const checkUbicacion = useCallback(async (lat: number, lng: number) => {
        if (typeof window === 'undefined') return []
        try {
            const res = await fetch(`${getBaseUrl()}/api/locales/cercanos?lat=${lat}&lng=${lng}`)
            if (!res.ok) throw new Error('Error checking location')
            const data = await res.json()
            return data.data // Returns sorted list with distance and isWithinRadius
        } catch (e) {
            console.error(e)
            return []
        }
    }, [])

    const marcarEntrada = async (payload: any) => {
        setLoading(true)
        try {
            const res = await fetch(`${getBaseUrl()}/api/fichajes/entrada`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Entrada registrada con éxito")
                return data.data
            } else {
                toast.error(data.error || "Error al marcar entrada")
                throw new Error(data.error)
            }
        } catch (e) {
            throw e
        } finally {
            setLoading(false)
        }
    }

    const marcarSalida = async (payload: any) => {
        setLoading(true)
        try {
            const res = await fetch(`${getBaseUrl()}/api/fichajes/salida`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Salida registrada con éxito")
                return data.data
            } else {
                toast.error(data.error || "Error al marcar salida")
                throw new Error(data.error)
            }
        } catch (e) {
            throw e
        } finally {
            setLoading(false)
        }
    }

    return {
        getHoy,
        getHistorial,
        checkUbicacion,
        marcarEntrada,
        marcarSalida,
        loading
    }
}
