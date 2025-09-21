import { Reminder } from '@/types/reminder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, Trash2, AlertCircle } from 'lucide-react';
import { formatTimeUntil } from '@/utils/timeParser';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  deleting?: Set<string>;
}

export const ReminderCard = ({ reminder, onComplete, onDelete, deleting = new Set() }: ReminderCardProps) => {
  const timeUntil = formatTimeUntil(reminder.dueTime);
  const isOverdue = reminder.dueTime < new Date() && !reminder.isCompleted;
  
  return (
    <Card className={`p-4 transition-all duration-300 hover:shadow-reminder ${
      reminder.isCompleted 
        ? 'bg-success/5 border-success/20' 
        : isOverdue 
        ? 'bg-destructive/5 border-destructive/20'
        : 'bg-card border-border/50 hover:border-primary/30'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {isOverdue && !reminder.isCompleted && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <p className={`font-medium ${
              reminder.isCompleted 
                ? 'text-muted-foreground line-through' 
                : 'text-card-foreground'
            }`}>
              {reminder.text}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className={
              isOverdue && !reminder.isCompleted 
                ? 'text-destructive font-medium' 
                : 'text-muted-foreground'
            }>
              {reminder.dueTime.toLocaleString([], { 
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            
            {!reminder.isCompleted && (
            <Badge variant={
              isOverdue ? 'destructive' : 
              timeUntil.includes('minute') ? 'outline' : 'secondary'
            } className={`text-xs ${
              timeUntil.includes('minute') ? 'bg-warning/10 text-warning border-warning/20' : ''
            }`}>
                {timeUntil}
              </Badge>
            )}
            
            {reminder.isCompleted && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                Completed
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!reminder.isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComplete(reminder.id)}
              className="h-8 w-8 p-0 hover:bg-success/10 hover:text-success"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reminder.id)}
            disabled={deleting.has(reminder.id)}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className={`h-4 w-4 ${deleting.has(reminder.id) ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};