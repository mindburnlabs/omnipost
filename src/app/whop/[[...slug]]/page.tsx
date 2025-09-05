'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';

interface WhopUser {
  id: string;
  email: string;
  username?: string;
  access_pass?: {
    id: string;
    status: string;
    valid: boolean;
  };
}

interface WhopContext {
  user: WhopUser | null;
  company_id?: string;
  app_id?: string;
  experience_id?: string;
  access_granted: boolean;
}

export default function WhopExperiencePage({ params }: { params: { slug?: string[] } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [whopContext, setWhopContext] = useState<WhopContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Whop SDK or get context from query params/postMessage
    const initWhopContext = async () => {
      try {
        // Check if we're running inside a Whop iframe
        const isEmbedded = window !== window.top;
        
        if (isEmbedded) {
          // Listen for Whop context from parent frame
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://whop.com') return;
            
            if (event.data.type === 'WHOP_CONTEXT') {
              const { user, company_id, app_id, experience_id, access_granted } = event.data.payload;
              setWhopContext({
                user,
                company_id,
                app_id,
                experience_id,
                access_granted: access_granted || false
              });
              setIsLoading(false);
            }
          };

          window.addEventListener('message', handleMessage);

          // Request context from parent
          window.parent.postMessage({ type: 'REQUEST_WHOP_CONTEXT' }, 'https://whop.com');

          return () => window.removeEventListener('message', handleMessage);
        } else {
          // Fallback: try to get context from URL params (for testing)
          const userId = searchParams.get('user_id');
          const userEmail = searchParams.get('user_email');
          const companyId = searchParams.get('company_id') || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
          const appId = searchParams.get('app_id') || process.env.NEXT_PUBLIC_WHOP_APP_ID;
          const accessGranted = searchParams.get('access') === 'granted';

          if (userId && userEmail) {
            setWhopContext({
              user: {
                id: userId,
                email: userEmail,
                username: searchParams.get('username') || undefined,
                access_pass: accessGranted ? {
                  id: searchParams.get('pass_id') || 'test_pass',
                  status: 'active',
                  valid: true
                } : undefined
              },
              company_id: companyId,
              app_id: appId,
              access_granted: accessGranted
            });
          } else {
            setError('No Whop context available. This page should be accessed through Whop.');
          }
          setIsLoading(false);
        }
      } catch (err) {
        setError('Failed to initialize Whop context');
        setIsLoading(false);
      }
    };

    initWhopContext();
  }, [searchParams]);

  useEffect(() => {
    if (whopContext?.user) {
      // Set up Whop user in our auth context
      // This would integrate with your existing auth system
      setupWhopUser(whopContext.user);
    }
  }, [whopContext, setupWhopUser]);

  const setupWhopUser = async (user: WhopUser) => {
    try {
      // Call your backend to create/update user session for Whop users
      const response = await fetch('/next_api/auth/whop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whop_user: user,
          company_id: whopContext?.company_id,
          app_id: whopContext?.app_id,
          access_granted: whopContext?.access_granted
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to setup Whop user session');
      }

      const data = await response.json();
      
      // Navigate to appropriate page based on access level
      if (whopContext?.access_granted) {
        router.push('/dashboard');
      } else {
        router.push('/upgrade');
      }
    } catch (err) {
      setError('Failed to setup user session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading OmniPost...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-lg font-medium">Access Error</div>
          <p className="text-muted-foreground">{error}</p>
          <div className="text-xs text-muted-foreground">
            This app is designed to run as a Whop experience. Please access it through your Whop dashboard.
          </div>
        </div>
      </div>
    );
  }

  if (!whopContext?.access_granted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome to OmniPost</h1>
            <p className="text-muted-foreground">
              You need an active subscription to access OmniPost features.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <div className="flex items-center space-x-2 text-amber-800 mb-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium">Access: Limited</span>
            </div>
            <p className="text-sm text-amber-700">
              Please upgrade your subscription to unlock all OmniPost features including multi-platform posting, scheduling, and analytics.
            </p>
          </div>
          
          <button
            onClick={() => {
              // Send message to parent to trigger upgrade flow
              if (window !== window.top) {
                window.parent.postMessage({ 
                  type: 'WHOP_UPGRADE_REQUEST',
                  payload: { app_id: whopContext?.app_id }
                }, 'https://whop.com');
              }
            }}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Upgrade Subscription
          </button>
        </div>
      </div>
    );
  }

  // User has access, show the main app
  return <WhopAppWrapper whopContext={whopContext} />;
}

function WhopAppWrapper({ whopContext }: { whopContext: WhopContext }) {
  return (
    <div className="whop-embedded-app">
      {/* Add Whop-specific header if needed */}
      {whopContext.access_granted && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Access: Granted</span>
            </div>
            <span className="text-green-600 text-xs">
              Welcome, {whopContext.user?.username || whopContext.user?.email}
            </span>
          </div>
        </div>
      )}
      
      <AppLayout>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Welcome to OmniPost</h1>
          <p className="text-muted-foreground mb-6">
            Start by connecting your first platform and composing your first post.
          </p>
          
          {/* Quick actions for Whop users */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">Connect Platforms</h3>
              <p className="text-sm text-muted-foreground">Link Discord, Telegram, and other platforms</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">Compose Post</h3>
              <p className="text-sm text-muted-foreground">Create your first multi-platform post</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">View Analytics</h3>
              <p className="text-sm text-muted-foreground">Track your post performance</p>
            </div>
          </div>
        </div>
      </AppLayout>
    </div>
  );
}
