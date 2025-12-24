
import Image from "next/image"

interface PublicLayoutProps {
    children: React.ReactNode
    title?: string
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    {/* Logo */}
                    <div className="relative w-24 h-24 mb-4">
                        <Image src="/logo.png" alt="La Vene" fill className="object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {title || 'Bienvenido'}
                    </h2>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
