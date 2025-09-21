import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLogsContext } from '@/contexts/LogsContext';
import { BookOpen, Send, CheckCircle, Mic, MicOff, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { checkSpeechRecognitionSupport, requestMicrophonePermission, getSpeechRecognitionErrorMessage, createSpeechRecognition } from '@/utils/speechRecognitionUtils';

export const LogInput = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { addLog } = useLogsContext();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const parseLogInput = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract time if mentioned
    const timePattern = /(?:at\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const timeMatch = text.match(timePattern);
    
    // Determine category based on keywords
    let category: 'activity' | 'meal' | 'work' | 'personal' | 'health' | 'other' = 'activity';
    
    if (lowerText.includes('ate') || lowerText.includes('meal') || lowerText.includes('lunch') || 
        lowerText.includes('dinner') || lowerText.includes('breakfast') || lowerText.includes('food')) {
      category = 'meal';
    } else if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project')) {
      category = 'work';
    } else if (lowerText.includes('exercise') || lowerText.includes('workout') || lowerText.includes('run') || 
               lowerText.includes('gym') || lowerText.includes('health')) {
      category = 'health';
    } else if (lowerText.includes('family') || lowerText.includes('friend') || lowerText.includes('personal')) {
      category = 'personal';
    }

    // Clean up the text - remove "log that" if present
    let cleanText = text
      .replace(/^(log\s+that\s+|logged\s+that\s+)/i, '')
      .replace(/^(i\s+)/i, '') // Remove "i " prefix instead of replacing with "I "
      .trim();

    // Capitalize first letter
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);

    return { text: cleanText, category };
  };

  // Initialize speech recognition
  useEffect(() => {
    const support = checkSpeechRecognitionSupport();
    setIsSupported(support.isSupported);

    if (support.isSupported && !support.requiresHTTPS) {
      const recognition = createSpeechRecognition();
      if (recognition) {
        recognition.onstart = () => {
          setIsListening(true);
          console.log('🎤 Speech recognition started');
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
            console.log('🎤 Final transcript:', finalTranscript);
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
          console.log('🎤 Speech recognition ended');
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
        console.log('🎤 Starting voice recognition for logs');
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    
    try {
      const { text, category } = parseLogInput(input);
      await addLog(text, category);
      setInput('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not log the activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full bg-gradient-coral/10 border-accent-coral/20 hover:border-accent-coral/40">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-coral shadow-soft animate-glow">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">Log Daily Activity</h3>
            <p className="text-sm text-muted-foreground">
              Tell me what you did and I'll categorize and log it for you
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Log that I woke up at 7:30 am' or 'I had breakfast at 8am' or 'Finished the project meeting'"
            className="min-h-[100px] resize-none border-accent-coral/30 focus:border-accent-coral focus:ring-accent-coral/50 bg-white/50 backdrop-blur-sm"
            disabled={isProcessing}
          />
          
          {/* Voice Controls */}
          {isSupported && (
            <div className="flex items-center gap-2 p-3 bg-white/30 rounded-lg border border-accent-coral/20">
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
                    Listening... Speak now
                  </span>
                ) : (
                  <span>Click to record your voice</span>
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
          
          <Button 
            type="submit" 
            variant="coral"
            className="w-full" 
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                Logging...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Log Activity
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};