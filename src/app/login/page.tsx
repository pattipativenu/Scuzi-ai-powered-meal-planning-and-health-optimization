"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const redirect = searchParams.get("redirect") || "/";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        callbackURL: redirect,
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        return;
      }

      toast.success("Successfully logged in!");
      router.push(redirect);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 
            style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontWeight: 500,
              fontSize: '48px',
              lineHeight: '56px',
              color: 'rgb(39, 39, 42)',
              marginBottom: '12px'
            }}
          >
            SCUZI
          </h1>
          <h2 
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              fontWeight: 500,
              fontSize: '24px',
              lineHeight: '32px',
              color: 'rgb(39, 39, 42)',
              marginBottom: '8px'
            }}
          >
            Welcome Back
          </h2>
          <p 
            style={{
              fontFamily: '"General Sans", sans-serif',
              fontSize: '15px',
              lineHeight: '21px',
              color: 'rgb(107, 114, 128)'
            }}
          >
            Sign in to your account to continue
          </p>
        </div>

        {registered && (
          <div 
            className="p-4 rounded-lg bg-green-50 border border-green-200"
            style={{
              fontFamily: '"General Sans", sans-serif',
              fontSize: '14px',
              color: 'rgb(22, 101, 52)'
            }}
          >
            Account created successfully! Please sign in.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label 
              htmlFor="email"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgb(39, 39, 42)'
              }}
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="password"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgb(39, 39, 42)'
              }}
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="off"
              className="h-12"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px'
              }}
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label 
              htmlFor="remember-me" 
              className="ml-2"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                color: 'rgb(107, 114, 128)'
              }}
            >
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white"
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <p 
            style={{
              fontFamily: '"General Sans", sans-serif',
              fontSize: '14px',
              color: 'rgb(107, 114, 128)'
            }}
          >
            Don't have an account?{" "}
            <Link 
              href="/register" 
              className="font-medium hover:underline"
              style={{
                color: 'rgb(39, 39, 42)'
              }}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}