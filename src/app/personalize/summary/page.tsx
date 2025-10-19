"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

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
      router.push("/plan-ahead");
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
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
      <div className="max-w-2xl w-full space-y-8">
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
          <div className="bg-gray-50 rounded-2xl p-8 space-y-4">
            <h2
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: "20px",
                fontWeight: 500,
                color: "rgb(17, 24, 39)",
              }}
            >
              Your Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preferences.userGoal && preferences.userGoal.length > 0 && (
                <div>
                  <p
                    style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgb(107, 114, 128)",
                    }}
                  >
                    Goals
                  </p>
                  <p
                    style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: "15px",
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
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgb(107, 114, 128)",
                    }}
                  >
                    Diet Type
                  </p>
                  <p
                    style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: "15px",
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
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgb(107, 114, 128)",
                    }}
                  >
                    Meals Per Day
                  </p>
                  <p
                    style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: "15px",
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
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgb(107, 114, 128)",
                    }}
                  >
                    Activity Level
                  </p>
                  <p
                    style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: "15px",
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
          <div className="space-y-4">
            <div className="text-center">
              <p
                style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: "16px",
                  color: "rgb(107, 114, 128)",
                  marginBottom: "24px",
                }}
              >
                Create an account or sign in to save your preferences and start planning your meals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors text-center"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl border-2 border-black text-black hover:bg-gray-50 transition-colors text-center"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                Sign In
              </Link>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-black transition-colors"
                style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: "14px",
                }}
              >
                Skip for now
              </button>
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
              Continue to Plan Ahead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}