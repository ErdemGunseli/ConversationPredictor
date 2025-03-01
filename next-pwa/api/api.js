import { getTokens } from './auth';
import { showToast } from '@/services/toastService';


export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://heard.onrender.com'


// Creating a custom API Error to encapsulate the status code and message:
class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function addAuthHeader(options = {}, useAuth = true) {
    options.headers = options.headers || {};
    if (useAuth) {
        const tokens = await getTokens();  
        if (tokens?.access_token) {
            options.headers['Authorization'] = `Bearer ${tokens.access_token}`;
        }
    }
    return options;
}

export default async function sendRequest(endpoint, options = {}, useAuth = true) {
    try {
        // Injecting auth header if available:
        options = await addAuthHeader(options, useAuth);

        // Sending the request and obtaining content type of the response:
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const contentType = response.headers.get('content-type');
        let responseObject = null;

        // If the response is not "No Content" and is JSON, parsing it:
        if (response.status !== 204 && contentType && contentType.includes('application/json')) {
            try {
                responseObject = await response.json();
            } catch (jsonError) {
                throw new ApiError('Failed to parse response as JSON', response.status);
            }
        }

        // If the request has failed, providing an error message:
        if (!response.ok) {
            throw new ApiError(
                responseObject?.detail || response.statusText || 'An error occurred, please check your input.',
                response.status
            );
        }

        return responseObject;
    } catch (error) {
        if (error instanceof ApiError) {
            showToast({
                title: error.message,
                variant: 'destructive',
            });
        } else {
            showToast({
                title: 'Please check your network connection',
                variant: 'destructive',
            });
        }
        return null;
    }
}

export function encodeForm(data) {
    return Object.keys(data)
    // Encoding for application/x-www-form-urlencoded
    // 'encodeURIComponent' encodes spaces and special characters etc.
    // Encoding in the form "key1=val1&key2=val2":
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
}


export const sendRequestStream = async (
  endpoint,
  options = {},
  useAuth = true,
  onData = () => {},
  onError = () => {},
  onComplete = () => {}
) => {
  try {
    // Prepare request options
    const requestOptions = {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    // Add authentication if needed - use the existing token system
    if (useAuth) {
      const tokens = await getTokens();
      if (tokens?.access_token) {
        requestOptions.headers['Authorization'] = `Bearer ${tokens.access_token}`;
      }
    }

    // Log request for debugging (optional)
    console.log(`[API] ${requestOptions.method || 'GET'} request to ${endpoint}`, requestOptions);

    // Make the fetch request
    const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Handle the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Handle any remaining data in the buffer
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer.trim());
            onData(json);
          } catch (e) {
            console.error('Error parsing remaining JSON data:', e);
          }
        }
        onComplete();
        break;
      }

      // Decode and process the chunk
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete JSON objects (might be multiple per chunk)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line.trim());
            onData(json);
          } catch (e) {
            console.error('Error parsing JSON:', e, 'Line:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('API Stream Error:', error);
    onError(error);
  }
};
