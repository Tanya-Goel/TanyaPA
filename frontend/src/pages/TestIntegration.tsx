import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import apiService from '@/services/apiService';

const TestIntegration = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const testConnection = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.getApiInfo();
      setResponse(result);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Connection test failed:', error);
      setResponse({ error: error.message });
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!input.trim()) return;
    
    try {
      setIsLoading(true);
      const result = await apiService.sendMessage(input);
      setResponse(result);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Message test failed:', error);
      setResponse({ error: error.message });
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Frontend-Backend Integration Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={testConnection} disabled={isLoading}>
                Test Backend Connection
              </Button>
              <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
                {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                {connectionStatus === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Unknown'}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Test Message:</label>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., 'Remind me in 2 minutes to test' or 'Log that I had lunch'"
                  className="flex-1"
                />
                <Button onClick={sendTestMessage} disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {response && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">API Response:</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto max-h-96 bg-background p-4 rounded border">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Frontend:</strong> React + TypeScript + Vite
                <br />
                <strong>Port:</strong> 8080
                <br />
                <strong>Status:</strong> <Badge variant="default">Running</Badge>
              </div>
              <div>
                <strong>Backend:</strong> Node.js + Express + MongoDB
                <br />
                <strong>Port:</strong> 3000
                <br />
                <strong>Status:</strong> <Badge variant="default">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestIntegration;
