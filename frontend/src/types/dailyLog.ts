export interface DailyLog {
  id: string;
  text: string;
  timestamp: Date;
  category?: 'activity' | 'meal' | 'work' | 'personal' | 'health' | 'other';
  createdAt: Date;
}

export interface LogQuery {
  date?: Date;
  category?: string;
  text?: string;
}