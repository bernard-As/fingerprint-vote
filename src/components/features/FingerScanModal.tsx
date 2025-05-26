import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands, type Results as HandResults, type LandmarkConnectionArray } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface FingerScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (fingerprintGuess: string) => void; // "fingerprintGuess" is a placeholder
  participantName: string; // To display who they are voting for
}

// Configuration for MediaPipe Hands
const handsConfig = {
  locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
};
const solutionOptions = {
  maxNumHands: 1,
  modelComplexity: 1 as 0 | 1,
  minDetectionConfidence: 0.6, // Adjusted for better detection
  minTrackingConfidence: 0.6,
};
// Define connections for drawing (standard hand connections)
const HAND_CONNECTIONS: LandmarkConnectionArray = [
    // Palm
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    // Thumb
    [1,5],[5,9],[9,13],[13,17],
    // Fingers (simplified, can use full MediaPipe HAND_CONNECTIONS if preferred)
    // [1,2],[2,3],[3,4], // Thumb (already part of palm)
    [5,6],[6,7],[7,8], // Index
    [9,10],[10,11],[11,12], // Middle
    [13,14],[14,15],[15,16], // Ring
    [17,18],[18,19],[19,20], // Pinky
];


const FingerScanModal: React.FC<FingerScanModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  participantName
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);

  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [isScanning, setIsScanning] = useState(false);
  const [fingerDetected, setFingerDetected] = useState(false);

  const processScan = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    setIsScanning(true);
    setStatusMessage('Scanning finger...');

    // Simulate a scan process
    // In a real scenario with actual image processing, this is where it would happen
    // For this demo, we just generate a random string as a "fingerprint guess"
    // This does NOT uniquely identify the finger or user.
    const mockFingerprintData = `finger_scan_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    setTimeout(() => {
      onScanComplete(mockFingerprintData);
      setIsScanning(false);
      setStatusMessage('Place your finger in the highlighted area.'); // Reset
    }, 2000); // Simulate 2 seconds scan
  }, [onScanComplete]);


  const onResults = useCallback((results: HandResults) => {
    if (!canvasRef.current || !videoRef.current || isScanning) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Draw video frame
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    let detected = false;
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw hand skeleton
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00A9B7', lineWidth: 3 }); // Accent Teal
        drawLandmarks(canvasCtx, landmarks, { color: '#001f3f', lineWidth: 1, radius: 3 }); // Navy Primary

        // Simple logic: Check if index finger tip (landmark 8) is roughly in the center
        const indexFingertip = landmarks[8]; // Index finger tip
        if (indexFingertip) {
          const tipX = indexFingertip.x * canvasRef.current.width;
          const tipY = indexFingertip.y * canvasRef.current.height;
          const centerX = canvasRef.current.width / 2;
          const centerY = canvasRef.current.height / 2;
          const distanceThreshold = canvasRef.current.width / 6; // Approx within central third

          if (
            Math.abs(tipX - centerX) < distanceThreshold &&
            Math.abs(tipY - centerY) < distanceThreshold
          ) {
            detected = true;
            // Draw a target or highlight around the fingertip area
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = '#32CD32'; // Lime Green for target
            canvasCtx.lineWidth = 3;
            canvasCtx.ellipse(centerX, centerY, distanceThreshold * 0.8, distanceThreshold * 1.2, 0, 0, 2 * Math.PI);
            canvasCtx.stroke();
          }
        }
      }
    }
    
    setFingerDetected(detected);
    if (!isScanning) {
        setStatusMessage(detected ? 'Finger detected! Hold steady.' : 'Place your index finger in the area.');
    }
    canvasCtx.restore();
  }, [isScanning]);


  useEffect(() => {
    if (isOpen) {
      setStatusMessage('Initializing camera...');
      setFingerDetected(false);
      setIsScanning(false);

      handsRef.current = new Hands(handsConfig);
      handsRef.current.setOptions(solutionOptions);
      handsRef.current.onResults(onResults);

      if (videoRef.current) {
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current && !isScanning) { // Only send if not actively "scanning"
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 480, // Smaller resolution for performance
          height: 360,
        });
        cameraRef.current.start()
          .then(() => setStatusMessage('Place your index finger in the area.'))
          .catch(err => {
            console.error("Camera start error:", err);
            setStatusMessage('Error: Could not access camera. Please grant permission.');
          });
      }
    } else {
      // Cleanup when modal closes
      cameraRef.current?.stop();
      handsRef.current?.close();
      cameraRef.current = null;
      handsRef.current = null;
      if (canvasRef.current) { // Clear canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    return () => { // Ensure cleanup on component unmount too
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, [isOpen, onResults, isScanning]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-85 flex items-center justify-center p-4 z-50">
      <div className="bg-almost-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative text-navy-primary bg-white">
        <button
          onClick={() => { setIsScanning(false); onClose(); }}
          className="absolute top-3 right-3 text-ui-neutral hover:text-ui-neutral-dark p-1"
          aria-label="Close"
          disabled={isScanning}
        >
          {/* ... (Close SVG icon) ... */}
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-center mb-1">Finger Scan for</h2>
        <p className="text-xl text-accent-teal font-semibold text-center mb-4">{participantName}</p>
        
        <div className="relative w-full aspect-[4/3] bg-gray-800 rounded-md overflow-hidden mb-3">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline autoPlay muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          {/* Optional: Overlay for target area guide lines */}
          {!fingerDetected && !isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2/5 h-3/5 border-2 border-dashed border-neutral-light-text border-opacity-50 rounded-md"></div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-ui-neutral-medium h-6 mb-3">{statusMessage}</p>

        <button
          onClick={processScan}
          disabled={!fingerDetected || isScanning}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold text-lg min-h-[48px]
            transition-colors duration-200
            ${(!fingerDetected || isScanning)
              ? 'bg-ui-neutral-light text-ui-neutral-medium cursor-not-allowed'
              : 'bg-accent-teal text-navy-primary hover:bg-accent-teal-dark'
            }
          `}
        >
          {isScanning ? 'Scanning...' : 'Confirm Finger & Vote'}
        </button>
      </div>
    </div>
  );
};

export default FingerScanModal;