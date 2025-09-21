import React, { useState, useEffect } from 'react';
import { useRemindersContext } from '@/contexts/RemindersContext';
import { ReminderCard } from './ReminderCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle, Bell, RefreshCw, BellOff, TestTube } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import pushNotificationService from '@/services/pushNotificationService';

export const RemindersFolder = () => {
  const { reminders, loading, deleting, deleteReminder, toggleComplete, getPendingReminders, getTodayReminders, fetchReminders } = useRemindersContext();
  
  // Push notification state
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  // Check push notification status on mount and fetch reminders
  useEffect(() => {
    const checkPushStatus = async () => {
      const supported = pushNotificationService.isSupported();
      setIsPushSupported(supported);
      
      if (supported) {
        const hasPermission = await pushNotificationService.hasPermission();
        const subscription = pushNotificationService.getSubscription();
        setIsPushEnabled(hasPermission && !!subscription);
      }
    };
    
    checkPushStatus();
    
    // Manually fetch reminders on component mount
    console.log('🔔 RemindersFolder - Manually fetching reminders...');
    fetchReminders();
  }, [fetchReminders]);

  // Enable push notifications
  const enablePushNotifications = async () => {
    setIsPushLoading(true);
    try {
      const success = await pushNotificationService.requestPermissionAndSubscribe();
      
      if (success) {
        setIsPushEnabled(true);
        toast({
          title: "Push Notifications Enabled",
          description: "You'll now receive reminders even when the app is closed!",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications were not enabled. Please check your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPushLoading(false);
    }
  };

  // Test push notification
  const testPushNotification = async () => {
    try {
      await pushNotificationService.showLocalNotification('Test Notification', {
        body: 'This is a test notification from Tanya\'s PA',
        tag: 'test-notification'
      });
      
      toast({
        title: "Test Notification Sent",
        description: "Check your notifications to see the test message.",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  // Reminders are automatically loaded when the app starts
  
  const pendingReminders = getPendingReminders();
  const todayReminders = getTodayReminders();
  const completedReminders = reminders.filter(r => r.isCompleted);
  
  // Debug logging
  console.log('🔔 RemindersFolder - Total reminders:', reminders.length);
  console.log('🔔 RemindersFolder - Pending:', pendingReminders.length);
  console.log('🔔 RemindersFolder - Today:', todayReminders.length);
  console.log('🔔 RemindersFolder - Completed:', completedReminders.length);
  console.log('🔔 RemindersFolder - Loading state:', loading);
  console.log('🔔 RemindersFolder - All reminders:', reminders);
  console.log('🔔 RemindersFolder - Pending reminders:', pendingReminders);
  console.log('🔔 RemindersFolder - Today reminders:', todayReminders);
  if (reminders.length > 0) {
    console.log('🔔 RemindersFolder - First reminder:', reminders[0]);
  } else {
    console.log('🔔 RemindersFolder - NO REMINDERS FOUND!');
  }
  
  const EmptyState = ({ icon: Icon, title, description }: { 
    icon: any, 
    title: string, 
    description: string 
  }) => (
    <Card className="p-8 text-center bg-muted/30 border-dashed">
      <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );

  return (
    <Card className="w-full bg-gradient-purple/10 border-accent-purple/20 hover:border-accent-purple/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-purple shadow-soft animate-glow">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Reminders Folder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Smart notifications and scheduled alerts {isPushEnabled && "• Push notifications enabled"}
              </p>
            </div>
          </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-gradient-purple/20 text-accent-purple border-accent-purple/30">
                      {reminders.length} total reminders
                    </Badge>
                    
                    {/* Push Notification Status */}
                    {isPushSupported && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${isPushEnabled 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {isPushEnabled ? (
                          <>
                            <Bell className="h-3 w-3 mr-1" />
                            Push Enabled
                          </>
                        ) : (
                          <>
                            <BellOff className="h-3 w-3 mr-1" />
                            Push Disabled
                          </>
                        )}
                      </Badge>
                    )}
                    
                    {/* Refresh Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('🔔 Manual refresh triggered');
                        fetchReminders();
                      }}
                      disabled={loading}
                      className="text-xs px-2 py-1 h-6"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </>
                      )}
                    </Button>
                    
                    {/* Push Notification Controls */}
                    {isPushSupported && !isPushEnabled && (
                      <Button
                        onClick={enablePushNotifications}
                        disabled={isPushLoading}
                        size="sm"
                        className="bg-gradient-purple hover:bg-gradient-purple/90 text-white text-xs px-2 py-1 h-6"
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        {isPushLoading ? 'Enabling...' : 'Enable Push'}
                      </Button>
                    )}
                    
                    {isPushSupported && isPushEnabled && (
                      <Button
                        onClick={testPushNotification}
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-6"
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    )}
                    
                    <button
                      onClick={() => {
                        console.log('🔔 Manual refresh clicked!');
                        fetchReminders();
                      }}
                      disabled={loading}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Refresh reminders from backend"
                    >
                      <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingReminders.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 text-xs">
                  {pendingReminders.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today
              {todayReminders.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 text-xs">
                  {todayReminders.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
              {completedReminders.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 text-xs">
                  {completedReminders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                <p>Loading reminders...</p>
              </div>
            ) : pendingReminders.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No pending reminders"
                description="All caught up! Add a new reminder above to get started."
              />
            ) : (
              pendingReminders
                .sort((a, b) => a.dueTime.getTime() - b.dueTime.getTime())
                .map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={toggleComplete}
                    onDelete={deleteReminder}
                    deleting={deleting}
                  />
                ))
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                <p>Loading reminders...</p>
              </div>
            ) : todayReminders.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nothing for today"
                description="Your day is free! Set reminders for later tasks."
              />
            ) : (
              todayReminders
                .sort((a, b) => a.dueTime.getTime() - b.dueTime.getTime())
                .map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={toggleComplete}
                    onDelete={deleteReminder}
                    deleting={deleting}
                  />
                ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                <p>Loading reminders...</p>
              </div>
            ) : completedReminders.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No completed reminders"
                description="Completed reminders will appear here."
              />
            ) : (
              completedReminders
                .sort((a, b) => b.dueTime.getTime() - a.dueTime.getTime())
                .map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={toggleComplete}
                    onDelete={deleteReminder}
                    deleting={deleting}
                  />
                ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};