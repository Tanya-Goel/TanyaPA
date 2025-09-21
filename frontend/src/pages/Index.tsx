import { ReminderInput } from '@/components/ReminderInput';
import { RemindersFolder } from '@/components/RemindersFolder';
import { LogInput } from '@/components/LogInput';
import { DailyLogsFolder } from '@/components/DailyLogsFolder';
import { VoiceReminderManager } from '@/components/VoiceReminderManager';
import { VoiceReminderTest } from '@/components/VoiceReminderTest';
import { QuickReminderTest } from '@/components/QuickReminderTest';
import { LogsProvider } from '@/contexts/LogsContext';
import { RemindersProvider } from '@/contexts/RemindersContext';
import { Bell, Sparkles, Bot } from 'lucide-react';

const Index = () => {
  return (
    <LogsProvider>
      <RemindersProvider>
        <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-primary shadow-glow animate-float">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Personal AI Assistant
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your intelligent companion for daily logs and reminders. I understand natural language and help you stay organized.
            </p>
          </header>

          {/* Main Content */}
          <main className="space-y-12">
            <div className="grid lg:grid-cols-2 gap-8">
              <LogInput />
              <ReminderInput />
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <DailyLogsFolder />
              <RemindersFolder />
            </div>
            <div className="grid lg:grid-cols-1 gap-8">
              <VoiceReminderManager />
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <VoiceReminderTest />
              <QuickReminderTest />
            </div>
          </main>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-base font-semibold text-foreground">AI Assistant Tips</span>
          </div>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground max-w-6xl mx-auto">
            <div className="p-4 rounded-xl bg-gradient-coral/10 border border-accent-coral/20">
              <p><strong className="text-accent-coral">📝 Logs:</strong> "Log that I woke up at 7:30 am" or "I had lunch with Sarah"</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-electric/10 border border-accent-electric/20">
              <p><strong className="text-accent-electric">⏰ Reminders:</strong> "Remind me to call mom in 30 minutes"</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-lime/10 border border-accent-lime/20">
              <p><strong className="text-accent-lime">❓ Queries:</strong> "What did I log today?" or "Show my reminders"</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-purple/10 border border-accent-purple/20">
              <p><strong className="text-accent-purple">🔊 Voice:</strong> "Snooze for 10 minutes" or "Dismiss" when reminder plays</p>
            </div>
          </div>
        </footer>
        </div>
        </div>
      </RemindersProvider>
    </LogsProvider>
  );
};

export default Index;
