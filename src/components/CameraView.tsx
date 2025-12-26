import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { CameraOff } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface CameraViewProps {
    onReady?: (video: HTMLVideoElement) => void;
    width?: number;
    height?: number;
}

export interface CameraHandle {
    video: HTMLVideoElement | null;
}

const CameraView = forwardRef<CameraHandle, CameraViewProps>(({ onReady }, ref) => {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [stream, setStream] = React.useState<MediaStream | null>(null);

    useImperativeHandle(ref, () => ({
        video: videoRef.current
    }));

    useEffect(() => {
        async function setupCamera() {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    },
                    audio: false
                });

                setStream(ms);

                if (videoRef.current) {
                    videoRef.current.srcObject = ms;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        if (onReady && videoRef.current) {
                            onReady(videoRef.current);
                        }
                    };
                }
            } catch (err) {
                console.error("Camera permission denied or error:", err);
                setError(t('camera.permission_error'));
            }
        }

        setupCamera();

        return () => {
            // Cleanup stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Run once on mount

    return (
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '480px', aspectRatio: '4/3' }}>
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                    <CameraOff className="w-12 h-12 mb-2 text-red-400" />
                    <p>{error}</p>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    autoPlay
                    playsInline
                    muted
                    width={640}
                    height={480}
                />
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {t('camera.webcam_feed')}
            </div>
        </div>
    );
});

export default CameraView;
