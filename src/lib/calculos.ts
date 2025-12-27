
import { differenceInMinutes, setHours, setMinutes, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

const HORAS_NORMALES_DIA = 6;
const HORA_INICIO_NOCTURNA = 21; // 21:00
const HORA_FIN_NOCTURNA = 6; // 06:00 (next day)

export function calcularHorasTrabajadas(entrada: Date, salida: Date): number {
    const diffMinutes = differenceInMinutes(salida, entrada);
    // Return hours with 2 decimals, ensure non-negative
    return Math.max(0, Math.round((diffMinutes / 60) * 100) / 100);
}

/**
 * Calculate if a given time range overlaps with a night period.
 * Night is 21:00 to 06:00 next day.
 * Returns minutes in night period.
 */
function getMinutosNocturnos(entrada: Date, salida: Date): number {
    let minutosNocturnos = 0;

    // Night period 1: from 21:00 of entry day to midnight
    const night1Start = setMinutes(setHours(startOfDay(entrada), HORA_INICIO_NOCTURNA), 0);
    const night1End = addDays(startOfDay(entrada), 1); // Midnight

    // Night period 2: from midnight to 06:00 of exit day
    const night2Start = startOfDay(salida);
    const night2End = setMinutes(setHours(startOfDay(salida), HORA_FIN_NOCTURNA), 0);

    // Calculate overlap with night period 1 (21:00 - 00:00 of entry day)
    const overlapStart1 = isAfter(entrada, night1Start) ? entrada : night1Start;
    const overlapEnd1 = isBefore(salida, night1End) ? salida : night1End;
    if (isAfter(overlapEnd1, overlapStart1) && isAfter(salida, night1Start)) {
        minutosNocturnos += differenceInMinutes(overlapEnd1, overlapStart1);
    }

    // Calculate overlap with night period 2 (00:00 - 06:00 of exit day)
    // Only if exit is after midnight and before 06:00
    if (isAfter(salida, night2Start) && isBefore(salida, night2End)) {
        const overlapStart2 = isAfter(entrada, night2Start) ? entrada : night2Start;
        const overlapEnd2 = isBefore(salida, night2End) ? salida : night2End;
        if (isAfter(overlapEnd2, overlapStart2)) {
            minutosNocturnos += differenceInMinutes(overlapEnd2, overlapStart2);
        }
    }

    return Math.max(0, minutosNocturnos);
}

export function calcularDetalleHoras(entrada: Date, salida: Date) {
    // 1. Calculate Total (simple difference)
    const totalMinutos = differenceInMinutes(salida, entrada);

    // Guard against negative or absurdly large values
    if (totalMinutos < 0 || totalMinutos > 24 * 60) {
        return { total: 0, normal: 0, extra: 0, nocturna: 0 };
    }

    const totalHoras = Math.round((totalMinutos / 60) * 100) / 100;

    // 2. Calculate Night minutes (21:00 - 06:00)
    const minutesNight = getMinutosNocturnos(entrada, salida);

    // 3. Day minutes = Total - Night
    const minutesDay = totalMinutos - minutesNight;

    // 4. Apply 6h rule ONLY to Day minutes
    const limitNormalMinutos = HORAS_NORMALES_DIA * 60;
    let normalMinutos = 0;
    let extraMinutos = 0;

    if (minutesDay > limitNormalMinutos) {
        normalMinutos = limitNormalMinutos;
        extraMinutos = minutesDay - limitNormalMinutos;
    } else {
        normalMinutos = Math.max(0, minutesDay);
        extraMinutos = 0;
    }

    return {
        total: totalHoras,
        normal: Math.round((normalMinutos / 60) * 100) / 100,
        extra: Math.round((extraMinutos / 60) * 100) / 100,
        nocturna: Math.round((minutesNight / 60) * 100) / 100
    };
}

export function calcularHorasNormales(entrada: Date, salida: Date): number {
    return calcularDetalleHoras(entrada, salida).normal;
}

export function calcularHorasExtra(entrada: Date, salida: Date): number {
    return calcularDetalleHoras(entrada, salida).extra;
}

export function calcularHorasExtraNocturnas(entrada: Date, salida: Date): number {
    return calcularDetalleHoras(entrada, salida).nocturna;
}

export function esDiaLaboral(fecha: Date): boolean {
    const day = fecha.getDay();
    // 0 is Sunday, 6 is Saturday
    return day !== 0 && day !== 6;
}

export function formatearHoras(decimalHours: number): string {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
}

export function downloadCSV(data: any[], headers: string[], filename: string) {
    if (!data || !data.length) return;

    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            Object.values(row).map(value =>
                typeof value === 'string' ? `"${value}"` : value
            ).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
