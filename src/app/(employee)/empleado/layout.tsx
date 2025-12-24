"use client"

import { EmpleadaAuthProvider } from "@/contexts/EmpleadaAuthContext"
import EmployeeLayout from "@/components/layout/EmployeeLayout"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <EmpleadaAuthProvider>
            <EmployeeLayout>
                {children}
            </EmployeeLayout>
        </EmpleadaAuthProvider>
    )
}
