
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; cause?: any };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('App Error:', error);
  }, [error]);

  const isApiError = error.name === 'ApiError' || error.message.includes('API');
  const isNetworkError = error.message.includes('fetch') || error.message.includes('Network');

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-red-600 dark:text-red-400">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isApiError && "There was a problem connecting to our servers."}
              {isNetworkError && "Network connection issue detected."}
              {!isApiError && !isNetworkError && "An unexpected error occurred."}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Error details:</p>
            <p className="font-mono text-xs bg-muted p-2 rounded">
              {error.message}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Debug Information
              </summary>
              <pre className="mt-2 bg-muted p-2 rounded overflow-auto text-xs">
                {JSON.stringify({
                  message: error.message,
                  name: error.name,
                  stack: error.stack,
                  digest: error.digest,
                  cause: error.cause
                }, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

