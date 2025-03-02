import React, { useState, useRef, useEffect } from 'react';
import { RealtimeClient } from '@speechmatics/real-time-client';
import { Button } from '@/components/ui/button';
import { Cover } from '@/components/ui/cover';
import { MoreVertical, Languages, Glasses, Sparkles, LightbulbIcon, FileText } from 'lucide-react';
import { fetchJWT } from '@/api/transcription';
import { useLanguageSettings, getLanguageName } from './language-selector';
import { RecordingButton } from './recording-button';
import { useGlassesMode } from '@/context/GlassesModeContext';
import { createPortal } from 'react-dom';
import { GlassesMode } from './glasses-mode';
import { useConversation } from '@/context/ConversationContext';
import { useTheme } from "next-themes";
import { InsightsButton } from './insights-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TranscriptionService } from '@/api/transcription';
import { Textarea } from '@/components/ui/textarea';

// Modified interface for transcript segments
interface TranscriptSegment {
  id: number;          // Unique identifier for each segment
  text: string;
  speaker: string;
  translations: string[];
  timestamp: number;
}

// Neon vibrant colors for speakers in dark mode
const SPEAKER_COLORS_DARK = [
  { text: 'text-[#FF00FF]', bg: 'bg-[#FF00FF]' },      // Magenta
  { text: 'text-[#00FFFF]', bg: 'bg-[#00FFFF]' },      // Cyan
  { text: 'text-[#FF3131]', bg: 'bg-[#FF3131]' },      // Neon Red
  { text: 'text-[#39FF14]', bg: 'bg-[#39FF14]' },      // Neon Green
  { text: 'text-[#FFF01F]', bg: 'bg-[#FFF01F]' },      // Neon Yellow
  { text: 'text-[#7DF9FF]', bg: 'bg-[#7DF9FF]' },      // Electric Blue
  { text: 'text-[#FF6EC7]', bg: 'bg-[#FF6EC7]' },      // Neon Pink
  { text: 'text-[#CC00FF]', bg: 'bg-[#CC00FF]' },      // Electric Purple
  { text: 'text-[#FB4264]', bg: 'bg-[#FB4264]' },      // Neon Orange
  { text: 'text-[#58D68D]', bg: 'bg-[#58D68D]' },      // Bright Mint
];

// Vibrant but less bright colors for speakers in light mode
const SPEAKER_COLORS_LIGHT = [
  { text: 'text-[#C7008B]', bg: 'bg-[#C7008B]' },      // Deep Magenta
  { text: 'text-[#008B8B]', bg: 'bg-[#008B8B]' },      // Dark Cyan
  { text: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]' },      // Crimson Red
  { text: 'text-[#2E7D32]', bg: 'bg-[#2E7D32]' },      // Forest Green
  { text: 'text-[#F57F17]', bg: 'bg-[#F57F17]' },      // Dark Amber
  { text: 'text-[#0277BD]', bg: 'bg-[#0277BD]' },      // Ocean Blue
  { text: 'text-[#AD1457]', bg: 'bg-[#AD1457]' },      // Deep Pink
  { text: 'text-[#6A1B9A]', bg: 'bg-[#6A1B9A]' },      // Deep Purple
  { text: 'text-[#E64A19]', bg: 'bg-[#E64A19]' },      // Deep Orange
  { text: 'text-[#00695C]', bg: 'bg-[#00695C]' },      // Teal
];

// Add a type for prediction data
interface PredictionData {
  text: string;
  timestamp: number;
  complete: boolean;
  new: boolean;
  error: boolean;
}

