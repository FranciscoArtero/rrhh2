"use client"

import { useFichajes } from "@/hooks/useFichajes"
import { useEmpleadaAuth } from "@/hooks/useEmpleadaAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorMessage } from "@/components/shared/ErrorMessage"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { MapPin, Camera, CheckCircle, XCircle, LogOut, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react"
import { BiometricAuth } from "@/components/employee/BiometricAuth"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const FacialVerification = dynamic(
    () => import("@/components/employee/FacialVerification").then((mod) => mod.FacialVerification),
    { ssr: false, loading: () => <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div> }
)

type Step = 'LOCATION' | 'VERIFY' | 'ACTION' | 'SUCCESS';

interface LocalInfo {
    id: string;
    nombre: string;
    distance: number;
    isWithinRadius: boolean;
}

export default function FicharPage() {
    const { marcarEntrada, marcarSalida, checkUbicacion, getHoy, loading: fichando } = useFichajes()
    const { empleada } = useEmpleadaAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    // Flow State
    const [step, setStep] = useState<Step>('LOCATION')

    // Data State
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [nearestLocal, setNearestLocal] = useState<LocalInfo | null>(null)
    const [currentStatus, setCurrentStatus] = useState<{ isClockedIn: boolean, lastPunch: any } | null>(null)
    const [verificationMethod, setVerificationMethod] = useState<'WEBAUTHN_HUELLA' | 'WEBAUTHN_FACE' | 'RECONOCIMIENTO_FACIAL' | 'NINGUNO'>('NINGUNO')

    // UI State
    const [showCamera, setShowCamera] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        // Init Check
        getHoy().then(status => {
            setCurrentStatus(status)
            setPageLoading(false)
        })
    }, [getHoy])

    const handleLocationCheck = useCallback(() => {
        setPageLoading(true)
        setError(null)

        if (!navigator.geolocation) {
            setError("Geolocalización no soportada en este dispositivo")
            setPageLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude
                const lng = pos.coords.longitude
                setCoords({ lat, lng })

                try {
                    const locales = await checkUbicacion(lat, lng)
                    if (locales && locales.length > 0) {
                        setNearestLocal(locales[0])
                        // Auto-advance if valid
                        /* 
                           Wait user confirmation or auto? 
                           User requested: "If inside local: show Check".
                        */
                    } else {
                        setNearestLocal(null)
                    }
                } catch (e) {
                    console.error(e)
                    setError("Error verificando cercanía a locales")
                } finally {
                    setPageLoading(false)
                }
            },
            (err) => {
                console.error(err)
                let msg = "No se pudo obtener ubicación."
                if (err.code === 1) msg = "Permiso de ubicación denegado. Actívalo en configuración."
                else if (err.code === 2) msg = "Ubicación no disponible."
                else if (err.code === 3) msg = "Tiempo de espera agotado."
                setError(msg)
                setPageLoading(false)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    }, [checkUbicacion])

    // Auto-check location on step mount
    useEffect(() => {
        if (mounted && step === 'LOCATION' && !coords) {
            handleLocationCheck()
        }
    }, [mounted, step, coords, handleLocationCheck])


    const handleVerificationSuccess = (method: 'WEBAUTHN_HUELLA' | 'WEBAUTHN_FACE' | 'RECONOCIMIENTO_FACIAL') => {
        setVerificationMethod(method)
        setError(null)
        setStep('ACTION')
    }

    const handleFichaje = async () => {
        if (!coords || !nearestLocal) return
        setError(null)

        const tipo = currentStatus?.isClockedIn ? 'SALIDA' : 'ENTRADA'
        const payload = {
            lat: coords.lat,
            lng: coords.lng,
            idLocal: nearestLocal.isWithinRadius ? nearestLocal.id : undefined, // Send if valid
            metodoVerificacion: verificationMethod,
        }

        try {
            if (tipo === 'ENTRADA') {
                await marcarEntrada(payload)
                setSuccessMsg(`Entrada registrada a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}`)

            } else {
                await marcarSalida(payload)
                setSuccessMsg(`Salida registrada a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}`)
            }
            setStep('SUCCESS')
            setTimeout(() => router.push('/empleado'), 3000)
        } catch (e: any) {
            setError(e.message || "Error al registrar fichaje")
        }
    }

    if (!mounted) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>

    // SUCCESS VIEW
    if (step === 'SUCCESS') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-6 animate-in zoom-in">
                <div className="bg-green-100 p-6 rounded-full">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800">¡Fichaje Exitoso!</h2>
                <p className="text-center text-gray-600 px-4">{successMsg}</p>
                <Button variant="outline" onClick={() => router.push('/empleado')}>Volver al Inicio</Button>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto pb-20 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Registrar Fichaje</h1>
                <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-500">
                    Paso {step === 'LOCATION' ? 1 : step === 'VERIFY' ? 2 : 3} de 3
                </div>
            </div>

            {/* ERROR GENERAL */}
            {error && (
                <div className="animate-in slide-in-from-top-2">
                    <ErrorMessage message={error} />
                </div>
            )}

            {/* STEP 1: UBICACIÓN */}
            {step === 'LOCATION' && (
                <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Ubicación Actual
                        </CardTitle>
                        <CardDescription>Verificando que estés en el local...</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex flex-col items-center gap-4">
                        {pageLoading ? (
                            <div className="flex flex-col items-center py-8 gap-3">
                                <LoadingSpinner className="w-8 h-8 text-primary" />
                                <span className="text-sm text-slate-500 animate-pulse">Obteniendo coordenadas GPS...</span>
                            </div>
                        ) : coords ? (
                            <>
                                {nearestLocal ? (
                                    nearestLocal.isWithinRadius ? (
                                        <div className="flex flex-col items-center gap-2 text-center p-4 bg-green-50 rounded-lg border border-green-100 w-full animate-in fade-in">
                                            <CheckCircle className="w-12 h-12 text-green-500" />
                                            <span className="font-bold text-green-800 text-lg">Estás en {nearestLocal.nombre}</span>
                                            <span className="text-xs text-green-600">Distancia: {nearestLocal.distance}m</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-center p-4 bg-red-50 rounded-lg border border-red-100 w-full animate-in fade-in">
                                            <XCircle className="w-12 h-12 text-red-500" />
                                            <span className="font-bold text-red-800 text-lg">Fuera de rango</span>
                                            <span className="text-sm text-red-600">
                                                El local más cercano es <strong>{nearestLocal.nombre}</strong> a {nearestLocal.distance}m
                                            </span>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center p-4 bg-yellow-50 rounded-lg w-full">
                                        <AlertTriangle className="w-10 h-10 text-yellow-500" />
                                        <span className="text-yellow-800 font-medium">No se encontraron locales cercanos activos.</span>
                                    </div>
                                )}

                                <div className="flex gap-3 w-full mt-2">
                                    <Button variant="outline" className="flex-1" onClick={handleLocationCheck}>
                                        <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
                                    </Button>
                                    <Button
                                        className={cn("flex-1", !nearestLocal?.isWithinRadius ? "opacity-50 cursor-not-allowed" : "bg-primary hover:bg-red-700")}
                                        disabled={!nearestLocal?.isWithinRadius}
                                        onClick={() => setStep('VERIFY')}
                                    >
                                        Continuar <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Button variant="secondary" onClick={handleLocationCheck}>
                                Reintentar Obtener GPS
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* STEP 2: VERIFICACIÓN */}
            {step === 'VERIFY' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">Verifica tu Identidad</h2>
                        <p className="text-sm text-slate-500">Elige un método para continuar</p>
                    </div>

                    {showCamera ? (
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <Button variant="ghost" className="mb-2 text-sm text-slate-500" onClick={() => setShowCamera(false)}>← Volver a opciones</Button>
                            <FacialVerification
                                onSuccess={() => handleVerificationSuccess('RECONOCIMIENTO_FACIAL')}
                                onError={(e) => setError(e)}
                                fotoReferenciaUrl={empleada?.fotoRegistroUrl}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {/* Option 1: Biometrics (if available) */}
                            {empleada?.dispositivos && empleada.dispositivos.length > 0 && (
                                <Card className="overflow-hidden cursor-pointer hover:border-red-400 transition-colors border-l-4 border-l-primary">
                                    <CardContent className="p-0">
                                        <div className="p-4">
                                            <BiometricAuth
                                                onSuccess={(res) => handleVerificationSuccess(res.metodo || 'WEBAUTHN_HUELLA')}
                                                onError={(e) => setError(e)}
                                                tieneDispositivoRegistrado={true}
                                                empleadoId={empleada.id}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Option 2: Camera (Always available) */}
                            <Button
                                variant="outline"
                                className="h-16 text-lg relative overflow-hidden group border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                                onClick={() => setShowCamera(true)}
                            >
                                <div className="absolute left-4 bg-slate-100 p-2 rounded-full group-hover:bg-white transition-colors">
                                    <Camera className="w-6 h-6 text-slate-600" />
                                </div>
                                <span className="ml-8 text-slate-700">Usar Cámara Selfie</span>
                            </Button>

                            {(!empleada?.dispositivos || empleada.dispositivos.length === 0) && (
                                <p className="text-center text-xs text-slate-400 mt-2 px-6">
                                    Tip: Registra tu huella en tu perfil para fichar más rápido.
                                </p>
                            )}
                        </div>
                    )}

                    {!showCamera && (
                        <Button variant="ghost" className="w-full mt-4 text-slate-400" onClick={() => setStep('LOCATION')}>
                            ← Volver a Ubicación
                        </Button>
                    )}
                </div>
            )}

            {/* STEP 3: ACCIÓN */}
            {step === 'ACTION' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="text-center bg-slate-50 border-b pb-4">
                            <CardTitle>Confirmar Fichaje</CardTitle>
                            <CardDescription>
                                {nearestLocal?.nombre} • {new Date().toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 pb-8 flex flex-col gap-4 items-center">

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600 mb-2">
                                {currentStatus?.isClockedIn ? "🟡 Jornada en curso" : "⚪ Jornada no iniciada"}
                            </div>

                            {currentStatus?.isClockedIn ? (
                                <Button
                                    size="lg"
                                    className="w-full h-24 text-xl flex flex-col gap-1 bg-slate-800 hover:bg-slate-900 shadow-xl shadow-slate-200"
                                    onClick={handleFichaje}
                                    disabled={fichando}
                                >
                                    {fichando ? <LoadingSpinner className="text-white" /> : <LogOut className="w-8 h-8 mb-1" />}
                                    <span>MARCAR SALIDA</span>
                                    <span className="text-xs font-normal opacity-70">Finalizar turno actual</span>
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    className="w-full h-24 text-xl flex flex-col gap-1 bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100"
                                    onClick={handleFichaje}
                                    disabled={fichando}
                                >
                                    {fichando ? <LoadingSpinner className="text-white" /> : <CheckCircle className="w-8 h-8 mb-1" />}
                                    <span>MARCAR ENTRADA</span>
                                    <span className="text-xs font-normal opacity-70">Iniciar nuevo turno</span>
                                </Button>
                            )}

                            <Button variant="ghost" onClick={() => setStep('VERIFY')} disabled={fichando} className="mt-2 text-slate-400">
                                Cancelar
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
