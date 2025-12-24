import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyEmployeeToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    const employee = token ? await verifyEmployeeToken(token) : null

    if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const device = await prisma.dispositivoAutorizado.findUnique({
            where: { id }
        })

        if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        if (device.idEmpleada !== employee.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.dispositivoAutorizado.update({
            where: { id },
            data: { activo: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error deleting device' }, { status: 500 })
    }
}
