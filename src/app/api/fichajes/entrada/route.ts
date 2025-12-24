import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyEmployeeToken } from '@/lib/auth'
import { z } from 'zod'
import { isWithinRadius, calculateDistance } from '@/lib/geolocation'
import { cookies } from 'next/headers'

const entrySchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    idLocal: z.string().optional(),
    metodoVerificacion: z.enum(['WEBAUTHN_HUELLA', 'WEBAUTHN_FACE', 'RECONOCIMIENTO_FACIAL', 'PIN_EMERGENCIA']),
    fotoVerificacionUrl: z.string().optional().nullable(),
})

export async function POST(req: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    const employee = token ? await verifyEmployeeToken(token) : null

    if (!employee) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { lat, lng, metodoVerificacion, fotoVerificacionUrl } = entrySchema.parse(body)

        const locales = await prisma.local.findMany({ where: { activo: true } })

        // Find nearest local and check radius
        let nearbyLocal = null
        let minDistance = Infinity
        let closestLocal = null

        for (const local of locales) {
            const dist = calculateDistance(
                lat, lng,
                Number(local.latitud), Number(local.longitud)
            )

            if (dist < minDistance) {
                minDistance = dist
                closestLocal = local
            }

            if (dist <= local.radioMetros) {
                nearbyLocal = local
                break // Found one, valid
            }
        }

        if (!nearbyLocal) {
            const errorMsg = closestLocal
                ? `Estás fuera de radio. Local más cercano: ${closestLocal.nombre} a ${Math.round(minDistance)} metros.`
                : 'No hay locales cercanos disponibles.'

            return NextResponse.json({
                success: false,
                error: errorMsg,
                debug: {
                    userLat: lat,
                    userLng: lng,
                    closestLocal: closestLocal?.nombre,
                    distance: Math.round(minDistance)
                }
            }, { status: 400 })
        }

        const lastRecord = await prisma.registroFichaje.findFirst({
            where: { idEmpleada: employee.id as string },
            orderBy: { timestamp: 'desc' }
        })

        if (lastRecord && lastRecord.tipo === 'ENTRADA') {
            return NextResponse.json({ success: false, error: 'Ya tienes una entrada registrada sin salida' }, { status: 400 })
        }

        const fichaje = await prisma.registroFichaje.create({
            data: {
                idEmpleada: employee.id as string,
                idLocal: nearbyLocal.id,
                tipo: 'ENTRADA',
                latitud: lat,
                longitud: lng,
                metodoVerificacion,
                fotoVerificacionUrl: fotoVerificacionUrl || null,
                timestamp: new Date()
            }
        })

        return NextResponse.json({ success: true, data: fichaje })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: 'Error processing entry' }, { status: 400 })
    }
}
