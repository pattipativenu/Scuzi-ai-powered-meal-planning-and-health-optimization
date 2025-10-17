"use client";

import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhoopErrorPage() {
  const [error, setError] = useState<string>("Unknown error");
  const [errorDescription, setErrorDescription] = useState<string>("");

  useEffect(() => {
    // Parse error from URL query params
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const descriptionParam = params.get('error_description');

    if (errorParam) {
      setError(errorParam);
    }
    if (descriptionParam) {
      setErrorDescription(descriptionParam);
    }

    // Notify parent window about error
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'WHOOP_AUTH_ERROR',
        data: {
          error: errorParam || 'unknown_error',
          description: descriptionParam || 'Unknown error occurred'
        }
      }, window.location.origin);
      
      console.log('❌ Error sent to main window via postMessage');
    }
  }, []);

  const handleClose = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
    } else {
      window.location.href = '/';
    }
  };

  const getErrorTitle = (errorCode: string) => {
    const errorTitles: Record<string, string> = {
      'access_denied': 'Access Denied',
      'invalid_state': 'Invalid State',
      'token_exchange_failed': 'Token Exchange Failed',
      'missing_code': 'Missing Authorization Code',
      'invalid_state_token': 'Invalid State Token'
    };
    return errorTitles[errorCode] || 'Authorization Failed';
  };

  const getErrorMessage = (errorCode: string, description: string) => {
    if (description) return description;
    
    const errorMessages: Record<string, string> = {
      'access_denied': 'You denied access to your WHOOP account. Please try again if you want to connect.',
      'invalid_state': 'The authentication state is invalid or expired. This may be a security issue.',
      'token_exchange_failed': 'Failed to obtain access token from WHOOP. Please try again.',
      'missing_code': 'Authorization code was not provided by WHOOP.',
      'invalid_state_token': 'The state token could not be verified. Please try again.'
    };
    return errorMessages[errorCode] || 'An unexpected error occurred during authentication.';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b141a]">
      <div className="bg-[#1f2c33] rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {getErrorTitle(error)}
        </h1>
        
        <p className="text-[#8696a0] mb-6">
          {getErrorMessage(error, errorDescription)}
        </p>

        <div className="bg-[#2a3942] rounded p-3 mb-6 text-left">
          <p className="text-xs text-[#8696a0] mb-1">Error Code:</p>
          <p className="text-sm text-white font-mono">{error}</p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleClose}
            className="bg-[#00a884] hover:bg-[#00a884]/90 text-white w-full"
          >
            Close This Tab
          </Button>
          
          <p className="text-xs text-[#8696a0]">
            Return to the main app and try connecting again.
          </p>
        </div>
      </div>
    </div>
  );
}