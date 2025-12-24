"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps<T> {
    columns: {
        header: string
        accessorKey?: keyof T
        cell?: (item: T) => React.ReactNode
    }[]
    data: T[]
    loading?: boolean
}

export function DataTable<T extends { id: string }>({ columns, data, loading }: DataTableProps<T>) {
    if (loading) {
        return <div className="p-4 text-center text-slate-500">Cargando datos...</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, i) => (
                            <TableHead key={i}>{col.header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length ? (
                        data.map((row) => (
                            <TableRow key={row.id}>
                                {columns.map((col, i) => (
                                    <TableCell key={i}>
                                        {col.cell
                                            ? col.cell(row)
                                            : (col.accessorKey ? String(row[col.accessorKey]) : '')
                                        }
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No hay resultados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
