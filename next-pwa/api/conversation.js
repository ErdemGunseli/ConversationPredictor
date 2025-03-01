import sendRequest, { sendRequestStream } from './api';

// Get all conversations for the current user
export const getConversations = async () => {
  return await sendRequest('/conversations/', {
    method: 'GET',
  });
};

// Get a specific conversation by ID
export const getConversation = async (conversationId) => {
  return await sendRequest(`/conversations/${conversationId}`, {
    method: 'GET',
  });
};

// Create a new conversation
export const createConversation = async () => {
  return await sendRequest('/conversations/', {
    method: 'POST',
  });
};

// Update a conversation
export const updateConversation = async (conversationId, updateData, ai_insights = false) => {
  // Ensure the payload includes "id"
  const payload = {
    // The required ID field for ConversationUpdate
    id: conversationId,
    // Spread any other fields: name, transcript, summary, etc.
    ...updateData
  };

  return await sendRequest(
    `/conversations/${conversationId}?ai_insights=${ai_insights}`, 
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  return await sendRequest(`/conversations/${conversationId}`, {
    method: 'DELETE',
  });
};

// Stream predictions for a conversation - Modified to work with the backend
export const streamPrediction = async (conversationId, transcript, onDataCallback, onErrorCallback, onCompleteCallback) => {
  try {
    console.log(`[PREDICTION] Fetching prediction for conversation ${conversationId}`);
    
    // Convert string ID to number if needed
    const numericId = typeof conversationId === 'string' 
      ? parseInt(conversationId, 10) 
      : conversationId;
    
    // Create ConversationUpdate compatible structure
    const requestData = {
      id: numericId,
      transcript: transcript.segments || []
    };
    
    console.log(`[PREDICTION] Request data:`, requestData);
    
    return await sendRequestStream(
      `/conversations/${numericId}/prediction_stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      },
      true,
      // onData callback
      (data) => {
        console.log(`[PREDICTION] Received data:`, data);
        
        // Parse data if it's a string (raw JSON)
        let predictionData = data;
        if (typeof data === 'string') {
          try {
            predictionData = JSON.parse(data);
          } catch (e) {
            console.error('[PREDICTION] Failed to parse JSON:', e);
            // Call with the raw string if parsing fails
            if (onDataCallback) {
              onDataCallback({
                text: data,
                type: 'raw',
                progressive: true,
                complete: false,
                error: false
              });
            }
            return;
          }
        }
        
        // Create a consistent format for the UI
        if (onDataCallback) {
          onDataCallback({
            text: predictionData.text || predictionData.prediction || "",
            type: predictionData.complete ? 'complete' : 'progress',
            progressive: !predictionData.complete,
            complete: !!predictionData.complete,
            error: false
          });
        }
      },
      // onError callback
      (error) => {
        console.error(`[PREDICTION] Error: ${error.message || error}`);
        if (onErrorCallback) {
          onErrorCallback({
            text: error.message || "Connection error. Will retry shortly...",
            type: 'error',
            progressive: false,
            complete: false,
            error: true
          });
        }
      },
      // onComplete callback
      () => {
        console.log(`[PREDICTION] Stream completed for conversation ${numericId}`);
        if (onCompleteCallback) {
          onCompleteCallback();
        }
      }
    );
  } catch (error) {
    console.log(`[PREDICTION] Error: ${error.message}`);
    if (onErrorCallback) {
      onErrorCallback({
        text: error.message || "Connection error. Will retry shortly...",
        type: 'error',
        progressive: false,
        complete: false,
        error: true
      });
    }
    return null;
  }
};
