"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill = "transparent",
  blur = 10,
  speed = "slow",
  waveOpacity = 0.5,
  amplitudeFactor = 1,
  waveCount,
  waveColors,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast" | "recording";
  waveOpacity?: number;
  amplitudeFactor?: number;
  waveCount?: number;
  waveColors?: string[];
  [key: string]: any;
}) => {
  const noise = createNoise3D();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  let w: number,
    h: number,
    nt: number,
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null;
  let animationId = 0;

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.0008;
      case "fast":
        return 0.002;
      case "recording":
        return 0.004; // Significantly faster for recording state
      default:
        return 0.001;
    }
  };

  const defaultWaveColors = waveColors ?? colors ?? [
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#e879f9",
    "#22d3ee",
  ];

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;

    // Use alpha: true to allow underlying content to appear "through" the canvas
    ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Make sure the canvas itself has a transparent style
    canvas.style.backgroundColor = "transparent";

    w = (ctx.canvas.width = window.innerWidth);
    h = (ctx.canvas.height = window.innerHeight);

    // Use responsive blur depending on screen size
    const responsiveBlur = isMobile ? Math.max(blur * 0.5, 5) : blur;
    ctx.filter = `blur(${responsiveBlur}px)`;

    nt = 0;
    window.onresize = function () {
      w = (ctx!.canvas.width = window.innerWidth);
      h = (ctx!.canvas.height = window.innerHeight);
      const updatedBlur = window.innerWidth < 768 ? Math.max(blur * 0.5, 5) : blur;
      ctx!.filter = `blur(${updatedBlur}px)`;
    };

    render();
  };

  const drawWave = (count: number) => {
    if (!ctx) return;
    nt += getSpeed();

    // Responsive parameters
    const responsiveWaveWidth = waveWidth || (isMobile ? 30 : 50);
    
    // Faster wave movement during recording (smaller step = more detail)
    const waveStep = speed === "recording" ? (isMobile ? 2 : 3) : (isMobile ? 3 : 5);
    
    // Apply the amplitude factor
    const amplitude = 100 * (amplitudeFactor || 1);
    
    // Determine number of waves to draw
    const wavesToDraw = waveCount || (isMobile ? 6 : 5);
    
    for (let i = 0; i < wavesToDraw; i++) {
      ctx.beginPath();
      ctx.lineWidth = responsiveWaveWidth;
      
      // Get color from waveColors array
      ctx.strokeStyle = defaultWaveColors[i % defaultWaveColors.length];

      // Add some variance to each wave's amplitude in recording mode
      const waveAmplitude = speed === "recording" 
        ? amplitude * (1 + Math.sin(nt * 3 + i) * 0.2) 
        : amplitude;
      
      for (let x = 0; x < w; x += waveStep) {
        // Scale the noise to create more visible waves
        const noiseScale = speed === "recording" ? 400 : (isMobile ? 600 : 800);
        
        // Add more dynamic movement during recording with additional sin waves
        let y = noise(x / noiseScale, 0.3 * i, nt) * waveAmplitude;
        
        // Add extra movement patterns during recording
        if (speed === "recording") {
          y += Math.sin(x / 100 + nt * 5) * (amplitude * 0.15);
        }
        
        ctx.lineTo(x, y + h * 0.5);
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  const render = () => {
    if (!ctx) return;

    // Use the waveOpacity to control how "thick" or "heavy" the stroke looks
    ctx.globalAlpha = waveOpacity || 1;

    if (backgroundFill === "transparent") {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, w, h);
    }
    
    // Draw waves
    drawWave(waveCount || (isMobile ? 6 : 5));

    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, speed, amplitudeFactor]); // Re-initialize when any of these values change

  // Safari detection (unchanged)
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col items-center justify-center bg-transparent",
        containerClassName
      )}
      {...props}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
        className="absolute inset-0 z-0 w-full h-full bg-transparent"
        style={{
          background: "transparent",
          // Safari blur fallback - use responsive blur
          ...(isSafari ? { filter: `blur(${isMobile ? Math.max(blur * 0.5, 5) : blur}px)` } : {}),
        }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};
