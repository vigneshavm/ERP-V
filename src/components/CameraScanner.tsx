import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Aperture, Scan, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
    onCapture: (file: File) => void;
    onScan?: (code: string) => void;
    onClose: () => void;
}

type ScanMode = 'AI_IDENTIFY' | 'QR_BARCODE';

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null); // For QR scanner mounting

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<ScanMode>('AI_IDENTIFY');


    // AI Camera Logic
    useEffect(() => {
        let mediaStream: MediaStream | null = null;

        const startCamera = async () => {
            if (mode !== 'AI_IDENTIFY') return;

            try {
                // Stop any existing scanner first
                if (scannerRef.current) {
                    if (scannerRef.current.isScanning) {
                        try { await scannerRef.current.stop(); } catch (e) { console.warn("Failed to stop scanner", e); }
                    }
                    scannerRef.current.clear();
                    scannerRef.current = null;
                }

                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera Error:", err);
                setError("Unable to access camera. Please ensure permissions are granted.");
            }
        };

        if (mode === 'AI_IDENTIFY') {
            startCamera();
        }

        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mode]);

    // QR/Barcode Logic
    useEffect(() => {
        const startScanner = async () => {
            if (mode !== 'QR_BARCODE') return;

            // Stop AI camera stream if active
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            try {
                // Wait for element to be ready
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!wrapperRef.current) return;

                // Properly cleanup previous instance if it exists uniquely
                if (scannerRef.current) {
                    await scannerRef.current.stop().catch(() => { });
                    scannerRef.current.clear();
                }

                const scanner = new Html5Qrcode("reader");
                scannerRef.current = scanner;


                await scanner.start(
                    { facingMode: { exact: "environment" } }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        // Success callback
                        if (onScan) {
                            onScan(decodedText);
                            // Play beep?
                        }
                    },
                    () => {
                        // Error callback (ignore frequent errors)
                    }
                );
            } catch (err) {
                // Fallback to 'user' facing mode if environment fails (e.g. laptop)
                try {
                    const scanner = new Html5Qrcode("reader");
                    scannerRef.current = scanner;
                    await scanner.start(
                        { facingMode: "user" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => { if (onScan) onScan(decodedText); },
                        () => { }
                    );
                } catch {
                    console.error("Scanner Error:", err);
                    setError("Failed to start barcode scanner. Camera access required.");
                }
            }
        };

        if (mode === 'QR_BARCODE') {
            startScanner();
        }

        return () => {
            const cleanup = async () => {
                if (scannerRef.current) {
                    try {
                        await scannerRef.current.stop();
                        scannerRef.current.clear();
                    } catch {
                        // ignore
                    }
                }
            };
            cleanup();
        };
    }, [mode, onScan, stream]);


    const handleCapture = () => {
        if (mode === 'AI_IDENTIFY' && videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                canvasRef.current.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "captured_product.jpg", { type: "image/jpeg" });
                        onCapture(file);
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg border border-slate-700 relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 z-10 flex justify-between items-start bg-slate-900 border-b border-slate-700/50">
                    <h3 className="text-white font-bold flex items-center gap-2 drop-shadow-md">
                        <Camera className="w-5 h-5" /> {mode === 'AI_IDENTIFY' ? 'Identify Product (AI)' : 'Scan Barcode/QR'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 bg-black overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                    {error ? (
                        <div className="text-red-400 p-6 text-center">
                            {error}
                        </div>
                    ) : (
                        <>
                            {mode === 'AI_IDENTIFY' ? (
                                <div className="relative w-full h-full">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover absolute inset-0"
                                    />
                                    {/* AI Viewfinder */}
                                    <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-lg pointer-events-none">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    <div id="reader" ref={wrapperRef} className="w-full h-full"></div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Footer Controls */}
                <div className="p-6 bg-slate-900 flex flex-col gap-4">
                    {/* Mode Switcher */}
                    <div className="flex p-1 bg-slate-800 rounded-lg self-center">
                        <button
                            onClick={() => setMode('AI_IDENTIFY')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'AI_IDENTIFY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> AI Photo
                        </button>
                        <button
                            onClick={() => setMode('QR_BARCODE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'QR_BARCODE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Scan className="w-4 h-4" /> Scanner
                        </button>
                    </div>

                    {mode === 'AI_IDENTIFY' && !error && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleCapture}
                                className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 border-4 border-indigo-400/30 flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30 active:scale-95 group"
                            >
                                <Aperture className="w-8 h-8 text-white group-hover:rotate-45 transition-transform duration-300" />
                            </button>
                        </div>
                    )}

                    {mode === 'QR_BARCODE' && (
                        <div className="text-center text-slate-400 text-sm">
                            Point camera at a barcode or QR code
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
