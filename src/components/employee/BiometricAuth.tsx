import { useState } from 'react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint, ScanFace } from 'lucide-react';

interface BiometricAuthProps {
    onSuccess: (result: any) => void;
    onError: (error: string) => void;
    tieneDispositivoRegistrado: boolean;
    empleadoId: string;
}

export function BiometricAuth({ onSuccess, onError, tieneDispositivoRegistrado, empleadoId }: BiometricAuthProps) {
    const { soportado, autenticar, loading, error } = useWebAuthn();

    if (!soportado) {
        return (
            <div className="text-sm text-gray-500 text-center p-2 bg-gray-50 rounded-lg">
                <p>Tu dispositivo no soporta o no tiene configurado acceso biométrico.</p>
                <p className="text-xs mt-1">Usa la opción de Reconocimiento Facial estándar.</p>
            </div>
        );
    }

    if (!tieneDispositivoRegistrado) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-amber-700 text-sm mb-2">
                    Para agilizar tu fichaje, registra tu huella o rostro en tu Perfil.
                </p>
                {/* Optional link to profile if needed, usually handled by parent page nav */}
            </div>
        );
    }

    const handleVerification = async () => {
        if (!empleadoId) return;
        try {
            const result = await autenticar(empleadoId);
            onSuccess(result);
        } catch (err: any) {
            onError(err.message);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded text-center">
                    {error}
                </div>
            )}

            <Button
                onClick={handleVerification}
                disabled={loading}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        <span>Verificando...</span>
                    </>
                ) : (
                    <>
                        <Fingerprint className="mr-2 h-6 w-6" />
                        <span>Verificar con Huella / Face ID</span>
                    </>
                )}
            </Button>
            <p className="text-xs text-gray-400 text-center">
                Asegurada por WebAuthn
            </p>
        </div>
    );
}
