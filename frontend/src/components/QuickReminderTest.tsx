import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRemindersContext } from '@/contexts/RemindersContext';
import { toast } from '@/hooks/use-toast';
import { Clock, Volume2 } from 'lucide-react';

export const QuickReminderTest: React.FC = () => {
  const { addReminder } = useRemindersContext();
  const [isCreating, setIsCreating] = useState(false);

  const createTestReminder = async () => {
    setIsCreating(true);
    try {
      // Create a reminder for 1 minute from now
      const dueTime = new Date();
      dueTime.setMinutes(dueTime.getMinutes() + 1);
      
      await addReminder(
        'Test reminder - take your medicine',
        dueTime,
        'medium',
        {
          voiceEnabled: true,
          repeatCount: 3
        }
      );
      
      toast({
        title: "Test Reminder Created",
        description: `Reminder will trigger in 1 minute and repeat 3 times`,
      });
    } catch (error) {
      console.error('Error creating test reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create test reminder",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createImmediateTestReminder = async () => {
    setIsCreating(true);
    try {
      // Create a reminder for 10 seconds from now
      const dueTime = new Date();
      dueTime.setSeconds(dueTime.getSeconds() + 10);
      
      await addReminder(
        'Immediate test reminder',
        dueTime,
        'medium',
        {
          voiceEnabled: true,
          repeatCount: 2
        }
      );
      
      toast({
        title: "Immediate Test Reminder Created",
        description: `Reminder will trigger in 10 seconds and repeat 2 times`,
      });
    } catch (error) {
      console.error('Error creating immediate test reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create immediate test reminder",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-500" />
          Quick Reminder Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Create test reminders to verify voice functionality
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={createImmediateTestReminder}
            disabled={isCreating}
            className="w-full"
            variant="default"
          >
            {isCreating ? (
              <>
                <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Test in 10 seconds (2x repeat)
              </>
            )}
          </Button>
          
          <Button
            onClick={createTestReminder}
            disabled={isCreating}
            className="w-full"
            variant="outline"
          >
            {isCreating ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Test in 1 minute (3x repeat)
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Make sure your device volume is up</p>
          <p>• Allow microphone permissions if prompted</p>
          <p>• Use Chrome, Edge, or Safari for best support</p>
        </div>
      </CardContent>
    </Card>
  );
};
