import { NextResponse } from 'next/server'
import { verifyEmployeeToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('employee_token')?.value

        if (!token) {
            return NextResponse.json({ success: false, error: 'No token found' }, { status: 401 })
        }

        const payload = await verifyEmployeeToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const empleada = await prisma.empleada.findUnique({
            where: { id: payload.id as string },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                fotoRegistroUrl: true,
                activa: true,
                dispositivos: {
                    where: { activo: true },
                    select: {
                        id: true,
                        nombre: true,
                        createdAt: true,
                        ultimoUso: true,
                        // Don't leak public keys or credential IDs if not needed, 
                        // but usually CredentialID is fine.
                        // For the UI listing "My Devices", we just need name/dates.
                    }
                }
            }
        })

        if (!empleada || !empleada.activa) {
            return NextResponse.json({ success: false, error: 'Employee not found or inactive' }, { status: 401 })
        }

        return NextResponse.json({ success: true, data: empleada })

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching session' }, { status: 500 })
    }
}
