"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PersonalizeSummaryPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Initialize userId
  useEffect(() => {
    if (!isPending) {
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        const tempId = localStorage.getItem("temp_user_id");
        if (tempId) {
          setUserId(tempId);
        }
      }
    }
  }, [session, isPending]);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/preferences?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.preferences) {
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Handle redirect for authenticated users
  const handleContinue = () => {
    if (session?.user) {
      router.push("/");
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/"
      });
      if (error?.code) {
        toast.error("Google sign-in failed. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to sign in with Google");
    }
  };

  // Handle Facebook sign-in
  const handleFacebookSignIn = async () => {
    try {
      const { error } = await authClient.signIn.social({
        provider: "facebook",
        callbackURL: "/"
      });
      if (error?.code) {
        toast.error("Facebook sign-in failed. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to sign in with Facebook");
    }
  };

  if (isLoading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
      {/* Left Side - Summary & Account Creation */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16">
        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1
              style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
                fontSize: "48px",
                fontWeight: 700,
                lineHeight: "1.1",
                color: "rgb(17, 24, 39)",
              }}
            >
              You're All Set!
            </h1>
            <p
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: "18px",
                color: "rgb(107, 114, 128)",
              }}
            >
              We've saved your preferences and we're ready to personalize your meal plan.
            </p>
          </div>

          {/* Preferences Summary */}
          {preferences && (
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <h2
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "rgb(17, 24, 39)",
                }}
              >
                Your Preferences
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {preferences.userGoal && preferences.userGoal.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: '"Right Grotesk Wide", sans-serif',
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "rgb(107, 114, 128)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Goals
                    </p>
                    <p
                      style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: "14px",
                        color: "rgb(17, 24, 39)",
                      }}
                    >
                      {preferences.userGoal.map((g: string) => g.replace(/_/g, " ")).join(", ")}
                    </p>
                  </div>
                )}

                {preferences.dietType && (
                  <div>
                    <p
                      style={{
                        fontFamily: '"Right Grotesk Wide", sans-serif',
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "rgb(107, 114, 128)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Diet Type
                    </p>
                    <p
                      style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: "14px",
                        color: "rgb(17, 24, 39)",
                      }}
                    >
                      {preferences.dietType.replace(/_/g, " ")}
                    </p>
                  </div>
                )}

                {preferences.mealsPerDay && (
                  <div>
                    <p
                      style={{
                        fontFamily: '"Right Grotesk Wide", sans-serif',
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "rgb(107, 114, 128)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Meals Per Day
                    </p>
                    <p
                      style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: "14px",
                        color: "rgb(17, 24, 39)",
                      }}
                    >
                      {preferences.mealsPerDay} meals
                    </p>
                  </div>
                )}

                {preferences.activityLevel && (
                  <div>
                    <p
                      style={{
                        fontFamily: '"Right Grotesk Wide", sans-serif',
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "rgb(107, 114, 128)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Activity Level
                    </p>
                    <p
                      style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: "14px",
                        color: "rgb(17, 24, 39)",
                      }}
                    >
                      {preferences.activityLevel.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Authentication Prompt */}
          {!session?.user ? (
            <div className="space-y-6">
              <div className="text-center">
                <p
                  style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "16px",
                    color: "rgb(107, 114, 128)",
                  }}
                >
                  Create an account to save your preferences
                </p>
              </div>

              {/* Social Sign-In Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={handleFacebookSignIn}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span 
                    className="px-4 bg-white"
                    style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: "14px",
                      color: "rgb(107, 114, 128)",
                    }}
                  >
                    or
                  </span>
                </div>
              </div>

              {/* Email Sign Up */}
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                <Mail className="w-5 h-5" />
                Continue with Email
              </Link>

              {/* Sign In Link */}
              <div className="text-center">
                <p
                  style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "rgb(107, 114, 128)",
                  }}
                >
                  Already have an account?{" "}
                  <Link 
                    href="/login" 
                    className="text-black font-medium hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                className="px-8 py-4 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                Continue to Home
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://scuziassests.s3.us-east-1.amazonaws.com/WelcomeStep.webp')"
          }}
        />
      </div>
    </div>
  );
}