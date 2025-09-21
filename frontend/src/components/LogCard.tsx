import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyLog } from '@/types/dailyLog';
import { useLogsContext } from '@/contexts/LogsContext';
import { Trash2, Clock, BookOpen, Utensils, Briefcase, Heart, User, Tag } from 'lucide-react';

interface LogCardProps {
  log: DailyLog;
}

const getCategoryIcon = (category: DailyLog['category']) => {
  switch (category) {
    case 'meal': return <Utensils className="h-3 w-3" />;
    case 'work': return <Briefcase className="h-3 w-3" />;
    case 'health': return <Heart className="h-3 w-3" />;
    case 'personal': return <User className="h-3 w-3" />;
    case 'activity': return <BookOpen className="h-3 w-3" />;
    default: return <Tag className="h-3 w-3" />;
  }
};

const getCategoryColor = (category: DailyLog['category']) => {
  switch (category) {
    case 'meal': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'work': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'health': return 'bg-green-100 text-green-800 border-green-200';
    case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'activity': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const LogCard = ({ log }: LogCardProps) => {
  const { deleteLog, deleting } = useLogsContext();

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getCategoryColor(log.category)}>
                {getCategoryIcon(log.category)}
                <span className="ml-1 capitalize">{log.category}</span>
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {log.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
            
            <p className="text-sm text-foreground leading-relaxed">
              {log.text}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteLog(log.id)}
            disabled={deleting.has(log.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className={`h-4 w-4 ${deleting.has(log.id) ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};