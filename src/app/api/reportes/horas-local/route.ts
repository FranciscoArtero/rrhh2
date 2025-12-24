
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { calcularHorasTrabajadas, formatearHoras } from '@/lib/calculos';

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

        const records = await prisma.registroFichaje.findMany({
            where: {
                timestamp: { gte: startDate, lte: endDate },
                idLocal: { not: null } // Only records with local
            },
            include: { local: true },
            orderBy: { timestamp: 'asc' }
        });

        // Group by Local
        const localData: Record<string, {
            id: string,
            nombre: string,
            registros: typeof records,
            empleados: Set<string>
        }> = {};

        records.forEach(r => {
            if (!r.idLocal || !r.local) return;
            if (!localData[r.idLocal]) {
                localData[r.idLocal] = {
                    id: r.idLocal,
                    nombre: r.local.nombre,
                    registros: [],
                    empleados: new Set()
                };
            }
            localData[r.idLocal].registros.push(r);
            localData[r.idLocal].empleados.add(r.idEmpleada);
        });

        const report = Object.values(localData).map(loc => {
            // Pairing logic again. Note: Records here are mixed employees.
            // MUST group by employee inside the local group to pair correctly.
            let totalHoras = 0;

            const empRecs: Record<string, typeof records> = {};
            loc.registros.forEach(r => {
                if (!empRecs[r.idEmpleada]) empRecs[r.idEmpleada] = [];
                empRecs[r.idEmpleada].push(r);
            });

            Object.values(empRecs).forEach(recs => {
                for (let i = 0; i < recs.length - 1; i++) {
                    if (recs[i].tipo === 'ENTRADA' && recs[i + 1].tipo === 'SALIDA') {
                        const h = calcularHorasTrabajadas(new Date(recs[i].timestamp), new Date(recs[i + 1].timestamp));
                        if (h < 24) totalHoras += h;
                        i++;
                    }
                }
            });

            return {
                id: loc.id,
                local: loc.nombre,
                fichajes: loc.registros.length,
                totalHoras: Math.round(totalHoras * 100) / 100,
                empleadosUnicos: loc.empleados.size,
                horasFormato: formatearHoras(totalHoras)
            };
        });

        return NextResponse.json(report);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error generating report' }, { status: 500 });
    }
}
