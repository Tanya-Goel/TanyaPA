import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Send, Clock, CheckCircle, Mic, MicOff, Square, Volume2, VolumeX } from 'lucide-react';
import { parseTimeExpression } from '@/utils/timeParser';
import { useRemindersContext } from '@/contexts/RemindersContext';
import { toast } from '@/hooks/use-toast';
import textToSpeechService from '@/services/textToSpeechService';
import { checkSpeechRecognitionSupport, requestMicrophonePermission, getSpeechRecognitionErrorMessage, createSpeechRecognition } from '@/utils/speechRecognitionUtils';

export const ReminderInput = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { addReminder } = useRemindersContext();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const support = checkSpeechRecognitionSupport();
    setIsSupported(support.isSupported);

    if (support.isSupported && !support.requiresHTTPS) {
      const recognition = createSpeechRecognition();
      if (recognition) {
        recognition.onstart = () => {
          setIsListening(true);
          console.log('🎤 Speech recognition started for reminders');
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
            console.log('🎤 Final transcript for reminder:', finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('🎤 Speech recognition error:', event.error);
          setIsListening(false);
          const errorMessage = getSpeechRecognitionErrorMessage(event.error);
          toast({
            title: "Voice Recognition Error",
            description: errorMessage,
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
          console.log('🎤 Speech recognition ended for reminders');
        };

        recognitionRef.current = recognition;
      }
    } else if (support.requiresHTTPS) {
      console.log('🎤 Speech recognition requires HTTPS');
      toast({
        title: "HTTPS Required",
        description: support.errorMessage || 'Speech recognition requires HTTPS. Please use the HTTPS development server.',
        variant: "destructive",
        duration: 10000,
      });
    } else if (!support.isSupported) {
      console.log('🎤 Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Request microphone permission first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access to use voice recognition.",
            variant: "destructive",
          });
          return;
        }
        
        recognitionRef.current.start();
        console.log('🎤 Starting voice recognition for reminders');
      } catch (error) {
        console.error('🎤 Error starting speech recognition:', error);
        let errorMessage = "Could not start voice recognition. Please try again.";
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = "Microphone permission denied. Please allow microphone access.";
          } else if (error.name === 'NotFoundError') {
            errorMessage = "No microphone found. Please check your microphone.";
          } else if (error.name === 'NotSupportedError') {
            errorMessage = "Speech recognition not supported. Please use HTTPS.";
          }
        }
        
        toast({
          title: "Voice Recognition Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      console.log('🎤 Stopping voice recognition for reminders');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    
    // Parse the time from the input
    const parsedTime = parseTimeExpression(input);
    
    if (parsedTime) {
      // Check for repeat count in the input
      const repeatMatch = input.match(/(\d+)\s*times?/i);
      const detectedRepeatCount = repeatMatch ? parseInt(repeatMatch[1]) : repeatCount;
      
      // Extract the reminder text (remove time expressions and repeat count)
      const reminderText = input
        .replace(/in (\d+) ?(minutes?|mins?|hours?|hrs?|days?|weeks?|seconds?|secs?)/i, '')
        .replace(/at (\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i, '')
        .replace(/tomorrow at (\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i, '')
        .replace(/on (\w+) (\d{1,2})(?:st|nd|rd|th)?(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s?(am|pm)?)?/i, '')
        .replace(/on (\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s?(am|pm)?)?/i, '')
        .replace(/(next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s?(am|pm)?)?/i, '')
        .replace(/tomorrow/i, '')
        .replace(/(later today|later)/i, '')
        .replace(/(right )?now/i, '')
        .replace(/to /i, '')
        .replace(/remind me/i, '')
        .replace(/(\d+)\s*times?/i, '')
        .trim();

      // Add reminder with voice settings
      const reminder = await addReminder(reminderText || input, parsedTime, 'medium', {
        voiceEnabled: voiceEnabled,
        repeatCount: detectedRepeatCount
      });
      setInput('');
      
      // Show success feedback with voice confirmation
      const repeatMessage = detectedRepeatCount > 1 ? ` and repeat ${detectedRepeatCount} times` : '';
      const confirmationMessage = `Got it! I'll remind you at ${parsedTime.toLocaleString()}${repeatMessage}`;
      
      setTimeout(() => {
        toast({
          title: "Got it!",
          description: confirmationMessage,
          duration: 3000,
        });

        // Voice confirmation disabled - reminders are created silently
      }, 500);
    } else {
      toast({
        title: "I need more details",
        description: "Could you specify when you'd like to be reminded? (e.g., 'in 30 minutes', 'at 3pm', 'tomorrow')",
        variant: "destructive",
        duration: 5000,
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <Card className="w-full bg-gradient-electric/10 border-accent-electric/20 hover:border-accent-electric/40">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-electric shadow-soft animate-pulse-slow">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">Set Smart Reminder</h3>
            <p className="text-sm text-muted-foreground">
              I understand natural language - just tell me when to remind you
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Remind me to call mom in 30 minutes' or 'Check the oven at 6pm tomorrow 3 times'"
            className="border-accent-electric/30 focus:border-accent-electric focus:ring-accent-electric/50 bg-white/50 backdrop-blur-sm"
            disabled={isProcessing || isListening}
          />

          {/* Voice Controls */}
          {isSupported && (
            <div className="flex items-center gap-2 p-3 bg-white/30 rounded-lg border border-accent-electric/20">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stopListening}
                    className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startListening}
                    disabled={isProcessing}
                    className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Voice
                  </Button>
                )}
              </div>
              <div className="flex-1 text-xs text-muted-foreground">
                {isListening ? (
                  <span className="flex items-center gap-1 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Listening... Speak your reminder now
                  </span>
                ) : (
                  <span>Click to record your reminder with voice</span>
                )}
              </div>
            </div>
          )}

          {!isSupported && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-700 flex items-center gap-2">
                <MicOff className="h-4 w-4" />
                Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
              </p>
            </div>
          )}

          {/* Voice Settings */}
          <div className="space-y-3 p-3 bg-white/30 rounded-lg border border-accent-electric/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-enabled" className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Voice Notifications
              </Label>
              <Switch
                id="voice-enabled"
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
                disabled={!textToSpeechService.isServiceSupported()}
              />
            </div>
            
            {voiceEnabled && textToSpeechService.isServiceSupported() && (
              <div className="space-y-2">
                <Label htmlFor="repeat-count" className="text-xs text-muted-foreground">
                  Repeat Count: {repeatCount}
                </Label>
                <input
                  id="repeat-count"
                  type="range"
                  min="1"
                  max="5"
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1x</span>
                  <span>5x</span>
                </div>
              </div>
            )}

            {!textToSpeechService.isServiceSupported() && (
              <p className="text-xs text-yellow-700 flex items-center gap-2">
                <VolumeX className="h-4 w-4" />
                Text-to-speech not supported in this browser
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            variant="electric"
            className="w-full" 
            disabled={!input.trim() || isProcessing || isListening}
          >
            {isProcessing ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                Setting Reminder...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Set Reminder
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};