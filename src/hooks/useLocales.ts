import { useState, useCallback } from 'react'
import { buildApiUrl } from '@/lib/url'

export const useLocales = () => {
    const [loading, setLoading] = useState(false)

    const getAll = useCallback(async () => {
        setLoading(true)
        if (typeof window === 'undefined') {
            setLoading(false)
            return []
        }
        const url = buildApiUrl('/api/locales')
        if (!url) {
            setLoading(false)
            return []
        }

        try {
            const res = await fetch(url)
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
        if (typeof window === 'undefined') {
            setLoading(false)
            return []
        }
        const url = buildApiUrl(`/api/locales/cercanos?lat=${lat}&lng=${lng}`)
        if (!url) {
            setLoading(false)
            return []
        }

        try {
            const res = await fetch(url)
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
