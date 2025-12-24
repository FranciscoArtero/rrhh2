import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyEmployeeToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    const employee = token ? await verifyEmployeeToken(token) : null

    if (!employee) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const limit = searchParams.get('limit')

    try {
        const where: any = {
            idEmpleada: employee.id as string
        }

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1)
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)
            where.timestamp = {
                gte: startDate,
                lte: endDate
            }
        }

        const fichajes = await prisma.registroFichaje.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit ? Number(limit) : undefined,
            include: {
                local: { select: { nombre: true } }
            }
        })

        return NextResponse.json({ success: true, data: fichajes })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching history' }, { status: 500 })
    }
}
