import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyEmployeeToken } from '@/lib/auth'
import { z } from 'zod'
import { cookies } from 'next/headers'

const deviceSchema = z.object({
    deviceFingerprint: z.string().min(1),
    nombre: z.string().min(1),
    webauthnCredentialId: z.string().optional(),
})

export async function POST(req: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    const employee = token ? await verifyEmployeeToken(token) : null

    if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { deviceFingerprint, nombre, webauthnCredentialId } = deviceSchema.parse(body)

        const existing = await prisma.dispositivoAutorizado.findFirst({
            where: {
                idEmpleada: employee.id as string,
                deviceFingerprint: deviceFingerprint
            }
        })

        if (existing) {
            return NextResponse.json({ success: true, data: existing, message: 'Dispositivo ya registrado' })
        }

        const device = await prisma.dispositivoAutorizado.create({
            data: {
                idEmpleada: employee.id as string,
                deviceFingerprint,
                nombre,
                webauthnCredentialId,
                activo: true
            }
        })

        return NextResponse.json({ success: true, data: device })

    } catch {
        return NextResponse.json({ success: false, error: 'Error registering device' }, { status: 400 })
    }
}

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    const employee = token ? await verifyEmployeeToken(token) : null

    if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const devices = await prisma.dispositivoAutorizado.findMany({
            where: {
                idEmpleada: employee.id as string,
                activo: true
            }
        })

        const safeDevices = devices.map(d => ({
            ...d,
            webauthnCounter: d.webauthnCounter.toString()
        }))

        return NextResponse.json({ success: true, data: safeDevices })
    } catch {
        return NextResponse.json({ success: false, error: 'Error fetching devices' }, { status: 500 })
    }
}
