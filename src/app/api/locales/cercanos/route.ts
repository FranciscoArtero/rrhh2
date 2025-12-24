import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isWithinRadius, calculateDistance } from '@/lib/geolocation'
import { z } from 'zod'

const searchSchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
})

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    try {
        const { lat: userLat, lng: userLng } = searchSchema.parse({ lat, lng })

        const allLocales = await prisma.local.findMany({
            where: { activo: true },
        })

        // Calculate distance for all and sort
        const localesWithDistance = allLocales.map(local => {
            const distance = calculateDistance(
                userLat, userLng,
                Number(local.latitud), Number(local.longitud)
            );
            return {
                ...local,
                distance: Math.round(distance), // in meters
                isWithinRadius: distance <= local.radioMetros
            };
        }).sort((a, b) => a.distance - b.distance);

        return NextResponse.json({
            success: true,
            data: localesWithDistance
        })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 })
    }
}
