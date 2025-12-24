import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const photoSchema = z.object({
    fotoUrl: z.string().url(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const body = await req.json()
        const { fotoUrl } = photoSchema.parse(body)

        const employee = await prisma.empleada.update({
            where: { id },
            data: { fotoRegistroUrl: fotoUrl }
        })

        return NextResponse.json({ success: true, data: employee })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error updating photo' }, { status: 400 })
    }
}
