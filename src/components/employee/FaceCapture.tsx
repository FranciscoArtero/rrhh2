"use client"

import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { Button } from '@/components/ui/button';
import { cargarModelos, detectarRostro } from '@/lib/faceRecognition';
import { cn } from '@/lib/utils';
// import { toast } from 'sonner'; // Optional: for feedback

interface FaceCaptureProps {
    onCapture: (imageSrc: string, descriptor?: Float32Array) => void;
    autoCapture?: boolean;
}

export function FaceCapture({ onCapture, autoCapture = false }: FaceCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loadingModels, setLoadingModels] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);

    // Load models
    useEffect(() => {
        const init = async () => {
            try {
                await cargarModelos();
                setLoadingModels(false);
            } catch (error) {
                console.error("Error loading models", error);
                // toast.error("Error cargando modelos de reconocimiento facial");
            }
        };
        init();
    }, []);

    // Start Camera
    useEffect(() => {
        if (loadingModels) return;

        let stream: MediaStream | null = null;
        const startVideo = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setCameraReady(true);
                }
            } catch (err: any) {
                console.error("Error accessing camera", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    // toast.error("Permiso de cámara denegado. Revise configuración.");
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    // toast.error("No se encontró cámara.");
                } else {
                    // toast.error("Error accediendo a la cámara");
                }
            }
        };

        startVideo();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [loadingModels]);

    // Detection Loop
    useEffect(() => {
        if (!cameraReady || !videoRef.current || !canvasRef.current) return;

        let interval: NodeJS.Timeout;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const detect = async () => {
            if (video.paused || video.ended) return;

            setDetecting(true);
            const result = await detectarRostro(video);

            // Draw box
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            if (result.detectado && result.descriptor) {
                setFaceDetected(true);

                // Visual feedback (box) implementation if needed
                // For now, simpler UI feedback is enough (button enabled)
            } else {
                setFaceDetected(false);
            }
            setDetecting(false);
        };

        interval = setInterval(detect, 1000); // Check every second to safe performance

        return () => clearInterval(interval);
    }, [cameraReady]);

    const capture = async () => {
        if (!videoRef.current || !faceDetected) return;

        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);

        const imageSrc = canvas.toDataURL("image/jpeg");

        // Get fresh descriptor for exact moment
        const result = await detectarRostro(video); // Or use the one from loop if cached/fast enough

        onCapture(imageSrc, result.descriptor || undefined);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-black w-full max-w-sm aspect-video">
                {loadingModels && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50 z-10">
                        <span>Cargando IA...</span>
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={() => {
                        if (canvasRef.current && videoRef.current) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                        }
                    }}
                    className={cn("w-full h-full object-cover", (!cameraReady || loadingModels) && "opacity-0")}
                />

                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                />

                {!faceDetected && cameraReady && !loadingModels && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/40 py-1">
                        <span>Posiciona tu rostro en el centro</span>
                    </div>
                )}
            </div>

            <Button
                onClick={capture}
                className="w-full max-w-sm"
                disabled={!faceDetected || loadingModels}
                variant={faceDetected ? "default" : "secondary"}
            >
                <Camera className="mr-2 h-4 w-4" />
                {faceDetected ? "Capturar Foto" : "Buscando rostro..."}
            </Button>
        </div>
    );
}
