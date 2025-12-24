import { useState } from 'react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Fingerprint, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DeviceRegistrationProps {
    onRegistroExitoso: (dispositivo: any) => void;
    empleadoId: string;
}

export function DeviceRegistration({ onRegistroExitoso, empleadoId }: DeviceRegistrationProps) {
    const { soportado, registrarDispositivo, loading, error } = useWebAuthn();
    const [nombreDevice, setNombreDevice] = useState('');
    const [success, setSuccess] = useState(false);

    if (!soportado) {
        return (
            <Alert variant="destructive">
                <AlertTitle>No soportado</AlertTitle>
                <AlertDescription>
                    Este dispositivo no soporta WebAuthn o no tiene sensores biométricos configurados.
                </AlertDescription>
            </Alert>
        );
    }

    const handleRegister = async () => {
        if (!nombreDevice.trim() || !empleadoId) return;

        try {
            await registrarDispositivo(nombreDevice, empleadoId);
            setSuccess(true);
            setNombreDevice('');
            onRegistroExitoso({}); // Trigger refresh in parent
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            // Error handled by hook state
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-indigo-600" />
                Registrar Nuevo Dispositivo
            </h3>

            {success ? (
                <div className="flex flex-col items-center justify-center py-4 text-green-600 animate-in fade-in">
                    <CheckCircle2 className="w-12 h-12 mb-2" />
                    <p className="font-medium">¡Dispositivo Registrado!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <Input
                            placeholder="Nombre del dispositivo (ej: iPhone de Ana)"
                            value={nombreDevice}
                            onChange={(e) => setNombreDevice(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <Button
                        onClick={handleRegister}
                        disabled={loading || !nombreDevice.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            'Registrar Huella / Face ID'
                        )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                        Se te pedirá autenticación biométrica del dispositivo actual.
                    </p>
                </div>
            )}
        </div>
    );
}
