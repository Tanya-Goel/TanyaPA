import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Clock, 
  CheckCircle, 
  RotateCcw,
  X,
  AlertCircle
} from 'lucide-react';
import { Reminder } from '@/types/reminder';
import textToSpeechService from '@/services/textToSpeechService';
import voiceCommandService from '@/services/voiceCommandService';
import { toast } from '@/hooks/use-toast';

interface VoiceReminderNotificationProps {
  reminder: Reminder;
  onSnooze: (reminderId: string, minutes: number) => void;
  onDismiss: (reminderId: string) => void;
  onRepeat: (reminderId: string) => void;
  onSetRepeat: (reminderId: string, repeatCount: number) => void;
  autoStart?: boolean;
  repeatCount?: number;
  showVoiceControls?: boolean;
}

export const VoiceReminderNotification: React.FC<VoiceReminderNotificationProps> = ({
  reminder,
  onSnooze,
  onDismiss,
  onRepeat,
  onSetRepeat,
  autoStart = true,
  repeatCount = 1,
  showVoiceControls = true
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [repeatCountdown, setRepeatCountdown] = useState(repeatCount);
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const repeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start speaking when component mounts
  useEffect(() => {
    if (autoStart && speechEnabled && isVisible) {
      // Force enable speech synthesis for reminder notifications
      textToSpeechService.enableSpeechSynthesis();
      startSpeaking();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (repeatTimeoutRef.current) clearTimeout(repeatTimeoutRef.current);
      textToSpeechService.stop();
    };
  }, [autoStart, speechEnabled, isVisible]);

  // Handle voice commands
  useEffect(() => {
    if (!showVoiceControls || !voiceCommandService.isServiceSupported()) return;

    if (isListening) {
      voiceCommandService.startListening(handleVoiceCommandReceived).then((success) => {
        if (!success) {
          console.error('🎤 Failed to start voice command listening');
        }
      });
    }

    return () => {
      voiceCommandService.stopListening();
    };
  }, [isListening, showVoiceControls]);

  const startSpeaking = async () => {
    if (!speechEnabled || isSpeaking) return;

    try {
      setIsSpeaking(true);
      
      // Force enable speech synthesis for reminder notifications
      textToSpeechService.enableSpeechSynthesis();
      
      // Try to speak even if user hasn't interacted yet
      await textToSpeechService.speakReminder(reminder.text, {
        repeat: repeatCount > 1,
        repeatCount: repeatCount,
        delay: 3000
      });
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error speaking reminder:', error);
      setIsSpeaking(false);
      
      // Show user-friendly error message only if it's not a user interaction issue
      if (error instanceof Error && error.message.includes('user interaction')) {
        // Don't show error toast for user interaction issues, just log it
        console.log('Voice reminder blocked - user interaction required');
      } else {
        toast({
          title: "Voice Error",
          description: "Unable to speak reminder. Please try again.",
          duration: 3000,
        });
      }
    }
  };

  const stopSpeaking = () => {
    textToSpeechService.stop();
    setIsSpeaking(false);
  };

  const handleSnooze = (minutes: number) => {
    onSnooze(reminder.id, minutes);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    onDismiss(reminder.id);
    setIsVisible(false);
  };

  const handleVoiceDismiss = async () => {
    try {
      // Call backend API to dismiss reminder via voice
      const response = await fetch(`http://localhost:3000/api/reminders/${reminder.id}/dismiss`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: 'voice' }),
      });

      if (response.ok) {
        console.log('✅ Reminder dismissed via voice command');
        onDismiss(reminder.id);
        setIsVisible(false);
      } else {
        console.error('❌ Failed to dismiss reminder via voice');
        // Fallback to local dismissal
        onDismiss(reminder.id);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('❌ Error dismissing reminder via voice:', error);
      // Fallback to local dismissal
      onDismiss(reminder.id);
      setIsVisible(false);
    }
  };

  const handleRepeat = () => {
    onRepeat(reminder.id);
    startSpeaking();
  };

  const handleSetRepeat = (newRepeatCount: number) => {
    onSetRepeat(reminder.id, newRepeatCount);
    setRepeatCountdown(newRepeatCount);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      setSpeechEnabled(!speechEnabled);
      if (!speechEnabled) {
        startSpeaking();
      }
    }
  };

  const handleVoiceCommandReceived = (command: any) => {
    console.log('🎤 Voice command received:', command);
    
    switch (command.type) {
      case 'dismiss':
        toast({
          title: "Reminder Dismissed",
          description: "Voice command: Dismiss",
          duration: 2000,
        });
        handleDismiss();
        break;
        
      case 'snooze':
        if (command.duration) {
          toast({
            title: "Reminder Snoozed",
            description: `Voice command: Snooze for ${command.duration} minutes`,
            duration: 2000,
          });
          onSnooze(reminder.id, command.duration);
        }
        break;
        
      case 'repeat':
        toast({
          title: "Repeating Reminder",
          description: "Voice command: Repeat",
          duration: 2000,
        });
        onRepeat(reminder.id);
        break;
        
      case 'set_repeat':
        if (command.repeatCount) {
          toast({
            title: "Repeat Count Set",
            description: `Voice command: Repeat ${command.repeatCount} times`,
            duration: 2000,
          });
          onSetRepeat(reminder.id, command.repeatCount);
        }
        break;
        
      case 'stop':
        if (isSpeaking) {
          textToSpeechService.stop();
          setIsSpeaking(false);
          toast({
            title: "Speech Stopped",
            description: "Voice command: Stop speaking",
            duration: 2000,
          });
        }
        break;
        
      default:
        toast({
          title: "Command Not Recognized",
          description: "Try saying 'dismiss', 'snooze for X minutes', or 'repeat'",
          duration: 3000,
        });
    }
  };

  const toggleVoiceCommands = () => {
    if (isListening) {
      voiceCommandService.stopListening();
      setIsListening(false);
    } else {
      if (voiceCommandService.startListening(handleVoiceCommandReceived)) {
        setIsListening(true);
        toast({
          title: "Voice Commands Active",
          description: "Say 'okay done', 'snooze for X minutes', or 'repeat'",
          duration: 3000,
        });
      }
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Reminder Alert</h3>
              <p className="text-sm text-red-700">
                {new Date(reminder.dueTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 mb-2">
            {reminder.text}
          </p>
          {isSpeaking && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Speaking reminder...
            </div>
          )}
        </div>

        {/* Voice Controls */}
        <div className="space-y-3">
          {/* Speech Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={speechEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleSpeech}
              className="flex-1"
              disabled={!textToSpeechService.hasUserInteractedWithPage() && !isSpeaking}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop Speaking
                </>
              ) : !textToSpeechService.hasUserInteractedWithPage() ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Click Page First
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  {speechEnabled ? 'Speak Again' : 'Enable Voice'}
                </>
              )}
            </Button>
          </div>

          {/* Voice Commands */}
          {showVoiceControls && voiceCommandService.isServiceSupported() && (
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? "default" : "outline"}
                size="sm"
                onClick={toggleVoiceCommands}
                className="flex-1"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Commands
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSnooze(10)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Snooze 10m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSnooze(30)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Snooze 30m
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRepeat}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Repeat
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDismiss}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </div>

        {/* Voice Command Hints */}
        {isListening && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">
              Voice Commands Available:
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• "Snooze for 10 minutes"</p>
              <p>• "Dismiss" or "Done"</p>
              <p>• "Repeat" or "Say again"</p>
              <p>• "Repeat this 3 times"</p>
              <p>• "Remind me 5 times"</p>
              <p>• "Stop speaking"</p>
            </div>
          </div>
        )}

        {/* User Interaction Notice */}
        {!textToSpeechService.hasUserInteractedWithPage() && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium">
              💡 Click anywhere on the page to enable voice features
            </p>
          </div>
        )}

        {/* Status Badges */}
        <div className="flex items-center gap-2 mt-4">
          {isSpeaking && (
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              Speaking
            </Badge>
          )}
          {isListening && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Listening
            </Badge>
          )}
          {!speechEnabled && (
            <Badge variant="outline" className="text-gray-600">
              Voice Disabled
            </Badge>
          )}
          {!textToSpeechService.hasUserInteractedWithPage() && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              Interaction Required
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
