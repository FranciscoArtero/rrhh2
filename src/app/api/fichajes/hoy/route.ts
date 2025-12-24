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

    try {
        const lastPunch = await prisma.registroFichaje.findFirst({
            where: { idEmpleada: employee.id as string },
            orderBy: { timestamp: 'desc' },
            include: { local: true }
        })

        return NextResponse.json({
            success: true,
            data: {
                lastPunch,
                isClockedIn: lastPunch?.tipo === 'ENTRADA'
            }
        })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching status' }, { status: 500 })
    }
}
