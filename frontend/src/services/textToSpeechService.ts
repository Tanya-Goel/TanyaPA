// Text-to-Speech Service for Voice Reminders
class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isSupported = false;
  private hasUserInteracted = false;
  private pendingSpeakRequests: Array<() => void> = [];
  private isProcessingPendingRequests = false;
  private errorCount = 0;
  private maxErrorCount = 3;
  private isEnablingSpeech = false;
  private isInErrorState = false;

  constructor() {
    this.initializeService();
    this.setupUserInteractionListener();
  }

  // Initialize the text-to-speech service
  private initializeService(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.isSupported = true;
      
      // Load voices immediately and when they become available
      this.loadVoices();
      
      // Load voices when they become available (some browsers load them asynchronously)
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => {
          console.log('🔊 Voices changed, reloading...');
          this.loadVoices();
        };
      }
      
      // Force load voices after a short delay (for browsers that load them asynchronously)
      setTimeout(() => {
        this.loadVoices();
      }, 1000);
      
      console.log('🔊 Text-to-Speech service initialized');
    } else {
      this.isSupported = false;
      console.log('🔊 Text-to-Speech not supported in this browser');
    }
  }

  // Setup user interaction listener to enable speech synthesis
  private setupUserInteractionListener(): void {
    if (typeof window === 'undefined') return;

    const enableSpeech = () => {
      this.hasUserInteracted = true;
      this.errorCount = 0; // Reset error count on user interaction
      this.isInErrorState = false; // Reset error state on user interaction
      console.log('🔊 User interaction detected, speech synthesis enabled');
      
      // Process any pending speak requests safely
      this.processPendingRequests();
      
      // Remove listeners after first interaction
      window.removeEventListener('click', enableSpeech);
      window.removeEventListener('keydown', enableSpeech);
      window.removeEventListener('touchstart', enableSpeech);
      window.removeEventListener('mousedown', enableSpeech);
      window.removeEventListener('focus', enableSpeech);
    };

    // Listen for user interactions with more comprehensive event types
    window.addEventListener('click', enableSpeech, { once: true });
    window.addEventListener('keydown', enableSpeech, { once: true });
    window.addEventListener('touchstart', enableSpeech, { once: true });
    window.addEventListener('mousedown', enableSpeech, { once: true });
    window.addEventListener('focus', enableSpeech, { once: true });
    
    // Also try to enable on page load if user has already interacted
    if (document.hasFocus()) {
      setTimeout(() => {
        if (!this.hasUserInteracted) {
          enableSpeech();
        }
      }, 100);
    }
  }

  // Load available voices
  private loadVoices(): void {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
    console.log('🔊 Loaded voices:', this.voices.length);
  }

  // Safely process pending speak requests to prevent infinite recursion
  private processPendingRequests(): void {
    if (this.isProcessingPendingRequests || this.pendingSpeakRequests.length === 0) {
      return;
    }

    this.isProcessingPendingRequests = true;
    console.log('🔊 Processing pending requests:', this.pendingSpeakRequests.length);

    // Process requests one by one to prevent overwhelming the system
    const requests = [...this.pendingSpeakRequests];
    this.pendingSpeakRequests = [];

    requests.forEach((request, index) => {
      setTimeout(() => {
        try {
          request();
        } catch (error) {
          console.error('🔊 Error processing pending request:', error);
        }
      }, index * 100); // Stagger requests by 100ms
    });

    // Reset processing flag after a delay
    setTimeout(() => {
      this.isProcessingPendingRequests = false;
    }, requests.length * 100 + 500);
  }

  // Get the best voice for reminders
  private getBestVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null;

    // Prefer English voices, especially female voices for better clarity
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en') && !voice.localService
    );

    if (englishVoices.length > 0) {
      // Prefer female voices for reminders
      const femaleVoices = englishVoices.filter(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan')
      );

      if (femaleVoices.length > 0) {
        return femaleVoices[0];
      }

      return englishVoices[0];
    }

    return this.voices[0];
  }

  // Speak text with voice
  async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    interrupt?: boolean;
    requireUserInteraction?: boolean;
  } = {}): Promise<void> {
    if (!this.isSupported || !this.synthesis) {
      console.log('🔊 Text-to-Speech not available');
      throw new Error('Text-to-Speech not supported in this browser');
    }

    // Only prevent speech if we're in an error state AND this is not a user-initiated request
    if (this.isInErrorState && options.requireUserInteraction !== false) {
      console.log('🔊 Speech blocked - in error state, but allowing user-initiated requests');
      // Allow user-initiated requests even in error state
    } else if (this.isInErrorState) {
      console.log('🔊 Speech blocked - in error state');
      return Promise.resolve();
    }

    // Check if user interaction is required but not yet provided
    if (options.requireUserInteraction !== false && !this.hasUserInteracted) {
      console.log('🔊 User interaction required for speech synthesis, attempting to enable...');
      
      // Try to enable speech synthesis automatically
      this.enableSpeechSynthesis();
      
      // If still not enabled, queue the request and return gracefully
      if (!this.hasUserInteracted) {
        console.log('🔊 Queuing speech request until user interaction is detected');
        return new Promise((resolve) => {
          this.pendingSpeakRequests.push(() => {
            this.speak(text, { ...options, requireUserInteraction: false })
              .then(resolve)
              .catch(() => resolve()); // Gracefully handle any remaining errors
          });
          // Resolve immediately to prevent blocking the UI
          resolve();
        });
      }
    }

    // Stop current speech if interrupting
    if (options.interrupt !== false && this.isSpeaking) {
      this.stop();
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const voice = options.voice || this.getBestVoice();
        if (voice) {
          utterance.voice = voice;
        }

        // Set speech parameters
        utterance.rate = options.rate || 0.9; // Slightly slower for clarity
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;

        // Add timeout to prevent hanging (reduced from 30s to 10s)
        const timeout = setTimeout(() => {
          console.warn('🔊 Speech synthesis timeout - forcing completion');
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.synthesis?.cancel(); // Force cancel any pending speech
          resolve(); // Resolve instead of reject to prevent breaking the flow
        }, 10000); // 10 second timeout

        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
          this.currentUtterance = utterance;
          this.errorCount = 0; // Reset error count on successful start
          this.isInErrorState = false; // Reset error state on successful start
          console.log('🔊 Started speaking:', text);
        };

        utterance.onend = () => {
          clearTimeout(timeout);
          this.isSpeaking = false;
          this.currentUtterance = null;
          console.log('🔊 Finished speaking');
          resolve();
        };

        utterance.onerror = (event) => {
          clearTimeout(timeout);
          this.isSpeaking = false;
          this.currentUtterance = null;
          
          this.errorCount++;
          console.error('🔊 Speech synthesis error:', event.error, `(Error count: ${this.errorCount})`);
          
          // Prevent infinite recursion by limiting error count
          if (this.errorCount >= this.maxErrorCount) {
            console.warn('🔊 Too many speech synthesis errors, entering error state');
            this.isInErrorState = true;
            resolve();
            return;
          }
          
          // Handle specific error types gracefully - NO RETRIES to prevent recursion
          if (event.error === 'not-allowed') {
            console.log('🔊 Speech synthesis blocked - user interaction required');
            // Just queue the request if user hasn't interacted yet, no retries
            if (!this.hasUserInteracted && this.pendingSpeakRequests.length < 5) {
              this.pendingSpeakRequests.push(() => {
                this.speak(text, { ...options, requireUserInteraction: false })
                  .catch(() => {}); // Ignore errors on retry
              });
            }
            resolve(); // Always resolve to prevent breaking the flow
          } else if (event.error === 'audio-busy') {
            console.log('🔊 Audio system busy, giving up to prevent recursion');
            resolve(); // Don't retry to prevent recursion
          } else if (event.error === 'synthesis-failed') {
            console.log('🔊 Synthesis failed, but continuing...');
            resolve(); // Don't break the flow for synthesis failures
          } else if (event.error === 'language-unavailable') {
            console.log('🔊 Language unavailable, giving up to prevent recursion');
            resolve(); // Don't retry to prevent recursion
          } else {
            console.warn('🔊 Speech synthesis error, but continuing:', event.error);
            resolve(); // Always resolve to prevent breaking the flow
          }
        };

        // Additional event handlers for better debugging
        utterance.onpause = () => {
          console.log('🔊 Speech paused');
        };

        utterance.onresume = () => {
          console.log('🔊 Speech resumed');
        };

        utterance.onboundary = (event) => {
          console.log('🔊 Speech boundary:', event.name, event.charIndex);
        };

        // Ensure voices are loaded before speaking
        if (this.voices.length === 0) {
          console.log('🔊 No voices loaded, waiting for voices...');
          // Wait a bit for voices to load
          setTimeout(() => {
            this.loadVoices();
            if (this.voices.length > 0) {
              const voice = options.voice || this.getBestVoice();
              if (voice) {
                utterance.voice = voice;
              }
            }
            this.synthesis!.speak(utterance);
          }, 500);
        } else {
          // Speak the text immediately
          this.synthesis!.speak(utterance);
        }
      } catch (error) {
        console.error('🔊 Error creating speech utterance:', error);
        reject(error);
      }
    });
  }

  // Speak reminder with special formatting
  async speakReminder(reminderText: string, options: {
    repeat?: boolean;
    repeatCount?: number;
    delay?: number;
  } = {}): Promise<void> {
    const formattedText = `Reminder: ${reminderText}`;
    
    try {
      // Force enable speech synthesis for reminder alerts
      this.enableSpeechSynthesis();
      
      // Initial announcement - simplified approach
      await this.speak(formattedText, { 
        rate: 0.8, 
        pitch: 1.1,
        volume: 0.9,
        requireUserInteraction: false, // Allow reminders even without user interaction
        interrupt: true // Allow interrupting previous speech
      });

      // Repeat if requested
      if (options.repeat && options.repeatCount && options.repeatCount > 1) {
        const delay = options.delay || 0; // No delay between repeats for exact timing
        
        for (let i = 1; i < options.repeatCount; i++) {
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          await this.speak(formattedText, { 
            rate: 0.8, 
            pitch: 1.1,
            volume: 0.9,
            requireUserInteraction: false, // Allow reminders even without user interaction
            interrupt: true
          });
        }
      }
    } catch (error) {
      console.error('🔊 Error speaking reminder:', error);
      // Don't throw the error, just log it to prevent breaking the reminder flow
    }
  }

  // Stop current speech
  stop(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('🔊 Speech stopped');
    }
  }

  // Check if currently speaking
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  // Check if service is supported
  isServiceSupported(): boolean {
    return this.isSupported;
  }

  // Check if user has interacted (required for speech synthesis)
  hasUserInteractedWithPage(): boolean {
    return this.hasUserInteracted;
  }

  // Force enable speech synthesis (call this after user interaction)
  enableSpeechSynthesis(): void {
    // Prevent multiple simultaneous calls
    if (this.isEnablingSpeech) {
      console.log('🔊 Speech synthesis enable already in progress, skipping');
      return;
    }
    
    this.isEnablingSpeech = true;
    this.hasUserInteracted = true;
    this.errorCount = 0; // Reset error count when manually enabling
    this.isInErrorState = false; // Reset error state when manually enabling
    console.log('🔊 Speech synthesis manually enabled');
    
    // Process any pending speak requests safely
    this.processPendingRequests();
    
    // Also try to trigger a user interaction event to satisfy browser requirements
    if (typeof window !== 'undefined') {
      // Create a synthetic user interaction event
      const syntheticEvent = new Event('click', { bubbles: true });
      document.dispatchEvent(syntheticEvent);
      
      // Also try to trigger a focus event on the document
      document.dispatchEvent(new Event('focus', { bubbles: true }));
      
      // Try to focus the document body to satisfy browser requirements
      if (document.body) {
        document.body.focus();
      }
      
      // Try to create a small audio context to satisfy browser autoplay policies
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(() => {
            // Ignore errors, this is just to try to satisfy browser policies
          });
        }
      } catch (error) {
        // Ignore errors, this is just to try to satisfy browser policies
      }
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      this.isEnablingSpeech = false;
    }, 1000);
  }

  // Get available voices
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.voices];
  }

  // Get voice by name
  getVoiceByName(name: string): SpeechSynthesisVoice | null {
    return this.voices.find(voice => voice.name === name) || null;
  }

  // Test the service
  async test(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Text-to-Speech not supported');
    }

    console.log('🔊 Testing text-to-speech service...');
    console.log('🔊 Available voices:', this.voices.length);
    console.log('🔊 User interaction:', this.hasUserInteracted);
    console.log('🔊 Synthesis object:', !!this.synthesis);

    await this.speak('Text-to-Speech service is working correctly!', {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.7
    });
  }

  // Check if speech synthesis is ready
  isReady(): boolean {
    return this.isSupported && 
           this.synthesis !== null && 
           this.voices.length > 0 && 
           this.hasUserInteracted;
  }

  // Get service status
  getStatus(): {
    supported: boolean;
    voicesLoaded: boolean;
    userInteracted: boolean;
    ready: boolean;
    speaking: boolean;
  } {
    return {
      supported: this.isSupported,
      voicesLoaded: this.voices.length > 0,
      userInteracted: this.hasUserInteracted,
      ready: this.isReady(),
      speaking: this.isSpeaking
    };
  }

  // Debug method to log all available information
  debug(): void {
    console.log('🔊 Text-to-Speech Debug Information:');
    console.log('🔊 Supported:', this.isSupported);
    console.log('🔊 Synthesis object:', !!this.synthesis);
    console.log('🔊 Voices loaded:', this.voices.length);
    console.log('🔊 User interacted:', this.hasUserInteracted);
    console.log('🔊 Currently speaking:', this.isSpeaking);
    console.log('🔊 Ready:', this.isReady());
    console.log('🔊 Available voices:', this.voices.map(v => `${v.name} (${v.lang})`));
    console.log('🔊 Best voice:', this.getBestVoice()?.name || 'None');
    console.log('🔊 Pending requests:', this.pendingSpeakRequests.length);
  }
}

// Create singleton instance
const textToSpeechService = new TextToSpeechService();

export default textToSpeechService;
