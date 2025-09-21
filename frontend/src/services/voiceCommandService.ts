// Voice Command Service for Reminder Interactions
import textToSpeechService from './textToSpeechService';

interface VoiceCommand {
  type: 'snooze' | 'dismiss' | 'repeat' | 'stop' | 'set_repeat' | 'unknown';
  duration?: number; // for snooze commands
  repeatCount?: number; // for set_repeat commands
  confidence?: number;
}

class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private isSupported = false;
  private onCommandCallback: ((command: VoiceCommand) => void) | null = null;

  constructor() {
    this.initializeService();
  }

  // Initialize speech recognition for voice commands
  private initializeService(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        
        // Increase timeout to give more time for speech detection
        // Note: These properties may not be available in all browsers
        if ('timeout' in this.recognition) {
          (this.recognition as any).timeout = 10000; // 10 seconds
        }
        if ('interimResults' in this.recognition) {
          (this.recognition as any).interimResults = true; // Enable interim results for better feedback
        }

        this.setupEventHandlers();
        console.log('🎤 Voice command service initialized');
      } else {
        this.isSupported = false;
        console.log('🎤 Voice commands not supported in this browser');
      }
    }
  }

  // Setup speech recognition event handlers
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Voice command recognition started');
    };

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const bestResult = results[0];
      
      if (bestResult && bestResult.isFinal) {
        const transcript = bestResult[0].transcript.toLowerCase().trim();
        console.log('🎤 Voice command received:', transcript);
        
        const command = this.parseCommand(transcript);
        if (this.onCommandCallback) {
          this.onCommandCallback(command);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('🎤 Voice command recognition error:', event.error);
      this.isListening = false;
      
      // Handle specific error types
      switch (event.error) {
        case 'no-speech':
          console.log('🎤 No speech detected - try speaking louder or closer to microphone');
          break;
        case 'audio-capture':
          console.log('🎤 Microphone not accessible - check permissions');
          break;
        case 'not-allowed':
          console.log('🎤 Microphone permission denied - please allow microphone access');
          break;
        case 'network':
          console.log('🎤 Network error - check internet connection');
          break;
        case 'aborted':
          console.log('🎤 Speech recognition aborted');
          break;
        default:
          console.log('🎤 Speech recognition error:', event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Voice command recognition ended');
    };
  }

  // Parse voice command from transcript
  private parseCommand(transcript: string): VoiceCommand {
    const text = transcript.toLowerCase();

    // Set repeat count commands
    const setRepeatPatterns = [
      /repeat\s+(?:this\s+)?(\d+)\s*times?/i,
      /remind\s+me\s+(\d+)\s*times?/i,
      /say\s+(?:this\s+)?(\d+)\s*times?/i,
      /play\s+(?:this\s+)?(\d+)\s*times?/i,
      /(\d+)\s*times?/i,
      /repeat\s+(\d+)/i,
      /set\s+repeat\s+to\s+(\d+)/i,
      /change\s+repeat\s+to\s+(\d+)/i
    ];

    for (const pattern of setRepeatPatterns) {
      const match = text.match(pattern);
      if (match) {
        const repeatCount = parseInt(match[1]);
        if (repeatCount > 0 && repeatCount <= 10) { // Max 10 times
          return {
            type: 'set_repeat',
            repeatCount: repeatCount,
            confidence: 0.9
          };
        }
      }
    }

    // Snooze commands
    const snoozePatterns = [
      /snooze\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?)/i,
      /remind\s+me\s+(?:in\s+)?(\d+)\s*(?:minutes?|mins?)/i,
      /(\d+)\s*(?:minutes?|mins?)\s*(?:later|from\s+now)/i,
      /snooze\s+(\d+)/i,
      /(\d+)\s*min\s*snooze/i
    ];

    for (const pattern of snoozePatterns) {
      const match = text.match(pattern);
      if (match) {
        const duration = parseInt(match[1]);
        if (duration > 0 && duration <= 1440) { // Max 24 hours
          return {
            type: 'snooze',
            duration: duration,
            confidence: 0.9
          };
        }
      }
    }

    // Dismiss commands - enhanced patterns for "Okay, done"
    const dismissPatterns = [
      /okay\s*,?\s*done/i,
      /ok\s*,?\s*done/i,
      /alright\s*,?\s*done/i,
      /got\s+it\s*,?\s*done/i,
      /dismiss/i,
      /done/i,
      /complete/i,
      /finished/i,
      /stop\s+reminder/i,
      /cancel\s+reminder/i,
      /mark\s+done/i,
      /got\s+it/i,
      /okay/i,
      /ok/i,
      /thanks/i,
      /thank\s+you/i,
      /acknowledged/i,
      /understood/i
    ];

    for (const pattern of dismissPatterns) {
      if (pattern.test(text)) {
        return {
          type: 'dismiss',
          confidence: 0.8
        };
      }
    }

    // Repeat commands (single repeat)
    const repeatPatterns = [
      /repeat/i,
      /say\s+again/i,
      /what\s+was\s+that/i,
      /again/i,
      /one\s+more\s+time/i
    ];

    for (const pattern of repeatPatterns) {
      if (pattern.test(text)) {
        return {
          type: 'repeat',
          confidence: 0.8
        };
      }
    }

    // Stop commands
    const stopPatterns = [
      /stop\s+speaking/i,
      /shut\s+up/i,
      /be\s+quiet/i,
      /stop/i
    ];

    for (const pattern of stopPatterns) {
      if (pattern.test(text)) {
        return {
          type: 'stop',
          confidence: 0.7
        };
      }
    }

    return {
      type: 'unknown',
      confidence: 0.1
    };
  }

  // Start listening for voice commands
  async startListening(onCommand: (command: VoiceCommand) => void): Promise<boolean> {
    if (!this.isSupported || !this.recognition || this.isListening) {
      return false;
    }

    this.onCommandCallback = onCommand;
    
    try {
      // Request microphone permission first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('🎤 Microphone permission granted for voice commands');
        } catch (permissionError) {
          console.error('🎤 Microphone permission denied for voice commands:', permissionError);
          return false;
        }
      }
      
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('🎤 Error starting voice command recognition:', error);
      return false;
    }
  }

  // Stop listening for voice commands
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Check if currently listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Check if service is supported
  isServiceSupported(): boolean {
    return this.isSupported;
  }

  // Check microphone permissions
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🎤 Microphone permission status:', permission.state);
        return permission.state === 'granted';
      }
      return true; // Assume granted if permissions API not available
    } catch (error) {
      console.log('🎤 Could not check microphone permission:', error);
      return true; // Assume granted if check fails
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      console.log('🎤 Microphone permission granted');
      return true;
    } catch (error) {
      console.log('🎤 Microphone permission denied:', error);
      return false;
    }
  }

  // Get command suggestions for user
  getCommandSuggestions(): string[] {
    return [
      "Snooze for 10 minutes",
      "Remind me in 30 minutes", 
      "Dismiss",
      "Done",
      "Repeat",
      "Repeat this 3 times",
      "Remind me 5 times",
      "Set repeat to 2",
      "Stop speaking"
    ];
  }

  // Test the service
  async test(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Voice commands not supported');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stopListening();
        reject(new Error('Voice command test timeout'));
      }, 10000);

      this.startListening((command) => {
        clearTimeout(timeout);
        this.stopListening();
        
        if (command.type !== 'unknown') {
          resolve();
        } else {
          reject(new Error('No valid command recognized'));
        }
      });

      // Speak test instruction
      textToSpeechService.speak('Please say a command like "snooze for 5 minutes" or "dismiss"', {
        rate: 0.8,
        volume: 0.7
      });
    });
  }
}

// Create singleton instance
const voiceCommandService = new VoiceCommandService();

export default voiceCommandService;
