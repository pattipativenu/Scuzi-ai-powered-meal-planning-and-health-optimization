"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Loader2, ChefHat, Camera, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
  thinking?: string;
  isLoadingImage?: boolean;
}

export default function ScuziChat() {
  const [messages, setMessages] = useState<Message[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "\uD83D\uDC4B Hey there! I'm Scuzi \u2014 your AI food and health companion.\n\nHere's what I can help you with:\n\n\uD83E\uDD57 Create recipes from your leftover ingredients\n\uD83D\uDCCA Analyze your meals with complete nutrition details\n\uD83D\uDED2 Create recipes\xA0from your grocery receipts\n\uD83C\uDF73 Give cooking tips and practical healthy swaps\n\uD83C\uDFF7\uFE0F Assess packaged foods and reveal hidden additives\n\nJust type, snap, or upload \u2014 and I'll handle the rest.\nLet's make every meal smarter and healthier. \uD83C\uDF7D\uFE0F",
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

        // Add loading placeholder for image
        const loadingImageMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "🎨 Generating your meal image...",
          timestamp: new Date(),
          isLoadingImage: true
        };
        setMessages((prev) => [...prev, loadingImageMessage]);

        try {
          // Add 30-second timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const imageResponse = await fetch("/api/generate-meal-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              imageMetadata: data.imageMetadata,
              historyItemId: data.historyItemId
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          console.log("[FRONTEND] Image response status:", imageResponse.status);

          // Remove loading message
          setMessages((prev) => prev.filter(m => m.id !== loadingImageMessage.id));

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log("[FRONTEND] Image generated successfully");

            const imageMessage: Message = {
              id: (Date.now() + 3).toString(),
              role: "assistant",
              content: `Here's what ${imageData.mealDescription} looks like:`,
              image: imageData.imageUrl,
              timestamp: new Date()
            };
            setMessages((prev) => [...prev, imageMessage]);
          } else {
            const errorData = await imageResponse.json().catch(() => ({}));
            console.warn("[FRONTEND] Image generation failed:", errorData);
            
            // Show friendly error message
            const errorMessage: Message = {
              id: (Date.now() + 3).toString(),
              role: "assistant",
              content: "⚠️ Image generation is taking longer than usual. Your recipe is ready above! The image might appear in your history later.",
              timestamp: new Date()
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        } catch (imageError) {
          console.error("[FRONTEND] Image generation error:", imageError);
          
          // Remove loading message
          setMessages((prev) => prev.filter(m => m.id !== loadingImageMessage.id));
          
          // Check if it's a timeout error
          const isTimeout = imageError instanceof Error && 
            (imageError.name === 'AbortError' || imageError.message.includes('abort'));
          
          if (isTimeout) {
            console.warn("[FRONTEND] Image generation timeout");
            const timeoutMessage: Message = {
              id: (Date.now() + 3).toString(),
              role: "assistant",
              content: "⏱️ Image generation is taking too long. Your recipe is ready above! Try asking for the image again if needed.",
              timestamp: new Date()
            };
            setMessages((prev) => [...prev, timeoutMessage]);
          }
          // Don't show error for other cases - just silently fail
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
        <div className="px-4 md:px-6 py-4 md:py-6 flex items-center gap-3 md:gap-4">
          <Avatar className="h-8 w-8 md:h-12 md:w-12">
            <AvatarImage src="" />
            <AvatarFallback className="bg-[rgb(209,222,38)] text-[rgb(39,39,42)]">
              <ChefHat className="h-4 w-4 md:h-6 md:w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3
              className="font-bold text-[rgb(17,24,39)]"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: 500
              }}>Scuzi AI
            </h3>
            <p
              className="text-[rgb(17,24,39)]"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '13px',
                lineHeight: '18px',
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
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 pb-20 md:pb-6">
        {messages.map((message) =>
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            type: "spring", 
            stiffness: 200,
            damping: 20
          }}
          className={cn(
            "flex gap-2 md:gap-3 max-w-[85%]",
            message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
          )}>
            {message.role === "assistant" &&
          <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                <AvatarFallback className="bg-[rgb(209,222,38)] text-[rgb(39,39,42)]">
                  <ChefHat className="h-3 w-3 md:h-4 md:w-4" />
                </AvatarFallback>
              </Avatar>
          }
            <div
            className={cn(
              "rounded-xl px-3 py-2 md:px-4 md:py-3 shadow-sm",
              message.role === "user" ?
              "bg-gray-100 text-[rgb(39,39,42)]" :
              "bg-yellow-50 text-[rgb(17,24,39)]"
            )}>
              {message.image &&
            <img
              src={message.image}
              alt="Uploaded content"
              className="rounded-lg mb-2 md:mb-3 max-w-full h-auto" />
            }
              {message.isLoadingImage && (
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[rgb(209,222,38)]" />
                  <span className="text-xs md:text-sm text-gray-500">Generating image...</span>
                </div>
              )}
              <p
              className="whitespace-pre-wrap break-words"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: 400
              }}>
                {message.content}
              </p>
              <p
              className="text-gray-400 mt-1 md:mt-2"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 400
              }}>
                {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
              </p>
            </div>
          </motion.div>
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
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-3 md:py-4 z-50 pb-20 md:pb-4">
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
        <div className="flex items-end gap-2 md:gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden" />
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or upload an image…"
              disabled={isLoading}
              className="w-full min-h-[44px] max-h-[120px] bg-neutral-100 border border-gray-200 text-[rgb(17,24,39)] placeholder:text-gray-400 resize-none rounded-2xl focus:border-[rgb(209,222,38)] focus:ring-1 focus:ring-[rgb(209,222,38)] pl-12 pr-4 shadow-sm"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: '15px',
                lineHeight: '22px',
                fontWeight: 400
              }}
              rows={1} />
            <Camera 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" 
              onClick={startCamera}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim() && !selectedImage}
            size="icon"
            className="bg-[rgb(209,222,38)] hover:bg-[rgb(209,222,38)]/90 text-[rgb(39,39,42)] h-11 w-11 rounded-lg disabled:opacity-50 flex-shrink-0">
            {isLoading ?
            <Loader2 className="h-5 w-5 animate-spin" /> :
            <Send className="h-5 w-5" />
            }
          </Button>
        </div>
      </div>
    </div>);
}