// Speech Recognition Utilities
export interface SpeechRecognitionSupport {
  isSupported: boolean;
  requiresHTTPS: boolean;
  errorMessage?: string;
}

export const checkSpeechRecognitionSupport = (): SpeechRecognitionSupport => {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      requiresHTTPS: false,
      errorMessage: 'Speech recognition is not available in this environment'
    };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return {
      isSupported: false,
      requiresHTTPS: false,
      errorMessage: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
    };
  }

  // Check if we're on HTTPS or localhost
  const isSecureContext = window.isSecureContext || 
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!isSecureContext) {
    return {
      isSupported: true,
      requiresHTTPS: true,
      errorMessage: 'Speech recognition requires HTTPS. Please use the HTTPS development server or deploy to a secure domain.'
    };
  }

  return {
    isSupported: true,
    requiresHTTPS: false
  };
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('🎤 MediaDevices API not supported');
    return false;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('🎤 Microphone permission granted');
    return true;
  } catch (error) {
    console.error('🎤 Microphone permission denied:', error);
    return false;
  }
};

export const getSpeechRecognitionErrorMessage = (error: string): string => {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'No microphone found. Please check your microphone.';
    case 'not-allowed':
      return 'Microphone permission denied. Please allow microphone access and ensure you\'re using HTTPS.';
    case 'network':
      return 'Network error occurred. Please check your connection.';
    case 'service-not-allowed':
      return 'Speech recognition service not allowed. Please use HTTPS.';
    case 'bad-grammar':
      return 'Speech recognition grammar error.';
    case 'language-not-supported':
      return 'Language not supported for speech recognition.';
    default:
      return `Speech recognition error: ${error}`;
  }
};

export const createSpeechRecognition = (): SpeechRecognition | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  return recognition;
};
