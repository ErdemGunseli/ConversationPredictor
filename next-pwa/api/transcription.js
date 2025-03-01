import { RealtimeClient } from '@speechmatics/real-time-client';
import { sendRequestStream } from './api';
import { streamPrediction } from './conversation';

// Function to fetch JWT token - using the working implementation
export const fetchJWT = async () => {
  const apiKey = process.env.NEXT_PUBLIC_SPEECHMATICS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Speechmatics API key not found in environment variables');
  }
  
  try {
    const resp = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ttl: 3600,
      }),
    });
    
    if (!resp.ok) {
      throw new Error(`Failed to get JWT: ${resp.statusText}`);
    }
    
    const data = await resp.json();
    return data.key_value;
  } catch (err) {
    console.error('Error fetching JWT:', err);
    throw err;
  }
};

// Export the TranscriptionService class expected by components
export class TranscriptionService {
  constructor() {
    this.client = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.isRecording = false;
    this.eventHandlers = {};
    this.processedTranslations = new Map();
    this.recentTranslations = [];
    this.currentTranscript = null;
    this.nextSegmentId = 1;
    this.transcriptMapping = new Map();
    this.translationRequestMap = new Map();
    this.pendingSegmentsBySpeaker = new Map();
    this.predictionStreamActive = false;
    this.predictionCallback = null;
    this.predictionStreamRetryTimeout = null;
    this.conversationId = null;
    this.currentSpeaker = null;
    this.currentPredictionRequest = null;
    this.lastPredictionText = null;
  }

  // Set up event handlers
  on(event, callback) {
    this.eventHandlers[event] = callback;
    return this;
  }

  // Initialize client with event listeners
  initialize() {
    // Create client if not exists
    if (!this.client) {
      this.client = new RealtimeClient();
    }

    this.client.addEventListener('receiveMessage', ({ data }) => {
      // Handle different types of messages
      if (data.message === 'AddPartialTranscript' && this.eventHandlers.partialTranscript) {
        this.eventHandlers.partialTranscript(data);
      } else if (data.message === 'AddTranscript' && this.eventHandlers.transcript) {
        // Process transcript and assign segment ID
        const speaker = data.results[0]?.speaker || 'unknown';
        const content = data.results.map(r => r.content || '').join(' ');
        
        // Generate a unique segment ID
        const segmentId = this.nextSegmentId++;
        
        // Store the transcript details
        const transcriptDetails = {
          id: segmentId,
          speaker: speaker,
          text: content,
          timestamp: Date.now()
        };
        
        // Track this segment as pending translation (if we're doing translation)
        const pendingIds = this.pendingSegmentsBySpeaker.get(speaker) || [];
        this.pendingSegmentsBySpeaker.set(speaker, [...pendingIds, segmentId]);
        
        // Store transcript with its ID for later translation matching
        if (data.id) {
          this.transcriptMapping.set(data.id, transcriptDetails);
        }
        
        // Pass the enhanced data with segmentId to the handler
        this.eventHandlers.transcript({...data, segmentId, transcriptDetails});
      } else if (data.message === 'AddPartialTranslation' && this.eventHandlers.partialTranslation) {
        // Extract speaker from translation data
        const speaker = data.results[0]?.speaker || 'unknown';
        this.currentSpeaker = speaker;
        
        this.eventHandlers.partialTranslation(data);
      } else if (data.message === 'AddTranslation' && this.eventHandlers.translation) {
        // Check if this is a duplicate first
        if (!this.shouldProcessTranslation(data)) {
          return;
        }
        
        // Get translation content and speaker
        const translationText = data.results
          .map(r => r.content || '')
          .join(' ')
          .replace(/ ([,.!?;:])/g, '$1');
        
        const speaker = data.results[0]?.speaker || 'unknown';
        
        // Match with pending segments
        const pendingIds = this.pendingSegmentsBySpeaker.get(speaker) || [];
        
        if (pendingIds.length > 0) {
          // Get the oldest pending segment ID
          const segmentId = pendingIds.shift();
          
          // Update the pending segments map
          this.pendingSegmentsBySpeaker.set(speaker, pendingIds);
          
          // Pass both segment ID and translation to handler
          this.eventHandlers.translation({
            ...data, 
            matched: true,
            segmentId,
            translationText,
            speaker
          });
        } else {
          // If no pending segments, try to find the most recent one
          // Just pass the translation and let the component handle fallback matching
          this.eventHandlers.translation({
            ...data, 
            matched: false,
            translationText,
            speaker
          });
        }
        
        // Register that we've processed this translation
        if (data.transcript_id) {
          this.translationRequestMap.set(data.transcript_id, true);
        }
      } else if (data.message === 'EndOfTranscript' && this.eventHandlers.endOfTranscript) {
        this.eventHandlers.endOfTranscript();
      } else if (data.message === 'Error' && this.eventHandlers.error) {
        this.eventHandlers.error(`${data.type}: ${data.reason || 'Unknown error'}`);
      }
    });
    
    return this;
  }

