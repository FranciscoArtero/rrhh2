import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        // Parallel queries for efficiency
        const [
            activeEmployees,
            activeLocales,
            todaysPunches,
            activeSessions
        ] = await Promise.all([
            prisma.empleada.count({ where: { activa: true } }),
            prisma.local.count({ where: { activo: true } }),
            prisma.registroFichaje.count({
                where: {
                    timestamp: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                }
            }),
            // Find latest punch for each employee to see if it's an ENTRY
            // This is a bit complex in standard SQL/Prisma without raw query or iterating.
            // For simplicity/performance on small scale, we fetch today's entries and check if they have a matching exit.
            // Better approach for scale: Raw SQL or keeping 'status' on employee.
            // We will do a rough approximation here:
            prisma.registroFichaje.findMany({
                where: {
                    timestamp: { gte: todayStart },
                    tipo: 'ENTRADA'
                },
                include: {
                    empleada: true
                }
            })
        ])

        // Calculate actual active sessions (Entry without Exit)
        // For each entry today, check if there is a newer exit for that employee
        // This part is slightly expensive, optimization: just filtering valid sessions in JS for now
        // Actually, simpler logic: Get all punches today, group by employee, check last one.

        // Improved "Working Now" logic:
        const punchesToday = await prisma.registroFichaje.findMany({
            where: { timestamp: { gte: todayStart } },
            orderBy: { timestamp: 'desc' },
            include: {
                empleada: true,
                local: true
            }
        })

        const workingNow: any[] = []
        const processedEmployees = new Set()

        for (const punch of punchesToday) {
            if (!processedEmployees.has(punch.idEmpleada)) {
                processedEmployees.add(punch.idEmpleada)
                if (punch.tipo === 'ENTRADA') {
                    workingNow.push({
                        empleada: punch.empleada.nombre + ' ' + punch.empleada.apellido,
                        local: punch.local?.nombre,
                        horaEntrada: punch.timestamp
                    })
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                activeEmployees,
                activeLocales,
                todaysPunchesCount: todaysPunches,
                workingNowCount: workingNow.length,
                workingNowList: workingNow.slice(0, 5), // Send first 5 for preview
                recentPunches: punchesToday.slice(0, 10).map(p => ({
                    id: p.id,
                    empleada: `${p.empleada.nombre} ${p.empleada.apellido}`,
                    local: p.local?.nombre || 'N/A',
                    tipo: p.tipo,
                    timestamp: p.timestamp,
                    metodo: p.metodoVerificacion
                }))
            }
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: 'Error fetching stats' }, { status: 500 })
    }
}
