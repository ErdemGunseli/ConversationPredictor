import React from 'react';
import { WavyBackground } from './wavy-background';
import { Mic, Square, Brain } from 'lucide-react';
import { useGlassesMode } from '@/context/GlassesModeContext';

interface RecordingButtonProps {
  isRecording: boolean;
  onClick: () => void;
  className?: string;
  isLoading?: boolean;
  processingAI?: boolean;
  inGlassesMode?: boolean;
}

type WaveParams = {
  speed?: "slow" | "fast" | "recording";
  amplitudeFactor?: number;
  waveColors?: string[];
  waveOpacity?: number;
  waveCount?: number;
};

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onClick,
  className = '',
  isLoading = false,
  processingAI = false,
  inGlassesMode,
}) => {

  // Either use the prop (for ConversationRecorder) or get from context (for standalone use)
  const glassesModeContext = useGlassesMode();
  const isGlassesMode = inGlassesMode !== undefined ? inGlassesMode : glassesModeContext.glassesMode;

  // Enhanced wave parameters based on recording state with explicit typing
  const waveParams: WaveParams = isRecording ? {
    speed: "recording",
    amplitudeFactor: 2,
    waveColors: ["#84cc16", "#22c55e", "#10b981", "#14b8a6", "#047857"],
    waveOpacity: 0.7,
    waveCount: 3,
  } : {
    speed: "slow",
    amplitudeFactor: 1,
  };

  return (
    <div className={`relative w-full h-16 ${className}`}>
      {!isGlassesMode && (
        <WavyBackground 
          {...waveParams}
          className="absolute inset-0 overflow-hidden"
          containerClassName="w-full h-full"
        />
      )}
      
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Main recording button */}
        <button 
          onClick={onClick}
          disabled={isLoading}
          className={`z-10 h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-transform ${!isLoading && 'hover:scale-110'} ${isLoading ? 'opacity-80' : ''}`}
          style={{ padding: 0 }}
        >
          {isLoading ? (
            <div className="relative h-9 w-9">
              <div className="h-9 w-9 rounded-full border-[3px] border-gray-300 dark:border-gray-600 border-t-primary dark:border-t-primary animate-spin" />
              {processingAI && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                </div>
              )}
            </div>
          ) : isRecording ? (
            <Square className="h-7 w-7 text-black dark:text-white drop-shadow-md" />
          ) : (
            <Mic className="h-7 w-7 text-black dark:text-white drop-shadow-md" />
          )}
        </button>
      </div>
    </div>
  );
};
