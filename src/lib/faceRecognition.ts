import * as faceapi from '@vladmandic/face-api';

// Configuration
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

// State
let modelsLoaded = false;

/**
 * Loads the necessary face-api models
 */
export const cargarModelos = async () => {
    if (modelsLoaded) return;

    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        // faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL) // Optional: heavier but more accurate
    ]);

    modelsLoaded = true;
    console.log("FaceAPI models loaded");
};

/**
 * Detects a face in an image (HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement)
 * Returns the detection result with descriptors
 */
export const detectarRostro = async (input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
    if (!modelsLoaded) await cargarModelos();

    // Use TinyFaceDetector for speed (adjust options if needed)
    const options = new faceapi.TinyFaceDetectorOptions();

    const detection = await faceapi.detectSingleFace(input, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        return { detectado: false, descriptor: null };
    }

    return { detectado: true, descriptor: detection.descriptor };
};

/**
 * Compares two face descriptors
 * Returns similarity data
 */
export const compararRostros = (desc1: Float32Array, desc2: Float32Array) => {
    const distance = faceapi.euclideanDistance(desc1, desc2);
    // threshold 0.6 is typical for face-api. Lower distance = higher similarity.
    // 0.6 distance ~= match. 
    // Let's use 0.5 for stricter match or 0.6 default.
    const threshold = 0.6;

    return {
        match: distance < threshold,
        similitud: 1 - distance, // Approximation (0 distance = 1 similarity)
        distancia: distance
    };
};

/**
 * Helper to convert Base64 string to HTMLImageElement
 */
export const imagenDesdeBase64 = (base64: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64;
    });
};
