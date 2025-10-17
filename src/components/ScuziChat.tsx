"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Loader2, ChefHat, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import WhoopMetricsTicker from "@/components/WhoopMetricsTicker";
import WhoopDataChart from "@/components/WhoopDataChart";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
  thinking?: string;
}

interface WhoopMetrics {
  connected: boolean;
  sleep?: string;
  strain?: string;
  calories?: number;
  recovery?: number;
  hrv?: number;
  rhr?: number;
  avgHeartRate?: number;
  spo2?: string;
  skinTemp?: string;
  respiratoryRate?: string;
}

export default function ScuziChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hey there! I'm Scuzi, your AI food and health companion. I can help you with:\n\n🥗 Recipe ideas from leftover ingredients\n📊 Nutrition analysis of your meals\n🛒 Meal plans from grocery receipts\n🍳 Cooking tips and health advice\n\nJust chat with me or upload an image to get started!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [whoopMetrics, setWhoopMetrics] = useState<WhoopMetrics>({
    connected: false,
    sleep: null,
    strain: null,
    calories: null,
    recovery: null,
    hrv: null,
    rhr: null,
    avgHeartRate: null,
    spo2: null,
    skinTemp: null,
    respiratoryRate: null,
  });
  const [isConnectingWhoop, setIsConnectingWhoop] = useState(false);
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

  // Listen for postMessage from OAuth popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        console.warn('Ignoring message from unknown origin:', event.origin);
        return;
      }

      if (event.data.type === 'WHOOP_AUTH_SUCCESS') {
        console.log('✅ Received WHOOP auth success from popup');
        
        // Fetch updated metrics
        fetchWhoopMetrics();
        
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "✅ WHOOP connected successfully! I can now personalize recommendations based on your sleep, strain, and recovery data.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else if (event.data.type === 'WHOOP_AUTH_ERROR') {
        console.log('❌ Received WHOOP auth error from popup');
        
        const errorData = event.data.data;
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `❌ WHOOP connection failed: ${errorData.description || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch WHOOP metrics on mount
  useEffect(() => {
    fetchWhoopMetrics();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const fetchWhoopMetrics = async () => {
    try {
      const response = await fetch("/api/whoop/metrics");
      if (response.ok) {
        const data = await response.json();
        setWhoopMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching WHOOP metrics:", error);
    }
  };

  const handleWhoopConnect = async () => {
    setIsConnectingWhoop(true);
    try {
      const response = await fetch("/api/whoop/connect");
      if (response.ok) {
        const data = await response.json();
        
        // Show the exact redirect URI to the user for verification
        const infoMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `🔐 Opening WHOOP authentication...\n\n📍 Redirect URI being used:\n${data.redirectUri}\n\n⚠️ Make sure this EXACT URL (including https://) is registered in your WHOOP Developer Portal under "Authorized Redirect URIs"`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, infoMessage]);
        
        // Open WHOOP OAuth in a NEW tab/window (desktop & mobile)
        // This keeps the main app intact and prevents session breakage
        const authWindow = window.open(
          data.authUrl,
          "_blank",
          "noopener,noreferrer,width=600,height=700"
        );
        
        if (!authWindow) {
          // Popup blocked - show message
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: "⚠️ Please allow popups for this site to connect WHOOP. After allowing popups, click Connect again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
        
        setIsConnectingWhoop(false);
      }
    } catch (error) {
      console.error("Error connecting WHOOP:", error);
      setIsConnectingWhoop(false);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ Failed to initiate WHOOP connection. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleWhoopDisconnect = async () => {
    try {
      const response = await fetch("/api/whoop/disconnect", {
        method: "POST",
      });
      if (response.ok) {
        setWhoopMetrics({
          connected: false,
          sleep: null,
          strain: null,
          calories: null,
          recovery: null,
          hrv: null,
          rhr: null,
          avgHeartRate: null,
          spo2: null,
          skinTemp: null,
          respiratoryRate: null,
        });
      }
    } catch (error) {
      console.error("Error disconnecting WHOOP:", error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera not available:", error);
      // Fallback to file upload
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: selectedImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Filter out welcome message and only send actual conversation
      const conversationMessages = messages.filter((m) => m.id !== "welcome");
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...conversationMessages.map((m) => ({
              role: m.role,
              content: m.content,
              image: m.image,
            })),
            {
              role: "user",
              content: input,
              image: imageToSend,
            },
          ],
          whoopMetrics: whoopMetrics.connected ? whoopMetrics : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        thinking: data.thinking,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If the response suggests generating a meal image, trigger image generation
      if (data.shouldGenerateImage && data.mealDescription) {
        const imageResponse = await fetch("/api/generate-meal-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mealDescription: data.mealDescription,
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "Here's what that meal might look like:",
            image: imageData.imageUrl,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, imageMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Log more details for debugging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or check the console for details.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#1f2c33] border-b border-[#2a3942]">
        <div className="px-4 py-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-[#00a884] text-white">
              <ChefHat className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white font-medium">Scuzi</h1>
              <span className="text-[#8696a0] text-xs">•</span>
              <span className="text-[#8696a0] text-xs font-medium">WHOOP</span>
              {whoopMetrics.connected ? (
                <Button
                  onClick={handleWhoopDisconnect}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#2a3942]"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={handleWhoopConnect}
                  disabled={isConnectingWhoop}
                  size="sm"
                  className="h-6 px-2 text-xs bg-[#00a884] hover:bg-[#00a884]/90 text-white"
                >
                  {isConnectingWhoop ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
            <p className="text-[#8696a0] text-xs mt-1">Your AI Food & Health Assistant</p>
          </div>
        </div>
        
        {/* WHOOP Metrics Ticker */}
        <WhoopMetricsTicker metrics={whoopMetrics} />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="bg-[#1f2c33] p-4 flex justify-center gap-4">
            <Button
              onClick={closeCamera}
              size="lg"
              variant="ghost"
              className="text-white hover:bg-[#2a3942]"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              onClick={capturePhoto}
              size="lg"
              className="bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-full w-16 h-16"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0b141a] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxwYXRoIGQ9Ik0gMCw1MCBMIDUwLDAgTCAxMDAsNTAgTCA1MCwxMDAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExZTI2IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] bg-repeat">
        
        {/* WHOOP Data Chart - Show at top if connected */}
        {whoopMetrics.connected && (
          <div className="mb-4">
            <WhoopDataChart metrics={whoopMetrics} />
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2 max-w-[85%]",
              message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-[#00a884] text-white text-xs">
                  <ChefHat className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 shadow-sm",
                message.role === "user"
                  ? "bg-[#005c4b] text-white"
                  : "bg-[#1f2c33] text-white"
              )}
            >
              {message.thinking && (
                <div className="mb-2 pb-2 border-b border-[#2a3942]">
                  <p className="text-[#8696a0] text-xs italic">
                    💭 {message.thinking}
                  </p>
                </div>
              )}
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded content"
                  className="rounded-md mb-2 max-w-full h-auto"
                />
              )}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <p className="text-[#8696a0] text-[10px] mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 max-w-[85%] mr-auto">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-[#00a884] text-white text-xs">
                <ChefHat className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-[#1f2c33] rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#1f2c33] px-4 py-3 border-t border-[#2a3942]">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={selectedImage}
              alt="Selected"
              className="h-20 rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={startCamera}
            disabled={isLoading}
            className="text-[#8696a0] hover:text-white hover:bg-[#2a3942]"
          >
            <Camera className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-[#8696a0] hover:text-white hover:bg-[#2a3942]"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 min-h-[40px] max-h-[120px] bg-[#2a3942] border-none text-white placeholder:text-[#8696a0] resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            size="icon"
            className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}