"use client"

import { useState, useEffect } from 'react';
import { FaceCapture } from './FaceCapture';
import { imagenDesdeBase64, detectarRostro, compararRostros } from '@/lib/faceRecognition';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FacialVerificationProps {
    onSuccess: () => void;
    onError: (error: string) => void;
    fotoReferenciaUrl?: string | null; // URL or Base64 of stored user photo
}

export function FacialVerification({ onSuccess, onError, fotoReferenciaUrl }: FacialVerificationProps) {
    const [step, setStep] = useState<'CAPTURE' | 'COMPARING' | 'SUCCESS' | 'ERROR'>('CAPTURE');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleCapture = async (imageSrc: string, liveDescriptor?: Float32Array) => {
        if (!fotoReferenciaUrl) {
            setErrorMsg("No hay foto de referencia registrada. Por favor contacta a RRHH.");
            setStep('ERROR');
            return;
        }

        if (!liveDescriptor) {
            setErrorMsg("No se pudo detectar el rostro claramente. Intenta de nuevo.");
            setStep('ERROR');
            return;
        }

        setStep('COMPARING');
        setErrorMsg(null);

        try {
            // 1. Process Reference Image
            // In a real app, you might want to cache the descriptor of the reference image 
            // once when the component mounts or even store it in DB.
            const imgRef = await imagenDesdeBase64(fotoReferenciaUrl); // Works if Url is base64 or CORS enabled URL
            const refResult = await detectarRostro(imgRef);

            if (!refResult.detectado || !refResult.descriptor) {
                // Warning: This means the stored photo is bad.
                throw new Error("La foto de referencia no contiene un rostro válido.");
            }

            // 2. Compare
            const comparison = compararRostros(refResult.descriptor, liveDescriptor);

            console.log("Face Comparison Result:", comparison);

            if (comparison.match) {
                setStep('SUCCESS');
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                throw new Error(`Rostro no coincide. Similitud: ${Math.round(comparison.similitud * 100)}%`);
            }

        } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMsg(err.message || "Error al verificar la identidad.");
            setStep('ERROR');
            onError(err.message || "Error al verificar la identidad.");
        }
    };

    const reset = () => {
        setStep('CAPTURE');
        setErrorMsg(null);
    };

    if (step === 'COMPARING') {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-gray-600">Verificando identidad...</p>
            </div>
        );
    }

    if (step === 'SUCCESS') {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-in fade-in zoom-in">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-lg font-medium text-green-700">¡Identidad Verificada!</p>
            </div>
        );
    }

    if (step === 'ERROR') {
        return (
            <div className="space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error de Verificación</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
                <Button onClick={reset} className="w-full">
                    Intentar de nuevo
                </Button>
            </div>
        );
    }

    // Capture Step
    return (
        <div className="space-y-4">
            <h3 className="text-center text-sm font-medium text-gray-500">
                Asegura que tu rostro esté bien iluminado
            </h3>
            <FaceCapture onCapture={handleCapture} />
        </div>
    );
}
