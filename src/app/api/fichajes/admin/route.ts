import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const idEmpleada = searchParams.get('idEmpleada')
    const idLocal = searchParams.get('idLocal')
    const dateStr = searchParams.get('date') // YYYY-MM-DD

    try {
        const where: any = {}
        if (idEmpleada) where.idEmpleada = idEmpleada
        if (idLocal) where.idLocal = idLocal

        // Filter by date (approximate for day)
        if (dateStr) {
            const start = new Date(dateStr)
            start.setHours(0, 0, 0, 0)
            const end = new Date(dateStr)
            end.setHours(23, 59, 59, 999)
            where.timestamp = {
                gte: start,
                lte: end
            }
        }

        const fichajes = await prisma.registroFichaje.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            include: {
                empleada: { select: { nombre: true, apellido: true } },
                local: { select: { nombre: true } }
            },
            take: 100 // Limit for safety
        })

        return NextResponse.json({ success: true, data: fichajes })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching punches' }, { status: 500 })
    }
}