  // Reset tracking maps for new recording
  resetTracking() {
    this.transcriptMapping.clear();
    this.translationRequestMap.clear();
    this.pendingSegmentsBySpeaker.clear();
    this.processedTranslations.clear();
    this.recentTranslations = [];
    this.currentSpeaker = null;
    this.nextSegmentId = 1;
  }

  // Start recording with Speechmatics
  async startRecording(sourceLanguage, targetLanguage = null) {
    try {
      // Reset tracking maps for new recording
      this.resetTracking();
      
      // Initialize client if needed
      if (!this.client) {
        this.client = new RealtimeClient();
        this.initialize();
      }
      
      const jwt = await fetchJWT();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;
      
      // Configure transcription and translation
      const config = {
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
      await this.client.start(jwt, config);
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder = mediaRecorder;
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.client) {
          try {
            // Convert Blob to ArrayBuffer and send to Speechmatics
            const buffer = await event.data.arrayBuffer();
            this.client.sendAudio(buffer);
          } catch (error) {
            console.error("Error sending audio:", error);
            if (this.eventHandlers.error) {
              this.eventHandlers.error(`Failed to send audio: ${error.message}`);
            }
          }
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      if (this.eventHandlers.error) {
        this.eventHandlers.error(`Failed to start recording: ${error.message}`);
      }
      this.stopRecording();
      throw error;
    }
  }

  // Stop recording
  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    if (this.client && this.isRecording) {
      try {
        this.client.stopRecognition();
      } catch (error) {
        console.warn("Error stopping recognition:", error);
      }
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isRecording = false;
  }

  // Start prediction stream
  startPredictionStream(conversationId, transcript, callback) {
    console.log(`[PREDICTION] Starting stream for conversation ${conversationId}`);
    
    // Cancel any existing prediction stream first
    this.stopPredictionStream();
    
    // Keep track of the current prediction request
    this.currentPredictionRequest = streamPrediction(
      conversationId,
      transcript,
      // onData callback - handle incremental updates
      (data) => {
        console.log(`[PREDICTION] Data received:`, data);
        if (callback) callback(data);
      },
      // onError callback - handle errors
      (error) => {
        console.error(`[PREDICTION] Error:`, error);
        if (callback) callback(error);
      },
      // onComplete callback - handle stream completion
      () => {
        console.log(`[PREDICTION] Stream complete for conversation ${conversationId}`);
        // Mark prediction as complete with the final data
        if (callback) {
          callback({
            text: this.lastPredictionText || "",
            type: 'complete',
            progressive: false,
            complete: true,
            error: false
          });
        }
        // Clear the current request since it's done
        this.currentPredictionRequest = null;
      }
    );
    
    return this.currentPredictionRequest;
  }

  // Stop prediction stream
  stopPredictionStream() {
    console.log(`[PREDICTION] Stopping prediction stream`);
    if (this.currentPredictionRequest) {
      // Abort the request if possible
      if (this.currentPredictionRequest.abort) {
        this.currentPredictionRequest.abort();
      }
      this.currentPredictionRequest = null;
    }
  }

  // Helper for duplicate detection
  shouldProcessTranslation(data) {
    if (!data.transcript_id) return true;
    
    // Check if we've already processed this translation
    if (this.translationRequestMap.has(data.transcript_id)) {
      return false;
    }
    
    // Extract content and speaker 
    const content = data.results.map(r => r.content || '').join(' ').trim();
    const speaker = data.results[0]?.speaker || 'unknown';
    
    // Simple duplicate check - if exact same content from same speaker recently
    const key = `${speaker}:${content}`;
    const now = Date.now();
    
    if (this.processedTranslations.has(key)) {
      const lastSeen = this.processedTranslations.get(key);
      if (now - lastSeen < 5000) { // Within 5 seconds
        return false;
      }
    }
    
    // Mark as processed
    this.processedTranslations.set(key, now);
    
    // Add to recent translations
    this.recentTranslations.push({
      speaker,
      content,
      timestamp: now
    });
    
    // Keep only last 10 entries
    if (this.recentTranslations.length > 10) {
      this.recentTranslations.shift();
    }
    
    return true;
  }

  // Clean up resources
  cleanup() {
    this.stopRecording();
    this.stopPredictionStream();
    this.eventHandlers = {};
  }
}

// Also export a default instance for backwards compatibility
export default class Transcription extends TranscriptionService {}