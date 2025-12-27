
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { calcularDetalleHoras, formatearHoras } from '@/lib/calculos';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('fechaDesde');
    const hasta = searchParams.get('fechaHasta');

    if (!desde || !hasta) {
        return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 });
    }

    try {
        const startDate = startOfDay(new Date(desde));
        const endDate = endOfDay(new Date(hasta));

        // Get all punches in range
        const records = await prisma.registroFichaje.findMany({
            where: {
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { empleada: true },
            orderBy: { timestamp: 'asc' }
        });

        // Group by Employee
        const empData: Record<string, {
            id: string,
            nombre: string,
            registros: typeof records,
            diasTrabajados: Set<string>
        }> = {};

        records.forEach(r => {
            if (!empData[r.idEmpleada]) {
                empData[r.idEmpleada] = {
                    id: r.idEmpleada,
                    nombre: `${r.empleada.nombre} ${r.empleada.apellido}`,
                    registros: [],
                    diasTrabajados: new Set()
                };
            }
            empData[r.idEmpleada].registros.push(r);
            empData[r.idEmpleada].diasTrabajados.add(new Date(r.timestamp).toDateString());
        });

        // Calculate stats per employee
        const report = Object.values(empData).map(emp => {
            const recs = emp.registros;
            const dias = emp.diasTrabajados.size;

            let totalHorasDailySum = 0;
            let totalNormal = 0;
            let totalExtras = 0;
            let totalNocturnas = 0;

            // Process all records sequentially (not grouped by day)
            // This correctly handles shifts that cross midnight
            for (let i = 0; i < recs.length; i++) {
                if (recs[i].tipo === 'ENTRADA') {
                    // Find the next SALIDA
                    let j = i + 1;
                    while (j < recs.length && recs[j].tipo !== 'SALIDA') j++;

                    if (j < recs.length && recs[j].tipo === 'SALIDA') {
                        const entryTime = new Date(recs[i].timestamp);
                        const exitTime = new Date(recs[j].timestamp);

                        const detalle = calcularDetalleHoras(entryTime, exitTime);

                        // Only add if reasonable (< 24 hours)
                        if (detalle.total > 0 && detalle.total < 24) {
                            totalHorasDailySum += detalle.total;
                            totalNormal += detalle.normal;
                            totalExtras += detalle.extra;
                            totalNocturnas += detalle.nocturna;
                        }

                        // Skip to after the exit
                        i = j;
                    }
                }
            }

            return {
                id: emp.id,
                nombre: emp.nombre,
                diasTrabajados: dias,
                horasNormales: Math.round(totalNormal * 100) / 100,
                horasExtra: Math.round(totalExtras * 100) / 100,
                horasNocturnas: Math.round(totalNocturnas * 100) / 100,
                horasTotales: Math.round(totalHorasDailySum * 100) / 100,
                horasFormato: formatearHoras(totalHorasDailySum)
            };
        });

        console.log('Report Data:', JSON.stringify(report, null, 2));
        return NextResponse.json(report);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error generating report' }, { status: 500 });
    }
}
