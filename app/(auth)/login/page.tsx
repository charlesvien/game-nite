'use client';

import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Gamepad2 className="h-10 w-10 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold text-white">Game Nite</h1>
          </div>
          <p className="text-slate-300 text-center">Sign in to manage your game servers</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </div>
      </div>
    </div>
  );
}
