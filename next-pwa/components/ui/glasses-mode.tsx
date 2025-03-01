"use client";
import React from 'react';
import { useGlassesMode } from '@/context/GlassesModeContext';
import { Glasses, Mic, Square, LightbulbIcon } from 'lucide-react';

interface GlassesModeProps {
  transcriptSegments: any[];
  partialTranscript: string;
  isRecording: boolean;
  isLoading: boolean;
  toggleRecording: () => void;
  toggleGlassesMode: () => void;
  getSpeakerColor: (speaker: string) => string;
  getSpeakerName: (speaker: string) => string;
  getSpeakerBgColor: (speaker: string) => string;
  prediction: string;
  isPredicting: boolean;
  predictionError: string | null;
}

export const GlassesMode: React.FC<GlassesModeProps> = ({
  transcriptSegments,
  partialTranscript,
  isRecording,
  isLoading,
  toggleRecording,
  toggleGlassesMode,
  getSpeakerColor,
  getSpeakerName,
  getSpeakerBgColor,
  prediction,
  isPredicting,
  predictionError
}) => {
  // Get the last 2 segments
  const getGlassesSegments = () => {
    const segments = [...transcriptSegments];
    return segments.slice(-2);
  };
  
  // Create the portal element if it doesn't exist
  React.useEffect(() => {
    // Apply styles to body to prevent scrolling
    document.body.style.overflow = 'hidden';
    
    // Remove styles when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black z-[99999] flex flex-col" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999 
      }}
    >
      {/* Empty spacer at the top */}
      <div className="flex-grow"></div>

      {/* Last 2 segments above the prediction component */}
      <div className="z-10 px-4 pr-20 w-full">
        {getGlassesSegments().map((segment) => (
          <div key={segment.id} className="mb-4 max-w-full">
            <div className={`text-xs font-medium mb-1 ${getSpeakerColor(segment.speaker)}`}>
              {getSpeakerName(segment.speaker)}
            </div>
            <div className="flex">
              <div 
                className={`w-1 flex-shrink-0 mr-1.5 ${getSpeakerBgColor(segment.speaker)}`}
                style={{ 
                  borderRadius: '4px',
                  alignSelf: 'stretch'
                }}
              ></div>
              <div className="flex flex-col w-full">
                <span className="text-white text-lg break-words">{segment.text}</span>
                {segment.translations && segment.translations.length > 0 && (
                  <span className="text-sm italic mt-1 text-gray-400 break-words">
                    {segment.translations[segment.translations.length - 1]}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {partialTranscript && (
          <div className="text-gray-400 italic p-1 text-lg break-words mb-2">
            {partialTranscript}
          </div>
        )}
      </div>

      {/* AI Prediction component at the bottom */}
      <div className="z-10 px-4 pr-20 pb-12 mt-2">
        <div className="rounded-lg p-3 bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-start">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1 flex items-center gap-2">
                <LightbulbIcon className={`h-4 w-4 ${isPredicting ? 'animate-pulse' : ''} text-[#818cf8]`} />
                <span className="!text-transparent !dark:text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#c084fc]">
                  AI Prediction
                </span>
              </div>
              <div className={`text-sm text-white/90 ${isPredicting ? 'animate-pulse' : ''}`}>
                {prediction || (isPredicting ? 'Analyzing conversation...' : isRecording ? 'Predictions will appear during recording' : 'Start recording to see predictions')}
              </div>
              {predictionError && (
                <div className="text-sm text-red-400 mt-1">
                  Error: {predictionError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls stacked vertically on the bottom right */}
      <div className="fixed bottom-0 right-0 flex flex-col gap-4 p-4 z-20">
        {/* Mic button on top */}
        <GlassesButton
          onClick={toggleRecording}
          disabled={isLoading}
        >
          {isLoading ? (
            <div 
              className="animate-spin" 
              style={{
                width: '28px',
                height: '28px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                borderTopColor: 'white'
              }}
            ></div>
          ) : isRecording ? (
            <Square className="h-7 w-7 text-white" />
          ) : (
            <Mic className="h-7 w-7 text-white" />
          )}
        </GlassesButton>
        
        {/* Glasses mode toggle below */}
        <GlassesButton onClick={toggleGlassesMode}>
          <Glasses className="h-7 w-7 text-white" />
        </GlassesButton>
      </div>
    </div>
  );
};

// Shared button component to ensure both buttons have the same size and style
const GlassesButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, children, disabled = false }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer bg-white/10 border border-white/20"
    >
      {children}
    </button>
  );
}; 