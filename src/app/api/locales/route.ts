import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const localSchema = z.object({
    nombre: z.string().min(1),
    direccion: z.string().min(1),
    latitud: z.number(),
    longitud: z.number(),
    radioMetros: z.number().int().positive().default(100),
})

export async function GET(req: Request) {
    // Optional: Check admin session if strictly private
    // const session = await getServerSession(authOptions)
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const locales = await prisma.local.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        })
        return NextResponse.json({ success: true, data: locales })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching locales' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const data = localSchema.parse(body)

        const local = await prisma.local.create({
            data: {
                ...data,
                activo: true
            }
        })
        return NextResponse.json({ success: true, data: local })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error creating local' }, { status: 400 })
    }
}
