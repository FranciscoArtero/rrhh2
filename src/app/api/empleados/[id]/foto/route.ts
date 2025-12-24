import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Rol } from '@prisma/client'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { foto } = await req.json()
        const { id } = await params

        if (!foto) {
            return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
        }

        // Validate permissions (Optional: check if admin or self)
        // For now open or protected by middleware session if integrated.
        // Assuming session check should be here ideally.

        await prisma.empleada.update({
            where: { id },
            data: { fotoRegistroUrl: foto }
        })

        return NextResponse.json({ success: true, url: foto })
    } catch (error) {
        console.error('Error updating photo:', error)
        return NextResponse.json({ error: 'Error inteno del servidor' }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.empleada.update({
            where: { id },
            data: { fotoRegistroUrl: null }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting photo:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
