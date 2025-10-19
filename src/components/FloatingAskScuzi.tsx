"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export function FloatingAskScuzi() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on chat page
  if (pathname === "/chat") return null;

  const handleClick = () => {
    router.push("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="md:hidden fixed left-4 right-4 z-40"
      style={{ bottom: "84px" }}
    >
      <button
        onClick={handleClick}
        className="w-full h-14 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(to right, rgb(0, 0, 0), rgb(38, 38, 38))",
        }}
      >
        <MessageCircle className="w-5 h-5 text-white" />
        <span
          style={{
            fontFamily: '"Right Grotesk Wide", sans-serif',
            fontSize: "16px",
            fontWeight: 700,
            color: "white",
            letterSpacing: "0.3px",
          }}
        >
          💬 Ask Scuzi anything…
        </span>
      </button>
    </motion.div>
  );
}