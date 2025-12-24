import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const updateLocalSchema = z.object({
    nombre: z.string().min(1).optional(),
    direccion: z.string().min(1).optional(),
    latitud: z.number().optional(),
    longitud: z.number().optional(),
    radioMetros: z.number().int().positive().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const local = await prisma.local.findUnique({
            where: { id },
        })
        if (!local) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: local })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching local' }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const body = await req.json()
        const data = updateLocalSchema.parse(body)

        const local = await prisma.local.update({
            where: { id },
            data,
        })
        return NextResponse.json({ success: true, data: local })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error updating local' }, { status: 400 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        // Soft delete
        const local = await prisma.local.update({
            where: { id },
            data: { activo: false },
        })
        return NextResponse.json({ success: true, data: local })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error deleting local' }, { status: 400 })
    }
}
