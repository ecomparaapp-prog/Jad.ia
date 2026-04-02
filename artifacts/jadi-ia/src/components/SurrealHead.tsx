import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import headImage from "@assets/Gemini_Generated_Image_l7qqm3l7qqm3l7qq_1775115645274.png";

export function SurrealHead({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetRef.current = {
        x: ((e.clientY - cy) / (rect.height / 2)) * 6,
        y: ((e.clientX - cx) / (rect.width / 2)) * -6,
      };
    }

    function animate() {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.06;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.06;
      setTilt({ x: currentRef.current.x, y: currentRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ perspective: "1000px" }}>
      <style>{`
        @keyframes head-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes laser-pulse {
          0%, 100% { opacity: 0.7; filter: blur(2px) brightness(1); width: 160px; }
          50% { opacity: 1; filter: blur(0px) brightness(1.6); width: 200px; }
        }
        @keyframes laser-pulse-2 {
          0%, 100% { opacity: 0.5; filter: blur(3px) brightness(1); width: 120px; }
          50% { opacity: 0.9; filter: blur(1px) brightness(1.5); width: 170px; }
        }
        @keyframes orb-pulse-a {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes orb-pulse-b {
          0%, 100% { transform: scale(1.05); opacity: 0.8; }
          50% { transform: scale(0.92); opacity: 1; }
        }
        @keyframes orb-float-a {
          0%, 100% { top: 12%; right: 14%; }
          50% { top: 9%; right: 11%; }
        }
        @keyframes orb-float-b {
          0%, 100% { top: 20%; left: 12%; }
          50% { top: 17%; left: 15%; }
        }
        @keyframes orb-float-c {
          0%, 100% { bottom: 24%; right: 10%; }
          50% { bottom: 27%; right: 13%; }
        }
        @keyframes sparkle-in {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .head-float {
          animation: head-float 5s ease-in-out infinite;
        }
        .laser-beam { animation: laser-pulse 2.2s ease-in-out infinite; }
        .laser-beam-2 { animation: laser-pulse-2 1.8s ease-in-out infinite 0.4s; }
        .orb-a { animation: orb-pulse-a 2.4s ease-in-out infinite, orb-float-a 5s ease-in-out infinite; }
        .orb-b { animation: orb-pulse-b 2.1s ease-in-out infinite 0.6s, orb-float-b 4.5s ease-in-out infinite 0.8s; }
        .orb-c { animation: orb-pulse-a 2.8s ease-in-out infinite 1.2s, orb-float-c 5.5s ease-in-out infinite 0.3s; }
      `}</style>

      {/* Outer glow aura */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,100,200,0.12) 0%, rgba(100,255,180,0.08) 40%, transparent 70%)",
          filter: "blur(20px)",
          transform: "scale(1.3)",
        }}
      />

      {/* Tilt + float wrapper */}
      <div
        className="head-float relative"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.05s linear",
        }}
      >
        {/* The surreal head image — mix-blend-mode:screen removes black bg */}
        <motion.img
          src={headImage}
          alt="Jadi.ia Surreal AI Head"
          className="relative w-full h-full object-contain select-none"
          style={{
            mixBlendMode: "screen",
            filter: "brightness(1.1) saturate(1.2)",
            maxHeight: "520px",
          }}
          draggable={false}
        />

        {/* Neon laser beam from eye area (right side ~55% down, 60% right) */}
        <div
          className="laser-beam pointer-events-none absolute"
          style={{
            top: "47%",
            right: "18%",
            height: "3px",
            background: "linear-gradient(90deg, transparent 0%, #FF00FF 20%, #00FFFF 50%, #FF6600 80%, transparent 100%)",
            borderRadius: "4px",
            boxShadow: "0 0 8px 3px rgba(255,0,255,0.8), 0 0 20px 6px rgba(0,255,255,0.5), 0 0 40px 10px rgba(255,100,0,0.3)",
            transformOrigin: "left center",
            transform: "rotate(-8deg)",
          }}
        />
        <div
          className="laser-beam-2 pointer-events-none absolute"
          style={{
            top: "46%",
            right: "18%",
            height: "5px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,0,255,0.4) 20%, rgba(0,255,255,0.3) 60%, transparent 100%)",
            borderRadius: "4px",
            filter: "blur(4px)",
            transformOrigin: "left center",
            transform: "rotate(-8deg)",
          }}
        />

        {/* Secondary laser streak (upper) */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "33%",
            right: "15%",
            height: "2px",
            width: "90px",
            background: "linear-gradient(90deg, transparent, #FFFF00 40%, #FF8800, transparent)",
            borderRadius: "4px",
            boxShadow: "0 0 6px 2px rgba(255,255,0,0.6)",
            transform: "rotate(-20deg)",
            animation: "laser-pulse 3s ease-in-out infinite 1s",
          }}
        />

        {/* Floating orbs */}
        <div
          className="orb-a pointer-events-none absolute rounded-full"
          style={{
            top: "12%",
            right: "14%",
            width: "28px",
            height: "28px",
            background: "radial-gradient(circle at 35% 35%, #FF9040 0%, #E63900 100%)",
            boxShadow: "0 0 16px 6px rgba(255,100,0,0.7), 0 0 32px 10px rgba(255,100,0,0.3)",
          }}
        />
        <div
          className="orb-b pointer-events-none absolute rounded-full"
          style={{
            top: "20%",
            left: "12%",
            width: "20px",
            height: "20px",
            background: "radial-gradient(circle at 35% 35%, #FF50CC 0%, #CC00AA 100%)",
            boxShadow: "0 0 12px 5px rgba(255,0,200,0.7), 0 0 24px 8px rgba(200,0,180,0.3)",
          }}
        />
        <div
          className="orb-c pointer-events-none absolute rounded-full"
          style={{
            bottom: "24%",
            right: "10%",
            width: "16px",
            height: "16px",
            background: "radial-gradient(circle at 35% 35%, #40FFB0 0%, #00CC77 100%)",
            boxShadow: "0 0 10px 4px rgba(0,255,150,0.7), 0 0 20px 6px rgba(0,200,100,0.3)",
          }}
        />

        {/* Small accent orbs */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "62%",
            left: "8%",
            width: "10px",
            height: "10px",
            background: "radial-gradient(circle, #9B59F5 0%, #6B21E8 100%)",
            boxShadow: "0 0 8px 3px rgba(155,89,245,0.8)",
            animation: "orb-pulse-b 3.2s ease-in-out infinite 0.5s",
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "15%",
            left: "30%",
            width: "8px",
            height: "8px",
            background: "radial-gradient(circle, #00DDFF 0%, #0099CC 100%)",
            boxShadow: "0 0 6px 2px rgba(0,220,255,0.8)",
            animation: "orb-pulse-a 2.6s ease-in-out infinite 1.4s",
          }}
        />
      </div>

      {/* Ground glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "60%",
          height: "40px",
          background: "radial-gradient(ellipse, rgba(100,200,255,0.15) 0%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />
    </div>
  );
}
