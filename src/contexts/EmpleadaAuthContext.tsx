"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Empleada {
    id: string
    nombre: string
    apellido: string
    email: string
    fotoRegistroUrl?: string | null
    dispositivos?: any[]
}

interface EmpleadaContextType {
    empleada: Empleada | null
    loading: boolean
    logout: () => Promise<void>
    refresh: () => Promise<void>
}

const EmpleadaAuthContext = createContext<EmpleadaContextType>({
    empleada: null,
    loading: true,
    logout: async () => { },
    refresh: async () => { }
})

export function EmpleadaAuthProvider({ children }: { children: React.ReactNode }) {
    const [empleada, setEmpleada] = useState<Empleada | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const checkSession = async () => {
        try {
            const res = await fetch('/api/auth/employee/me')
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setEmpleada(data.data)
                } else {
                    setEmpleada(null)
                }
            } else {
                setEmpleada(null)
            }
        } catch (e) {
            setEmpleada(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkSession()
    }, [])

    const logout = async () => {
        try {
            await fetch('/api/auth/employee/logout', { method: 'POST' })
            setEmpleada(null)
            router.push('/login')
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <EmpleadaAuthContext.Provider value={{ empleada, loading, logout, refresh: checkSession }}>
            {children}
        </EmpleadaAuthContext.Provider>
    )
}

export function useEmpleadaAuth() {
    return useContext(EmpleadaAuthContext)
}
