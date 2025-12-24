import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPIN } from '@/lib/utils/pin'
import { signEmployeeToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
    dni: z.string().min(1),
    pin: z.string().length(4),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { dni, pin } = loginSchema.parse(body)

        const empleada = await prisma.empleada.findUnique({
            where: { dni },
        })

        if (!empleada || !empleada.activa) {
            return NextResponse.json(
                { success: false, error: 'Credenciales inválidas' },
                { status: 401 }
            )
        }

        if (!empleada.pin) {
            return NextResponse.json(
                { success: false, error: 'PIN no configurado' },
                { status: 401 }
            )
        }

        const isValid = await verifyPIN(pin, empleada.pin)

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Credenciales inválidas' },
                { status: 401 }
            )
        }

        // Generate JWT
        const token = await signEmployeeToken({
            id: empleada.id,
            nombre: empleada.nombre,
            role: 'EMPLOYEE'
        })

        // Set Cookie
        const cookieStore = await cookies()
        cookieStore.set('employee_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return NextResponse.json({
            success: true,
            data: {
                id: empleada.id,
                nombre: empleada.nombre,
                email: empleada.email
            }
        })

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Error en login' },
            { status: 400 }
        )
    }
}
