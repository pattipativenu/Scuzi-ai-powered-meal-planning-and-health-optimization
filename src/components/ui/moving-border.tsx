"use client";
import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  as?: any;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Component
      className={cn(
        "bg-transparent relative text-xl h-16 w-40 p-[1px] overflow-hidden",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-20 w-20 opacity-[0.8] bg-[radial-gradient(var(--yellow-400)_40%,transparent_60%)]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>
      <div
        className={cn(
          "relative bg-slate-900/[0.8] border border-slate-800 backdrop-blur-xl text-white flex items-center justify-center w-full h-full text-sm antialiased",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 2000,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: any;
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue<number>(0);
  
  // Create a rounded rectangle path
  const createRoundedRectPath = (width: number, height: number, rx: number, ry: number) => {
    return `M ${rx},0 L ${width - rx},0 Q ${width},0 ${width},${ry} L ${width},${height - ry} Q ${width},${height} ${width - rx},${height} L ${rx},${height} Q 0,${height} 0,${height - ry} L 0,${ry} Q 0,0 ${rx},0 Z`;
  };

  useAnimationFrame((time) => {
    try {
      const length = pathRef.current?.getTotalLength();
      if (length && length > 0) {
        const pxPerMillisecond = length / duration;
        progress.set((time * pxPerMillisecond) % length);
      }
    } catch (error) {
      // Silently handle any SVG path errors
      console.warn('MovingBorder: SVG path error', error);
    }
  });

  const x = useTransform(
    progress,
    (val) => {
      try {
        return pathRef.current?.getPointAtLength(val)?.x || 0;
      } catch {
        return 0;
      }
    }
  );
  const y = useTransform(
    progress,
    (val) => {
      try {
        return pathRef.current?.getPointAtLength(val)?.y || 0;
      } catch {
        return 0;
      }
    }
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        {...otherProps}
      >
        <path
          fill="none"
          d={createRoundedRectPath(100, 100, 15, 15)}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};