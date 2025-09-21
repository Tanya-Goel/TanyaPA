import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogCard } from '@/components/LogCard';
import { useLogsContext } from '@/contexts/LogsContext';
import { BookOpen, Calendar, Clock, Tag } from 'lucide-react';

export const DailyLogsFolder = () => {
  const { logs, loading, getTodayLogs, getRecentLogs, getLogsByCategory } = useLogsContext();

  // Logs are automatically loaded when the app starts

  const todayLogs = getTodayLogs();
  const recentLogs = getRecentLogs(24);
  const categories = ['activity', 'meal', 'work', 'personal', 'health'] as const;

  return (
    <Card className="w-full bg-gradient-lime/10 border-accent-lime/20 hover:border-accent-lime/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-lime shadow-soft animate-float">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Daily Logs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your activity history and daily records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-gradient-lime/20 text-accent-lime border-accent-lime/30">
              {logs.length} total logs
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today
              <Badge variant="outline" className="ml-1 h-5 text-xs">
                {todayLogs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
              <Badge variant="outline" className="ml-1 h-5 text-xs">
                {recentLogs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Logs
              <Badge variant="outline" className="ml-1 h-5 text-xs">
                {logs.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-6">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                  <p>Loading your daily logs...</p>
                </div>
              ) : todayLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No activities logged today</p>
                  <p className="text-sm">Start by logging what you're doing!</p>
                </div>
              ) : (
                todayLogs
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((log) => (
                    <LogCard key={log.id} log={log} />
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="mt-6">
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activities</p>
                </div>
              ) : (
                recentLogs
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((log) => (
                    <LogCard key={log.id} log={log} />
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="categories" className="mt-6">
            <div className="space-y-4">
              {categories.map((category) => {
                const categoryLogs = getLogsByCategory(category);
                if (categoryLogs.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2 capitalize flex items-center gap-2">
                      {category} 
                      <Badge variant="outline" className="h-5 text-xs">
                        {categoryLogs.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {categoryLogs
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .slice(0, 3)
                        .map((log) => (
                          <LogCard key={log.id} log={log} />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No logs yet</p>
                  <p className="text-sm">Start logging your daily activities!</p>
                </div>
              ) : (
                logs
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((log) => (
                    <LogCard key={log.id} log={log} />
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};