export const ConversationRecorder: React.FC<{ conversation?: any }> = ({ conversation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [partialTranslation, setPartialTranslation] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Add a new state to track if auto-scrolling should be enabled
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Use the language settings hook
  const { sourceLanguage, targetLanguage } = useLanguageSettings();
  
  // Use conversation context
  const { createConversation, updateConversationTranscript, updateConversation, currentConversation, setCurrentConversation } = useConversation();

  const nextSegmentIdRef = useRef<number>(1);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);
  
  // Simplified tracking system exactly like the working code
  const pendingSegmentsRef = useRef<Map<string, number[]>>(new Map());

  // Replace the isDarkMode state and detection
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = theme === 'dark' || resolvedTheme === 'dark';

  // Track user scroll position
  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Check if user is near the bottom of the container (within 100px)
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only enable auto-scroll when user is near the bottom
      setShouldAutoScroll(isNearBottom);
    };
    
    // Add scroll event listener
    container.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Modified auto-scroll effect
  useEffect(() => {
    if (shouldAutoScroll && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcriptSegments, partialTranscript, partialTranslation, shouldAutoScroll]);

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
      setShouldAutoScroll(true);
    }
    
  };

  // Load transcript from conversation if one is provided
  useEffect(() => {
    if (conversation?.transcript) {
      setTranscriptSegments(conversation.transcript);
      // Set the next segment ID to be one more than the highest ID in the conversation
      const maxId = conversation.transcript.reduce(
        (max: number, segment: TranscriptSegment) => Math.max(max, segment.id), 0
      );
      nextSegmentIdRef.current = maxId + 1;
    } else {
      // Clear transcript if no conversation
      setTranscriptSegments([]);
      nextSegmentIdRef.current = 1;
    }
  }, [conversation]);

  // Updated function to get speaker color based on current mode
  const getSpeakerColor = (speaker: string) => {
    // Extract numerical part from speaker ID (e.g., "S1" -> 1)
    const speakerNum = parseInt((speaker.match(/\d+/) || ['0'])[0]);
    const colorIndex = speakerNum % 10;
    return isDarkMode 
      ? SPEAKER_COLORS_DARK[colorIndex].text 
      : SPEAKER_COLORS_LIGHT[colorIndex].text;
  };

  // Updated function to get speaker background color based on current mode
  const getSpeakerBgColor = (speaker: string) => {
    const speakerNum = parseInt((speaker.match(/\d+/) || ['0'])[0]);
    const colorIndex = speakerNum % 10;
    return isDarkMode 
      ? SPEAKER_COLORS_DARK[colorIndex].bg 
      : SPEAKER_COLORS_LIGHT[colorIndex].bg;
  };

  // Get readable speaker name
  const getSpeakerName = (speaker: string) => {
    return speaker === 'UU' ? 'Unknown Speaker' : `Speaker ${speaker.replace(/[^0-9]/g, '')}`;
  };

  // Add this ref to the component:
  const transcriptIdMappingRef = useRef<Map<string, number>>(new Map());

  // Enhanced translation handling function with simplified matching logic
  const handleTranslation = (data: any, isPartial: boolean) => {
    // Extract translation text from results
    const translationText = data.results
      .map((r: any) => r.content || '')
      .join(' ')
      .replace(/ ([,.!?;:])/g, '$1');
    
    // Get the speaker info
    const speaker = data.results[0]?.speaker || '';
    
    // For partial translations, update the partial state
    if (isPartial) {
      setPartialTranslation(translationText);
      currentSpeakerRef.current = speaker;
      return;
    }
    
    // For final translations, use simplified matching logic similar to the working code
    const pendingIds = pendingSegmentsRef.current.get(speaker) || [];
    
    if (pendingIds.length > 0) {
      // Get the oldest pending segment ID
      const segmentId = pendingIds.shift();
      
      // Update the pending segments map
      pendingSegmentsRef.current.set(speaker, pendingIds);
      
      // Add translation to the segment
      setTranscriptSegments(prev => {
        const updatedSegments = [...prev];
        const segmentIndex = updatedSegments.findIndex(s => s.id === segmentId);
        
        if (segmentIndex !== -1) {
          // Find the segment and log its current state
          const segment = updatedSegments[segmentIndex];
          
          // Ensure translations array exists and is an array
          const currentTranslations = Array.isArray(segment.translations) ? segment.translations : [];
          
          // Create a new array with both existing translations and the new one
          const newTranslations = [...currentTranslations, translationText];
          
          // Create the updated segment with the new translations array
          updatedSegments[segmentIndex] = {
            ...segment,
            translations: newTranslations
          };
          
          return updatedSegments;
        }
        return prev;
      });
    } else {
      // If no pending segments for this speaker, try to find the most recent one
      setTranscriptSegments(prev => {
        const speakerSegments = prev
          .filter(s => s.speaker === speaker)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        if (speakerSegments.length > 0) {
          const segmentIndex = prev.findIndex(s => s.id === speakerSegments[0].id);
          
          if (segmentIndex !== -1) {
            // Find the segment and log its current state
            const segment = prev[segmentIndex];
            
            // Ensure translations array exists and is an array
            const currentTranslations = Array.isArray(segment.translations) ? segment.translations : [];
            
            // Create a new array with both existing translations and the new one
            const newTranslations = [...currentTranslations, translationText];
            
            // Create updated segments array with the modified segment
            const updatedSegments = [...prev];
            updatedSegments[segmentIndex] = {
              ...segment,
              translations: newTranslations
            };
            
            return updatedSegments;
          }
        }
        
        return prev;
      });
    }
    
    // Clear partial translation if it was for this speaker
    if (currentSpeakerRef.current === speaker) {
      setPartialTranslation('');
      currentSpeakerRef.current = null;
    }
  };

  // Language-agnostic function to clean repeated words from translations
  const cleanRepeatedWords = (text: string): string => {
    // Don't process very short texts
    if (text.length <= 5) return text;
    
    // Split into words, preserving punctuation
    const words = text.split(/\s+/);
    const result = [];
    
    // Process consecutive duplicated words
    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i].toLowerCase();
      
      // Skip if this is the same as the previous word (exact repetition)
      if (i > 0 && currentWord === words[i-1].toLowerCase()) {
        continue;
      }
      
      // Skip if this is a three-word repetition pattern (A B A)
      if (i >= 2 && currentWord === words[i-2].toLowerCase()) {
        // Check if the middle word is different and the pattern is repeating
        const middleWord = words[i-1].toLowerCase();
        if (middleWord !== currentWord && 
            i+2 < words.length && 
            words[i+1].toLowerCase() === middleWord && 
            words[i+2].toLowerCase() === currentWord) {
          // Skip this whole pattern (A B A B A) -> (A B)
          i += 2; // Skip the next two words
          continue;
        }
      }
      
      // Add the current word to the result
      result.push(words[i]);
    }
    
    return result.join(' ');
  };

  // Add state for predictions (up to 3 most recent)
  const [predictions, setPredictions] = useState<string[]>([]);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Add this ref to store the last valid predictions
  const lastValidPredictionsRef = useRef<string[]>([]);
  
  // Add a ref to track active prediction stream
  const activePredictionStreamRef = useRef<boolean>(false);
  
  // Add this ref for transcription service (needed in some effects)
  const transcriptionServiceRef = useRef<any>(null);
  
  // Track current conversation ID to detect changes
  const prevConversationIdRef = useRef<number | null>(null);

  // Add this effect to reset predictions when conversation changes
  useEffect(() => {
    const currentId = conversation?.id || currentConversation?.id;
    
    // If we have a new conversation ID that's different from the previous one
    if (currentId && prevConversationIdRef.current !== currentId) {
      console.log(`[PREDICTION_STATE] Conversation changed from ${prevConversationIdRef.current} to ${currentId}, clearing predictions`);
      
      // Clear prediction state and the last valid prediction ref
      setPredictions([]);
      
      // Update the previous conversation ID ref
      prevConversationIdRef.current = currentId;
    } else if (currentId && prevConversationIdRef.current === null) {
      // First conversation initialization
      prevConversationIdRef.current = currentId;
    }
  }, [conversation?.id, currentConversation?.id]);

  // Also clear predictions when recording starts for a fresh start
  useEffect(() => {
    if (isRecording && !wasRecordingRef.current) {
      console.log(`[PREDICTION_STATE] Recording started, clearing predictions`);
      setPredictions([]);
    }
    
    // Update recording state tracking
    wasRecordingRef.current = isRecording;
  }, [isRecording]);

  // Additional ref to track recording state changes
  const wasRecordingRef = useRef<boolean>(false);

  // Add this effect to update the ref when we get valid predictions
  useEffect(() => {
    if (predictions.length > 0 && predictions[0].trim() !== '') {
      lastValidPredictionsRef.current = [...predictions];
    }
  }, [predictions]);

  // Initialize client
  useEffect(() => {
    const client = new RealtimeClient();
    clientRef.current = client;

    client.addEventListener('receiveMessage', ({ data }) => {
      if (data.message === 'AddPartialTranscript') {
        // Process partial transcript without any logging
        const partialText = data.results
          .map((r) => r.alternatives?.[0]?.content || '')
          .join(' ')
          .replace(/ ([,.!?;:])/g, '$1');
        setPartialTranscript(partialText);
      } else if (data.message === 'AddTranscript') {
        // Process complete transcript without any logging
        // Group words by speaker
        let currentSpeaker = '';
        let currentText = '';
        
        data.results.forEach((result) => {
          const speaker = result.alternatives?.[0]?.speaker || 'UU';
          const content = result.alternatives?.[0]?.content || '';
          
          // Add content with appropriate spacing
          if (speaker !== currentSpeaker && currentText) {
            // When speaker changes, add the previous segment
            const cleanedText = currentText.trim().replace(/ ([,.!?;:])/g, '$1');
            
            setTranscriptSegments(prev => {
              // Check if the last segment was from the same speaker
              const lastSegment = prev.length > 0 ? prev[prev.length - 1] : null;
              
              if (lastSegment && lastSegment.speaker === currentSpeaker) {
                // If same speaker, merge with previous segment
                const updatedSegments = [...prev];
                const newText = lastSegment.text + ' ' + cleanedText;
                
                updatedSegments[updatedSegments.length - 1] = {
                  ...lastSegment,
                  text: newText
                };
                return updatedSegments;
              } else {
                // Different speaker, add as new segment
                const segmentId = nextSegmentIdRef.current++;
                
                // If translation is enabled, track this segment as pending translation
                if (targetLanguage) {
                  // Get current pending segments for this speaker
                  const pendingIds = pendingSegmentsRef.current.get(currentSpeaker) || [];
                  
                  // Add this segment ID to the pending list
                  pendingSegmentsRef.current.set(currentSpeaker, [...pendingIds, segmentId]);
                }
                
                return [...prev, { 
                  id: segmentId,
                  text: cleanedText, 
                  speaker: currentSpeaker || 'UU',
                  translations: [],
                  timestamp: Date.now()
                }];
              }
            });
            
            currentText = content;
          } else {
            // Same speaker, append content with proper spacing
            const isPunctuation = /^[,.!?;:]/.test(content);
            currentText += isPunctuation ? content : ' ' + content;
          }
          
          currentSpeaker = speaker;
        });
        
        // Add the last segment
        if (currentText) {
          const cleanedText = currentText.trim().replace(/ ([,.!?;:])/g, '$1');
          
          setTranscriptSegments(prev => {
            // Check if the last segment was from the same speaker
            const lastSegment = prev.length > 0 ? prev[prev.length - 1] : null;
            
            if (lastSegment && lastSegment.speaker === currentSpeaker) {
              // If same speaker, merge with previous segment
              const updatedSegments = [...prev];
              const newText = lastSegment.text + ' ' + cleanedText;
              
              updatedSegments[updatedSegments.length - 1] = {
                ...lastSegment,
                text: newText
              };
              return updatedSegments;
            } else {
              // Different speaker, add as new segment
              const segmentId = nextSegmentIdRef.current++;
              
              // If translation is enabled, track this segment as pending translation
              if (targetLanguage) {
                // Get current pending segments for this speaker
                const pendingIds = pendingSegmentsRef.current.get(currentSpeaker) || [];
                
                // Add this segment ID to the pending list
                pendingSegmentsRef.current.set(currentSpeaker, [...pendingIds, segmentId]);
              }
              
              return [...prev, { 
                id: segmentId,
                text: cleanedText, 
                speaker: currentSpeaker || 'UU',
                translations: [],
                timestamp: Date.now()
              }];
            }
          });
        }
        
        setPartialTranscript('');
      } else if (data.message === 'AddTranslation' || data.message === 'AddPartialTranslation') {
        // Process translation without any logging
        handleTranslation(data, data.message === 'AddPartialTranslation');
      } else if (data.message === 'EndOfTranscript') {
        // Handle end of transcript without logging
        stopRecording();
      } else if (data.message === 'Error') {
        setError(`Transcription error: ${data.type}: ${data.reason || 'Unknown error'}`);
        stopRecording();
      }
    });

    return () => {
      try {
        if (isRecording) {
          stopRecording();
        }
      } catch (error) {
        console.warn("Error during cleanup:", error);
      }
    };
  }, [targetLanguage]); // Added targetLanguage dependency to update handling when changed

  const startRecording = async () => {
    try {
      setError(null);
      const jwt = await fetchJWT();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Configure transcription and translation
      const config: any = {
        transcription_config: {
          language: sourceLanguage,
          enable_partials: true,
          operating_point: "enhanced",
          diarization: 'speaker',
          speaker_diarization_config: {
            max_speakers: 10
          }
        }
      };
      
      // Add translation config if a target language is selected
      if (targetLanguage) {
        config.translation_config = {
          enable_partials: true,
          target_languages: [targetLanguage]
        };
      }
      
      // Start the Speechmatics client
      if (clientRef.current) {
        await clientRef.current.start(jwt, config);
        
        // Set up MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && clientRef.current) {
            try {
              // Convert Blob to ArrayBuffer and send to Speechmatics
              const buffer = await event.data.arrayBuffer();
              clientRef.current.sendAudio(buffer);
            } catch (error) {
              console.error("Error sending audio:", error);
            }
          }
        };
        
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        setIsRecording(true);
        // Only clear the partial transcript, keep the full transcript history
        setPartialTranscript('');
        setPartialTranslation('');
      }

      // If we have a conversation ID, prediction stream will be started by the useEffect
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
      stopRecording();
    }
  };

  // Add this effect to reset prediction state when conversation changes
  useEffect(() => {
    // Reset prediction state when conversation changes
    setPredictions([]);
    setIsPredicting(false);
    setPredictionError(null);
    
    // Stop any active prediction stream
    if (transcriptionServiceRef.current) {
      transcriptionServiceRef.current.stopPredictionStream();
    }
  }, [conversation]);

  // Modified toggleRecording function to reset prediction state
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
      // Force scroll to bottom when recording ends
      scrollToBottom();
    } else {
      setIsLoading(true);
      // Reset prediction state when starting a new recording
      setPredictions([]);
      setIsPredicting(false);
      setPredictionError(null);
      
      try {
        // Create a new conversation if we don't have one
        if (!conversation && !currentConversation) {
          const newConversation = await createConversation();
          // Ensure the new conversation is selected
          if (newConversation && setCurrentConversation) {
            setCurrentConversation(newConversation);
          }
        }
        await startRecording();
        // Force scroll to bottom when recording starts
        scrollToBottom();
      } catch (error) {
        console.error('Error starting recording:', error);
        setError(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Modified stopRecording to save transcript to conversation with AI insights
  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (clientRef.current) {
      try {
        // Only try to stop recognition if we're actually recording
        if (isRecording) {
          clientRef.current.stopRecognition();
        }
      } catch (error) {
        console.warn("Error stopping recognition:", error);
        // Continue with cleanup even if stopping recognition failed
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // After recording stops, save the transcript to the conversation
    if (transcriptSegments.length > 0) {
      try {
        const conversationId = conversation?.id || currentConversation?.id;
        if (conversationId) {
          setIsProcessing(true); // Show processing state while AI generates insights
          await updateConversationTranscript(conversationId, transcriptSegments, true);
          setIsProcessing(false);
        } else {
          console.warn('No conversation ID available to save transcript');
        }
      } catch (error) {
        console.error('Error saving transcript:', error);
        setError(`Failed to save transcript: ${error instanceof Error ? error.message : String(error)}`);
        setIsProcessing(false);
      }
    }
    
    setIsRecording(false);
  };

  // Add useGlassesMode hook
  const { glassesMode, toggleGlassesMode } = useGlassesMode();

  // State to track if we're in the browser (for portal rendering)
  const [isBrowser, setIsBrowser] = React.useState(false);
  
  // Set isBrowser to true once component mounts
  React.useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Reset the transcript ID mapping when starting a new conversation
  useEffect(() => {
    transcriptIdMappingRef.current = new Map();
  }, []);

  // Add this effect to handle cleanup when conversation changes
  useEffect(() => {
    // When conversation changes, ensure we stop any active recording
    if (isRecording) {
      stopRecording(); // Changed from handleStopRecording to stopRecording
    }
    
    // Clear any pending state
    setPartialTranscript('');
    setPartialTranslation('');
    
    // Reset the transcript ID mapping
    transcriptIdMappingRef.current = new Map();
    
    // Reset pending segments
    pendingSegmentsRef.current = new Map();
  }, [conversation]);

  // Also update createNewConversation function to reset prediction state
  const createNewConversation = async () => {
    try {
      // If recording is in progress, stop it first
      if (isRecording) {
        await stopRecording();
        
        // Wait a brief moment to ensure all transcriptions are processed
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Reset prediction state for new conversation
      setPredictions([]);
      setIsPredicting(false);
      setPredictionError(null);
      
      // If we have a current conversation, finalize and save it
      if (currentConversation && transcriptSegments.length > 0) {
        await updateConversationTranscript(
          currentConversation.id, 
          transcriptSegments
        );
      }
      
      // Create and select the new conversation
      const newConversation = await createConversation();
      
      // Ensure the new conversation is selected
      if (newConversation && setCurrentConversation) {
        setCurrentConversation(newConversation);
      }
      
      // Reset state for the new conversation
      setTranscriptSegments([]);
      nextSegmentIdRef.current = 1;
      setPartialTranscript('');
      setPartialTranslation('');
      transcriptIdMappingRef.current = new Map();
      pendingSegmentsRef.current = new Map();
      
    } catch (error) {
      console.error("Error creating new conversation:", error);
      setError("Failed to create new conversation");
    }
  };

  // Add these new states for the background information dialog
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [backgroundInfo, setBackgroundInfo] = useState('');
  
  // Add this effect to initialize background info when conversation changes
  useEffect(() => {
    if (conversation?.context || currentConversation?.context) {
      setBackgroundInfo(conversation?.context || currentConversation?.context || '');
    }
  }, [conversation, currentConversation]);
  
  // Add this function to save the context when dialog is closed
  const saveBackgroundInfo = async () => {
    try {
      const conversationId = conversation?.id || currentConversation?.id;
      if (conversationId) {
        console.log(`Saving background info for conversation ${conversationId}:`, backgroundInfo);
        
        // Make sure the update data has the correct structure
        // The ConversationUpdate model in the backend expects an id field
        const updateData = { 
          id: conversationId,  // Add the ID to match the expected schema
          context: backgroundInfo 
        };
        
        console.log("Update payload:", updateData);
        
        // Call the update function and wait for response
        const response = await updateConversation(conversationId, updateData);
        console.log("Update response:", response);
        
        // Update local state with the response data
        if (response && response.context !== undefined) {
          setBackgroundInfo(response.context || '');
        }
        
        setShowBackgroundDialog(false);
      } else {
        console.error("No conversation ID found");
        setError("Cannot save background information: No conversation selected");
      }
    } catch (error) {
      console.error('Error saving background information:', error);
      setError(`Failed to save background information: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Add this function to move the cursor to the end of the text when the dialog opens
  const handleBackgroundInfoDialogOpen = () => {
    // Get the latest context value
    const currentContext = conversation?.context || currentConversation?.context || '';
    setBackgroundInfo(currentContext);
    setShowBackgroundDialog(true);
  };

  // Fix the prediction stream functionality to prevent multiple concurrent requests
  useEffect(() => {
    // Only attempt to stream predictions if:
    // 1. We have a conversation
    // 2. We're actively recording
    // 3. We have transcript segments to analyze
    // 4. We don't already have an active prediction stream
    const conversationId = conversation?.id || currentConversation?.id;
    
    if (conversationId && isRecording && transcriptSegments.length > 0 && !activePredictionStreamRef.current) {
      console.log("[PREDICTION] Starting prediction stream...");
      activePredictionStreamRef.current = true;
      setIsPredicting(true);
      
      // Create a transcript object compatible with the API
      const transcript = {
        segments: transcriptSegments
      };
      
      // Set up callbacks
      const handlePredictionData = (data: PredictionData) => {
        console.log("[PREDICTION] Received data:", data);
        if (data.text) {
          setPredictions(prev => {
            // Create a new array with the new prediction first, then up to 2 previous ones
            const updatedPredictions = [data.text, ...prev.slice(0, 2)];
            console.log(`[PREDICTION] Updated predictions array (${updatedPredictions.length} items)`);
            return updatedPredictions;
          });
        }
        
        // If stream is complete, mark the ref as inactive to allow new requests
        if (data.complete) {
          activePredictionStreamRef.current = false;
          setIsPredicting(false);
        }
        setPredictionError(null);
      };
      
      const handlePredictionError = (error) => {
        console.error("[PREDICTION] Error:", error);
        setPredictionError(error.text || "Failed to get predictions");
        setIsPredicting(false);
        // Mark the stream as inactive on error
        activePredictionStreamRef.current = false;
      };
      
      const handlePredictionComplete = () => {
        console.log("[PREDICTION] Stream completed");
        setIsPredicting(false);
        // Mark the stream as inactive when completed
        activePredictionStreamRef.current = false;
      };
      
      // Import and use the streamPrediction function from API
      import("@/api/conversation").then(({ streamPrediction }) => {
        streamPrediction(
          conversationId,
          transcript,
          handlePredictionData,
          handlePredictionError,
          handlePredictionComplete
        );
      }).catch(error => {
        console.error("Failed to import streamPrediction:", error);
        setPredictionError("Failed to load prediction functionality");
        // Mark the stream as inactive on error
        activePredictionStreamRef.current = false;
      });
      
      return () => {
        // Clean up prediction stream if component unmounts or dependencies change
        console.log("[PREDICTION] Cleaning up prediction stream");
        // Mark the stream as inactive when cleaned up
        activePredictionStreamRef.current = false;
      };
    }
    
    // If recording stops, make sure to reset the active stream flag
    if (!isRecording) {
      activePredictionStreamRef.current = false;
    }
  }, [conversation?.id, currentConversation?.id, isRecording, transcriptSegments]);

  // Render the UI
  return (
    <div className="w-full flex flex-col min-h-[600px] h-full">
      {/* Glasses Mode Portal - Rendered at the root level */}
      {isBrowser && glassesMode && createPortal(
        <GlassesMode 
          transcriptSegments={transcriptSegments}
          partialTranscript={partialTranscript}
          isRecording={isRecording}
          isLoading={isLoading}
          toggleRecording={toggleRecording}
          toggleGlassesMode={toggleGlassesMode}
          getSpeakerColor={getSpeakerColor}
          getSpeakerName={getSpeakerName}
          getSpeakerBgColor={getSpeakerBgColor}
        />,
        document.body
      )}

      {/* Regular UI - only visible when not in glasses mode */}
      <div className={`w-full flex flex-col h-full ${glassesMode ? 'hidden' : ''}`}>
        {/* Top section - changed to transparent background */}
        <div className="px-6 pt-5 pb-4 bg-transparent mb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-lg font-semibold mb-1 flex flex-wrap items-center">
                <span>
                  Live Conversation&nbsp;
                </span>
                
                {(conversation?.name || currentConversation?.name) && (
                  <span className="text-gray-500 dark:text-gray-400 break-all">
                    ({conversation?.name || currentConversation?.name})
                  </span>
                )}
                
                {/* Only show background info button if we have a conversation ID */}
                {(conversation?.id || currentConversation?.id) && (
                  <Button 
                    variant="simple" 
                    size="icon" 
                    onClick={handleBackgroundInfoDialogOpen}
                    className="ml-1"
                    title="Background Information"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {targetLanguage && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Languages className="h-4 w-4 mr-2" />
                  <span>
                    {getLanguageName(sourceLanguage)} → {getLanguageName(targetLanguage)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Add InsightsButton here */}
            {(conversation?.summary || currentConversation?.summary) && (
              <InsightsButton 
                summary={conversation?.summary || currentConversation?.summary} 
                className="ml-2"
              />
            )}
          </div>
        </div>

        {/* Scrollable transcript container */}
        <div 
          ref={transcriptContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth px-6"
        >
          <div className="h-full pb-4">
            {transcriptSegments.length === 0 && !partialTranscript ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center italic text-gray-400 dark:text-gray-500">
                  Start recording to see the conversation
                </div>
              </div>
            ) : (
              <>
                {transcriptSegments.map((segment) => (
                  <div key={segment.id} className="mb-6">
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
                        <span>{segment.text}</span>
                        {segment.translations && segment.translations.length > 0 && (
                          <span className="text-sm italic mt-1 text-gray-400 dark:text-gray-500">
                            {segment.translations.join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Use Cover component for partial transcript with small padding and no corner dots */}
                {partialTranscript && (
                  <Cover 
                    className="mb-2" 
                    smallPadding={true} 
                    removeCornerDots={true}
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {partialTranscript}
                    </div>
                  </Cover>
                )}
                
                {/* Use Cover component for partial translation with small padding and no corner dots */}
                {partialTranslation && targetLanguage && (
                  <Cover 
                    className="mb-4"
                    smallPadding={true}
                    removeCornerDots={true}
                  >
                    <div className="text-sm italic text-gray-600 dark:text-gray-300">
                      <span className="text-xs font-medium">{getLanguageName(targetLanguage)}:</span> {partialTranslation}
                    </div>
                  </Cover>
                )}
              </>
            )}

          </div>
        </div>
        
        {/* Prediction area with no bottom margin */}
        <div className="px-6 pt-4">
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/80'}`}>
            <div className="flex items-start">
              <div className="flex-1">
                <div className="text-sm font-medium mb-1 flex items-center gap-2">
                  <LightbulbIcon className={`h-4 w-4 ${isPredicting ? 'animate-pulse' : ''} text-[#818cf8]`} />
                  <span className="!text-transparent !dark:text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#c084fc]">
                    AI Prediction
                  </span>
                </div>
                <div className={`text-sm ${isPredicting ? 'animate-typing' : ''}`}>
                  {lastValidPredictionsRef.current[0] || predictions[0] ? 
                    (predictions[0] || lastValidPredictionsRef.current[0]) : 
                    (isPredicting ? 'Analyzing conversation...' : 
                      isRecording ? 'Predictions will appear during recording' : 
                      'Start recording to see predictions')}
                  {isPredicting && <span className="ml-0.5 inline-block w-1 h-4 bg-current opacity-70 animate-blink"></span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm rounded border border-red-100 dark:border-red-900 bg-red-50/80 dark:bg-red-900/20 mx-6 mt-2">
            {error}
          </div>
        )}
        
        {/* Reduced top margin for RecordingButton container */}
        <div className="w-full bg-transparent pt-0 pb-4 px-4">
          <RecordingButton 
            isRecording={isRecording}
            onClick={toggleRecording}
            isLoading={isLoading || isProcessing}
            processingAI={isProcessing}
            className="w-full"
          />
        </div>
        
        {/* Background Information Dialog */}
        <Dialog open={showBackgroundDialog} onOpenChange={setShowBackgroundDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Background Information</DialogTitle>
              <DialogDescription>
                Add any context or background information about this conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={backgroundInfo}
                onChange={(e) => setBackgroundInfo(e.target.value)}
                placeholder="Add background information to help AI understand this conversation better..."
                className="min-h-[200px] background-info-textarea"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowBackgroundDialog(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={saveBackgroundInfo}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
};


