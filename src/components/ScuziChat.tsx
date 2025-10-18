"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Loader2, ChefHat, Camera, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
  thinking?: string;
}

export default function ScuziChat() {
  const [messages, setMessages] = useState<Message[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "👋 Hey there! I'm Scuzi — your AI food and health companion.\n\nHere's what I can help you with:\n\n🥗 Create recipes from your leftover ingredients\n📊 Analyze your meals with complete nutrition details\n🛒 Build 7-day meal plans straight from your grocery receipts\n🍳 Give cooking tips and practical healthy swaps\n🏷️ Assess packaged foods and reveal hidden additives\n\nJust type, snap, or upload — and I'll handle the rest.\nLet's make every meal smarter and healthier. 🍽️",
    timestamp: new Date()
  }]
  );

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera not available:", error);
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        setSelectedImage(imageData);
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    console.log("[FRONTEND] Sending message...");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: selectedImage || undefined,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const conversationMessages = messages.filter((m) => m.id !== "welcome");

      console.log("[FRONTEND] Calling /api/chat...");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
          ...conversationMessages.map((m) => ({
            role: m.role,
            content: m.content,
            // CRITICAL: Only include images for user messages, not assistant messages
            image: m.role === "user" ? m.image : undefined
          })),
          {
            role: "user",
            content: input,
            image: imageToSend
          }]

        })
      });

      console.log("[FRONTEND] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("[FRONTEND] Response data:", {
        hasContent: !!data.content,
        shouldGenerateImage: data.shouldGenerateImage,
        hasMetadata: !!data.imageMetadata,
        historyItemId: data.historyItemId
      });

      // Add assistant's text response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Generate meal image if metadata is provided
      if (data.shouldGenerateImage && data.imageMetadata) {
        console.log("[FRONTEND] Generating image with metadata...");

        try {
          const imageResponse = await fetch("/api/generate-meal-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              imageMetadata: data.imageMetadata,
              historyItemId: data.historyItemId // Pass history item ID for DynamoDB update
            })
          });

          console.log("[FRONTEND] Image response status:", imageResponse.status);

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log("[FRONTEND] Image generated successfully");

            const imageMessage: Message = {
              id: (Date.now() + 2).toString(),
              role: "assistant",
              content: `Here's what ${imageData.mealDescription} looks like:`,
              image: imageData.imageUrl,
              timestamp: new Date()
            };
            setMessages((prev) => [...prev, imageMessage]);
          } else {
            console.warn("[FRONTEND] Image generation failed, but continuing...");
          }
        } catch (imageError) {
          console.error("[FRONTEND] Image generation error (non-critical):", imageError);
          // Don't show error to user - image generation is non-critical
        }
      }
    } catch (error) {
      console.error("[FRONTEND] Fatal error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error ?
        `⚠️ ${error.message}\n\nPlease try again in a moment.` :
        "⚠️ I encountered a technical issue. Please try again.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log("[FRONTEND] Request completed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white z-50 shadow-sm">
        <div className="px-6 py-6 flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" />
            <AvatarFallback className="bg-[rgb(209,222,38)] text-[rgb(39,39,42)]">
              <ChefHat className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3
              className="font-bold text-[rgb(17,24,39)] !whitespace-pre-line !whitespace-pre-line !whitespace-pre-line"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: 500
              }}>Scuzi AI


            </h3>
            <p
              className="text-[rgb(17,24,39)] !whitespace-pre-line !whitespace-pre-line !whitespace-pre-line"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px',
                lineHeight: '21px',
                fontWeight: 400
              }}>Your Food & Health Companion....


            </p>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera &&
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 relative">
            <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover" />

            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="bg-white p-4 flex justify-center gap-4">
            <Button
            onClick={closeCamera}
            size="lg"
            variant="ghost"
            className="text-[rgb(39,39,42)] hover:bg-gray-100">

              <X className="h-6 w-6" />
            </Button>
            <Button
            onClick={capturePhoto}
            size="lg"
            className="bg-[rgb(209,222,38)] hover:bg-[rgb(209,222,38)]/90 text-[rgb(39,39,42)] rounded-full w-16 h-16">

              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
      }

      {/* Scrollable Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) =>
        <div
          key={message.id}
          className={cn(
            "flex gap-3 max-w-[85%]",
            message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
          )}>

            {message.role === "assistant" &&
          <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-[rgb(209,222,38)] text-[rgb(39,39,42)]">
                  <ChefHat className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
          }
            <div
            className={cn(
              "rounded-xl px-4 py-3 shadow-sm",
              message.role === "user" ?
              "bg-[rgb(209,222,38)] text-[rgb(39,39,42)]" :
              "bg-gray-50 text-[rgb(17,24,39)]"
            )}>

              {message.image &&
            <img
              src={message.image}
              alt="Uploaded content"
              className="rounded-lg mb-3 max-w-full h-auto" />

            }
              <p
              className="whitespace-pre-wrap break-words !whitespace-pre-line"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px',
                lineHeight: '21px',
                fontWeight: 400
              }}>

                {message.content}
              </p>
              <p
              className="text-gray-400 mt-2"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 400
              }}>

                {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
              </p>
            </div>
          </div>
        )}
        {isLoading &&
        <div className="flex gap-3 max-w-[85%] mr-auto">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-[rgb(209,222,38)] text-[rgb(39,39,42)]">
                <ChefHat className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex gap-1 items-center">
                <Loader2 className="w-4 h-4 animate-spin text-[rgb(209,222,38)]" />
                <span className="text-sm text-gray-500 ml-2">Claude is thinking...</span>
              </div>
            </div>
          </div>
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Input Area */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        {selectedImage &&
        <div className="mb-3 relative inline-block">
            <img
            src={selectedImage}
            alt="Selected"
            className="h-24 rounded-lg" />

            <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">

              ×
            </button>
          </div>
        }
        <div className="flex items-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden" />

          <Button
            variant="ghost"
            size="icon"
            onClick={startCamera}
            disabled={isLoading}
            className="text-[rgb(39,39,42)] hover:text-[rgb(17,24,39)] hover:bg-gray-100">

            <Camera className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-[rgb(39,39,42)] hover:text-[rgb(17,24,39)] hover:bg-gray-100">

            <ImageIcon className="h-5 w-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or upload an image..."
            disabled={isLoading}
            className="flex-1 min-h-[44px] max-h-[120px] bg-white border border-gray-200 text-[rgb(17,24,39)] placeholder:text-gray-400 resize-none rounded-lg focus:border-[rgb(209,222,38)] focus:ring-1 focus:ring-[rgb(209,222,38)]"
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              fontSize: '16px',
              lineHeight: '24px',
              fontWeight: 500
            }}
            rows={1} />

          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim() && !selectedImage}
            size="icon"
            className="bg-[rgb(209,222,38)] hover:bg-[rgb(209,222,38)]/90 text-[rgb(39,39,42)] h-11 w-11 rounded-lg disabled:opacity-50">

            {isLoading ?
            <Loader2 className="h-5 w-5 animate-spin" /> :

            <Send className="h-5 w-5" />
            }
          </Button>
        </div>
      </div>
    </div>);

}