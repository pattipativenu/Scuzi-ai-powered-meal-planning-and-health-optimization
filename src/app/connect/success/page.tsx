"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhoopSuccessPage() {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Parse tokens from URL fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (accessToken) {
      // Store tokens in cookies
      document.cookie = `whoop_access_token=${accessToken}; path=/; max-age=${expiresIn || 3600}; SameSite=Lax; Secure`;
      if (refreshToken) {
        document.cookie = `whoop_refresh_token=${refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax; Secure`;
      }

      // Send tokens to parent window (main app) via postMessage
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'WHOOP_AUTH_SUCCESS',
          data: {
            accessToken,
            refreshToken,
            expiresIn
          }
        }, window.location.origin);
        
        console.log('✅ Tokens sent to main window via postMessage');
        setCanClose(true);
      } else {
        // If no opener, redirect to main app
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }

      // Clear URL fragment for security
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b141a]">
      <div className="bg-[#1f2c33] rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-[#00a884]" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Access Granted!
        </h1>
        
        <p className="text-[#8696a0] mb-6">
          Your WHOOP account has been successfully connected to Scuzi.
        </p>

        {canClose && (
          <>
            <p className="text-white mb-4">
              ✅ Connection successful! You can now close this tab and return to the main app.
            </p>
            
            <Button
              onClick={() => window.close()}
              className="bg-[#00a884] hover:bg-[#00a884]/90 text-white w-full"
            >
              Close This Tab
            </Button>
          </>
        )}

        {!canClose && (
          <p className="text-[#8696a0] text-sm">
            Redirecting you back to the app...
          </p>
        )}
      </div>
    </div>
  );
}