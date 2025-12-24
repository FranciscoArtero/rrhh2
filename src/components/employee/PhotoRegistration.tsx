import { useState } from 'react';
import { FaceCapture } from './FaceCapture';
import { Button } from '@/components/ui/button';
import { Camera, Save, UserCheck } from 'lucide-react';
// import { toast } from 'sonner';

interface PhotoRegistrationProps {
    empleadoId: string;
    fotoActualUrl?: string | null;
    onRegistroExitoso: () => void;
}

export function PhotoRegistration({ empleadoId, fotoActualUrl, onRegistroExitoso }: PhotoRegistrationProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCapture = (imageSrc: string) => {
        setCapturedImage(imageSrc);
        setIsCapturing(false);
    };

    const handleSave = async () => {
        if (!capturedImage) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/empleados/${empleadoId}/foto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: capturedImage })
            });

            if (!res.ok) throw new Error("Error al guardar la foto");

            // toast.success("Foto de rostro actualizada correctamente");
            onRegistroExitoso();
            setCapturedImage(null);
        } catch (error) {
            console.error(error);
            // toast.error("Error al guardar la foto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                Registro Facial
            </h3>

            <div className="space-y-4">
                {fotoActualUrl ? (
                    <div className="flex items-center gap-4 bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-200">
                            {/* Display current photo if desired, or just an icon/message */}
                            <img src={fotoActualUrl} alt="Foto actual" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">Foto registrada</p>
                            <p className="text-xs text-green-600">Tu rostro está listo para la verificación</p>
                        </div>
                        <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                ) : (
                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-sm">
                        No tienes una foto registrada para reconocimiento facial.
                    </div>
                )}

                {isCapturing ? (
                    <div className="space-y-4">
                        <FaceCapture onCapture={handleCapture} />
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsCapturing(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                ) : capturedImage ? (
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="relative rounded-lg overflow-hidden border shadow-sm aspect-video w-full max-w-xs bg-black">
                            <img src={capturedImage} alt="Captura" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" className="flex-1" onClick={() => setCapturedImage(null)}>
                                Retomar
                            </Button>
                            <Button className="flex-1" onClick={handleSave} disabled={loading}>
                                {loading ? "Guardando..." : "Guardar Foto"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    fotoActualUrl ? (
                        <div className="p-3 text-sm text-center text-slate-500 bg-slate-50 rounded-lg">
                            Para cambiar tu foto, contactá a administración.
                        </div>
                    ) : (
                        <Button onClick={() => setIsCapturing(true)} variant="outline" className="w-full">
                            Registrar Rostro
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}
