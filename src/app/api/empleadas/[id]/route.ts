import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const updateEmployeeSchema = z.object({
    nombre: z.string().min(1).optional(),
    apellido: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefono: z.string().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const employee = await prisma.empleada.findUnique({
            where: { id },
        })
        if (!employee) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: employee })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching employee' }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const body = await req.json()
        const data = updateEmployeeSchema.parse(body)

        const employee = await prisma.empleada.update({
            where: { id },
            data,
        })
        return NextResponse.json({ success: true, data: employee })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error updating employee' }, { status: 400 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const employee = await prisma.empleada.update({
            where: { id },
            data: { activa: false },
        })
        return NextResponse.json({ success: true, data: employee })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error deleting employee' }, { status: 400 })
    }
}
