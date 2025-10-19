"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });

      if (error?.code) {
        const errorMessages: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered. Please sign in instead.",
        };
        toast.error(errorMessages[error.code] || "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created successfully!");
      router.push("/");
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
            Create Account
          </h2>
          <p 
            style={{
              fontFamily: '"General Sans", sans-serif',
              fontSize: '15px',
              lineHeight: '21px',
              color: 'rgb(107, 114, 128)'
            }}
          >
            Join Scuzi to access personalized meal planning
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label 
              htmlFor="name"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgb(39, 39, 42)'
              }}
            >
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              placeholder="At least 8 characters"
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

          <div className="space-y-2">
            <Label 
              htmlFor="confirmPassword"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgb(39, 39, 42)'
              }}
            >
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              autoComplete="off"
              className="h-12"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px'
              }}
            />
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
            {isLoading ? "Creating account..." : "Create Account"}
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
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-medium hover:underline"
              style={{
                color: 'rgb(39, 39, 42)'
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}