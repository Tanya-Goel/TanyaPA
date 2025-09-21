import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  Mic, 
  TestTube, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import textToSpeechService from '@/services/textToSpeechService';
import voiceCommandService from '@/services/voiceCommandService';
import { toast } from '@/hooks/use-toast';

export const VoiceReminderTest: React.FC = () => {
  const [testText, setTestText] = useState('Take your medicine');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [testResults, setTestResults] = useState<{
    textToSpeech: boolean;
    voiceCommands: boolean;
    browserSupport: boolean;
  }>({
    textToSpeech: false,
    voiceCommands: false,
    browserSupport: false
  });

  // Test text-to-speech
  const testTextToSpeech = async () => {
    try {
      setIsSpeaking(true);
      await textToSpeechService.speak(testText, {
        rate: 0.9,
        volume: 0.8
      });
      setTestResults(prev => ({ ...prev, textToSpeech: true }));
      toast({
        title: "Text-to-Speech Test",
        description: "Voice test completed successfully!",
      });
    } catch (error) {
      console.error('TTS Test failed:', error);
      setTestResults(prev => ({ ...prev, textToSpeech: false }));
      toast({
        title: "Text-to-Speech Test Failed",
        description: "Could not play voice. Check browser permissions.",
        variant: "destructive",
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  // Test voice commands
  const testVoiceCommands = async () => {
    try {
      setIsListening(true);
      await voiceCommandService.test();
      setTestResults(prev => ({ ...prev, voiceCommands: true }));
      toast({
        title: "Voice Commands Test",
        description: "Voice commands are working!",
      });
    } catch (error) {
      console.error('Voice Commands Test failed:', error);
      setTestResults(prev => ({ ...prev, voiceCommands: false }));
      toast({
        title: "Voice Commands Test Failed",
        description: "Could not recognize voice commands.",
        variant: "destructive",
      });
    } finally {
      setIsListening(false);
    }
  };

  // Test reminder with repeat
  const testReminderWithRepeat = async () => {
    try {
      setIsSpeaking(true);
      await textToSpeechService.speakReminder(testText, {
        repeat: true,
        repeatCount: 3,
        delay: 2000
      });
      toast({
        title: "Reminder Test",
        description: "Reminder with repeat completed!",
      });
    } catch (error) {
      console.error('Reminder Test failed:', error);
      toast({
        title: "Reminder Test Failed",
        description: "Could not play reminder with repeat.",
        variant: "destructive",
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  // Check browser support
  const checkBrowserSupport = () => {
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    setTestResults(prev => ({ 
      ...prev, 
      browserSupport: hasSpeechSynthesis && hasSpeechRecognition 
    }));

    toast({
      title: "Browser Support Check",
      description: `Speech Synthesis: ${hasSpeechSynthesis ? '✅' : '❌'}, Speech Recognition: ${hasSpeechRecognition ? '✅' : '❌'}`,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-500" />
          Voice Reminder Test Center
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Browser Support Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${testResults.browserSupport ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Browser Support</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${testResults.textToSpeech ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Text-to-Speech</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${testResults.voiceCommands ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Voice Commands</span>
          </div>
        </div>

        {/* Test Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Text:</label>
          <Input
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test voice..."
            className="w-full"
          />
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={checkBrowserSupport}
            variant="outline"
            className="w-full"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Check Browser Support
          </Button>
          
          <Button
            onClick={testTextToSpeech}
            disabled={isSpeaking}
            className="w-full"
          >
            {isSpeaking ? (
              <>
                <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                Speaking...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Test Voice
              </>
            )}
          </Button>
        </div>

        {/* Enable Voice Button */}
        {!textToSpeechService.hasUserInteractedWithPage() && (
          <Button
            onClick={() => {
              textToSpeechService.enableSpeechSynthesis();
              toast({
                title: "Voice Enabled",
                description: "Speech synthesis has been manually enabled!",
                duration: 3000,
              });
            }}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Enable Voice Features
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={testVoiceCommands}
            disabled={isListening}
            variant="outline"
            className="w-full"
          >
            {isListening ? (
              <>
                <Mic className="h-4 w-4 mr-2 animate-pulse" />
                Listening...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Test Voice Commands
              </>
            )}
          </Button>
          
          <Button
            onClick={testReminderWithRepeat}
            disabled={isSpeaking}
            className="w-full"
          >
            {isSpeaking ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-pulse" />
                Testing...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Test Reminder (3x)
              </>
            )}
          </Button>
        </div>

        {/* Debug Button */}
        <Button
          onClick={() => {
            textToSpeechService.debug();
            toast({
              title: "Debug Info",
              description: "Check console for detailed debug information",
              duration: 3000,
            });
          }}
          variant="outline"
          className="w-full"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Debug Voice Service
        </Button>

        {/* Service Status */}
        <div className="space-y-3">
          <h4 className="font-medium">Service Status:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Text-to-Speech Service</span>
              <Badge variant={textToSpeechService.isServiceSupported() ? "default" : "destructive"}>
                {textToSpeechService.isServiceSupported() ? "Supported" : "Not Supported"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Voices Loaded</span>
              <Badge variant={textToSpeechService.getStatus().voicesLoaded ? "default" : "destructive"}>
                {textToSpeechService.getStatus().voicesLoaded ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">User Interaction</span>
              <Badge variant={textToSpeechService.getStatus().userInteracted ? "default" : "destructive"}>
                {textToSpeechService.getStatus().userInteracted ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Service Ready</span>
              <Badge variant={textToSpeechService.getStatus().ready ? "default" : "destructive"}>
                {textToSpeechService.getStatus().ready ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Voice Commands Service</span>
              <Badge variant={voiceCommandService.isServiceSupported() ? "default" : "destructive"}>
                {voiceCommandService.isServiceSupported() ? "Supported" : "Not Supported"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Currently Speaking</span>
              <Badge variant={textToSpeechService.isCurrentlySpeaking() ? "default" : "secondary"}>
                {textToSpeechService.isCurrentlySpeaking() ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Voice Command Examples */}
        <div className="space-y-3">
          <h4 className="font-medium">Voice Command Examples:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-blue-50 rounded border">
              <strong>Test Voice:</strong> "Test voice"
            </div>
            <div className="p-2 bg-blue-50 rounded border">
              <strong>Repeat:</strong> "Repeat this 3 times"
            </div>
            <div className="p-2 bg-blue-50 rounded border">
              <strong>Snooze:</strong> "Snooze for 10 minutes"
            </div>
            <div className="p-2 bg-blue-50 rounded border">
              <strong>Dismiss:</strong> "Dismiss"
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
