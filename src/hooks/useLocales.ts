import { useState, useCallback } from 'react'

export const useLocales = () => {
    const [loading, setLoading] = useState(false)

    const getAll = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/locales')
            const data = await res.json()
            return data.success ? data.data : []
        } catch (e) {
            console.error(e)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    const getCercanos = useCallback(async (lat: number, lng: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/locales/cercanos?lat=${lat}&lng=${lng}`)
            const data = await res.json()
            return data.success ? data.data : []
        } catch (e) {
            console.error(e)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        getAll,
        getCercanos,
        loading
    }
}
