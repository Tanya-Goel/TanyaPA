import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Mic } from 'lucide-react';
import textToSpeechService from '@/services/textToSpeechService';
import { toast } from '@/hooks/use-toast';

export const VoiceTest: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const testSpeech = async () => {
    try {
      setIsSpeaking(true);
      await textToSpeechService.speak('Hello! This is a test of the text-to-speech service.', {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
      });
      setIsSpeaking(false);
      toast({
        title: "Speech Test",
        description: "Text-to-speech test completed successfully!",
        duration: 3000,
      });
    } catch (error) {
      setIsSpeaking(false);
      console.error('Speech test error:', error);
      toast({
        title: "Speech Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    }
  };

  const testReminder = async () => {
    try {
      setIsSpeaking(true);
      await textToSpeechService.speakReminder('This is a test reminder message', {
        repeat: true,
        repeatCount: 2,
        delay: 2000
      });
      setIsSpeaking(false);
      toast({
        title: "Reminder Test",
        description: "Reminder speech test completed successfully!",
        duration: 3000,
      });
    } catch (error) {
      setIsSpeaking(false);
      console.error('Reminder test error:', error);
      toast({
        title: "Reminder Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    }
  };

  const stopSpeech = () => {
    textToSpeechService.stop();
    setIsSpeaking(false);
  };

  const enableSpeech = () => {
    textToSpeechService.enableSpeechSynthesis();
    setHasInteracted(true);
    toast({
      title: "Voice Enabled",
      description: "Speech synthesis has been enabled!",
      duration: 3000,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Status: {textToSpeechService.isServiceSupported() ? '✅ Supported' : '❌ Not Supported'}</p>
          <p>User Interaction: {textToSpeechService.hasUserInteractedWithPage() ? '✅ Enabled' : '❌ Required'}</p>
          <p>Currently Speaking: {isSpeaking ? '🔊 Yes' : '🔇 No'}</p>
        </div>

        {!textToSpeechService.hasUserInteractedWithPage() && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              Click "Enable Voice" to allow speech synthesis
            </p>
          </div>
        )}

        <div className="space-y-2">
          {!textToSpeechService.hasUserInteractedWithPage() ? (
            <Button onClick={enableSpeech} className="w-full">
              Enable Voice
            </Button>
          ) : (
            <>
              <Button 
                onClick={testSpeech} 
                disabled={isSpeaking}
                className="w-full"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Test Speech
              </Button>
              
              <Button 
                onClick={testReminder} 
                disabled={isSpeaking}
                variant="outline"
                className="w-full"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Test Reminder
              </Button>
              
              {isSpeaking && (
                <Button 
                  onClick={stopSpeech} 
                  variant="destructive"
                  className="w-full"
                >
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop Speaking
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
