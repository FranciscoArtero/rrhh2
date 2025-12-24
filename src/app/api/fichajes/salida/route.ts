import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyEmployeeToken } from '@/lib/auth'
import { z } from 'zod'
import { isWithinRadius } from '@/lib/geolocation'
import { cookies } from 'next/headers'

const exitSchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    metodoVerificacion: z.enum(['WEBAUTHN_HUELLA', 'WEBAUTHN_FACE', 'RECONOCIMIENTO_FACIAL', 'PIN_EMERGENCIA']),
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
        const { lat, lng, metodoVerificacion } = exitSchema.parse(body)

        const lastRecord = await prisma.registroFichaje.findFirst({
            where: { idEmpleada: employee.id as string },
            orderBy: { timestamp: 'desc' }
        })

        if (!lastRecord || lastRecord.tipo === 'SALIDA') {
            return NextResponse.json({ success: false, error: 'No tienes una entrada activa para registrar salida' }, { status: 400 })
        }

        const locales = await prisma.local.findMany({ where: { activo: true } })
        const nearbyLocal = locales.find(l =>
            isWithinRadius(
                { lat, lng },
                { lat: Number(l.latitud), lng: Number(l.longitud) },
                l.radioMetros
            )
        )

        const fichaje = await prisma.registroFichaje.create({
            data: {
                idEmpleada: employee.id as string,
                idLocal: nearbyLocal?.id,
                tipo: 'SALIDA',
                latitud: lat,
                longitud: lng,
                metodoVerificacion,
                timestamp: new Date()
            }
        })

        return NextResponse.json({ success: true, data: fichaje })

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error processing exit' }, { status: 400 })
    }
}
