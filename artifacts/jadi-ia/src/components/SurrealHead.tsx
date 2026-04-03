import { useRef, useEffect, useState } from "react";
import headImage from "@assets/Gemini_Generated_Image_l7qqm3l7qqm3l7qq_1775115645274.png";

interface Tilt { x: number; y: number }

export function SurrealHead({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });
  const rafRef    = useRef<number | null>(null);
  const targetRef = useRef<Tilt>({ x: 0, y: 0 });
  const currentRef = useRef<Tilt>({ x: 0, y: 0 });
  const isInsideRef = useRef(false);

  useEffect(() => {
    const MAX_DEG = 22;

    /* ── mouse tracking ── */
    function onMouseMove(e: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      isInsideRef.current = true;
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rawX = ((e.clientY - cy) / (rect.height / 2)) * MAX_DEG;
      const rawY = ((e.clientX - cx) / (rect.width  / 2)) * -MAX_DEG;
      targetRef.current = {
        x: Math.max(-MAX_DEG, Math.min(MAX_DEG, rawX)),
        y: Math.max(-MAX_DEG, Math.min(MAX_DEG, rawY)),
      };
    }

    function onMouseLeave() {
      isInsideRef.current = false;
      targetRef.current = { x: 0, y: 0 };
    }

    /* ── gyroscope (mobile) ── */
    function onOrientation(e: DeviceOrientationEvent) {
      if (isInsideRef.current) return; // mouse takes priority on desktop
      const gamma = Math.max(-MAX_DEG, Math.min(MAX_DEG, (e.gamma ?? 0) * 0.6));
      const beta  = Math.max(-MAX_DEG, Math.min(MAX_DEG, ((e.beta ?? 0) - 30) * 0.4));
      targetRef.current = { x: beta, y: -gamma };
    }

    /* ── smooth animation loop ── */
    function animate() {
      const LERP = 0.055;
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * LERP;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * LERP;
      setTilt({ x: currentRef.current.x, y: currentRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", onMouseMove);
    containerRef.current?.addEventListener("mouseleave", onMouseLeave);
    if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", onOrientation);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      containerRef.current?.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("deviceorientation", onOrientation as EventListener);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── derived values from tilt ── */
  const intensity = Math.sqrt(tilt.x * tilt.x + tilt.y * tilt.y) / 22; // 0–1
  // shadow moves opposite to rotation to simulate real depth
  const shadowX  =  tilt.y * 2.5;
  const shadowY  = -tilt.x * 2.5;
  const shadowBlur = 30 + intensity * 40;
  // edge glow center shifts with rotation
  const glowCX = 50 - tilt.y * 1.8;
  const glowCY = 50 + tilt.x * 1.8;
  // glow color cycles green→pink with angle
  const hue = 140 + tilt.y * 3 + tilt.x * 2;
  const glowAlpha = 0.18 + intensity * 0.25;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ perspective: "1000px", cursor: "none" }}
    >
      <style>{`
        @keyframes head-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes laser-pulse {
          0%, 100% { opacity: 0.7; filter: blur(2px)  brightness(1);   width: 160px; }
          50%       { opacity: 1;   filter: blur(0px)  brightness(1.6); width: 200px; }
        }
        @keyframes laser-pulse-2 {
          0%, 100% { opacity: 0.5; filter: blur(3px) brightness(1);   width: 120px; }
          50%       { opacity: 0.9; filter: blur(1px) brightness(1.5); width: 170px; }
        }
        @keyframes orb-pulse-a {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%       { transform: scale(1.12); opacity: 1;   }
        }
        @keyframes orb-pulse-b {
          0%, 100% { transform: scale(1.05); opacity: 0.8; }
          50%       { transform: scale(0.92); opacity: 1;   }
        }
        @keyframes orb-float-a {
          0%, 100% { top: 12%; right: 14%; }
          50%       { top: 9%;  right: 11%; }
        }
        @keyframes orb-float-b {
          0%, 100% { top: 20%; left: 12%; }
          50%       { top: 17%; left: 15%; }
        }
        @keyframes orb-float-c {
          0%, 100% { bottom: 24%; right: 10%; }
          50%       { bottom: 27%; right: 13%; }
        }
        .head-float { animation: head-float 5s ease-in-out infinite; }
        .laser-beam   { animation: laser-pulse   2.2s ease-in-out infinite;       }
        .laser-beam-2 { animation: laser-pulse-2 1.8s ease-in-out infinite 0.4s; }
        .orb-a { animation: orb-pulse-a 2.4s ease-in-out infinite,     orb-float-a 5s   ease-in-out infinite;       }
        .orb-b { animation: orb-pulse-b 2.1s ease-in-out infinite 0.6s, orb-float-b 4.5s ease-in-out infinite 0.8s; }
        .orb-c { animation: orb-pulse-a 2.8s ease-in-out infinite 1.2s, orb-float-c 5.5s ease-in-out infinite 0.3s; }
      `}</style>

      {/* Dynamic edge glow — shifts with rotation, simulating a light source */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 55% at ${glowCX}% ${glowCY}%, hsla(${hue},100%,65%,${glowAlpha}) 0%, transparent 70%)`,
          filter: "blur(24px)",
          transform: "scale(1.35)",
          transition: "background 0.12s linear",
          zIndex: 0,
        }}
      />

      {/* Tilt + float wrapper */}
      <div
        className="head-float relative"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.04s linear",
          zIndex: 1,
          filter: `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,200,160,${0.25 + intensity * 0.35}))`,
        }}
      >
        {/* Head image */}
        <img
          src={headImage}
          alt="Jad.ia Surreal AI Head"
          className="relative w-full h-full object-contain select-none"
          style={{
            mixBlendMode: "screen",
            filter: `brightness(${1.05 + intensity * 0.12}) saturate(1.2)`,
            maxHeight: "520px",
          }}
          draggable={false}
        />

        {/* Specular highlight — moves with tilt to simulate monitor light */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 40% 35% at ${50 - tilt.y * 1.5}% ${50 + tilt.x * 1.5}%, rgba(255,255,255,${0.04 + intensity * 0.1}) 0%, transparent 70%)`,
            borderRadius: "50%",
            mixBlendMode: "screen",
            transition: "background 0.08s linear",
          }}
        />

        {/* Neon laser beam */}
        <div className="laser-beam pointer-events-none absolute" style={{ top:"47%", right:"18%", height:"3px", background:"linear-gradient(90deg, transparent 0%, #FF00FF 20%, #00FFFF 50%, #FF6600 80%, transparent 100%)", borderRadius:"4px", boxShadow:"0 0 8px 3px rgba(255,0,255,0.8), 0 0 20px 6px rgba(0,255,255,0.5), 0 0 40px 10px rgba(255,100,0,0.3)", transformOrigin:"left center", transform:"rotate(-8deg)" }} />
        <div className="laser-beam-2 pointer-events-none absolute" style={{ top:"46%", right:"18%", height:"5px", background:"linear-gradient(90deg, transparent 0%, rgba(255,0,255,0.4) 20%, rgba(0,255,255,0.3) 60%, transparent 100%)", borderRadius:"4px", filter:"blur(4px)", transformOrigin:"left center", transform:"rotate(-8deg)" }} />
        <div className="pointer-events-none absolute" style={{ top:"33%", right:"15%", height:"2px", width:"90px", background:"linear-gradient(90deg, transparent, #FFFF00 40%, #FF8800, transparent)", borderRadius:"4px", boxShadow:"0 0 6px 2px rgba(255,255,0,0.6)", transform:"rotate(-20deg)", animation:"laser-pulse 3s ease-in-out infinite 1s" }} />

        {/* Floating orbs */}
        <div className="orb-a pointer-events-none absolute rounded-full" style={{ top:"12%", right:"14%", width:"28px", height:"28px", background:"radial-gradient(circle at 35% 35%, #FF9040 0%, #E63900 100%)", boxShadow:"0 0 16px 6px rgba(255,100,0,0.7), 0 0 32px 10px rgba(255,100,0,0.3)" }} />
        <div className="orb-b pointer-events-none absolute rounded-full" style={{ top:"20%", left:"12%", width:"20px", height:"20px", background:"radial-gradient(circle at 35% 35%, #FF50CC 0%, #CC00AA 100%)", boxShadow:"0 0 12px 5px rgba(255,0,200,0.7), 0 0 24px 8px rgba(200,0,180,0.3)" }} />
        <div className="orb-c pointer-events-none absolute rounded-full" style={{ bottom:"24%", right:"10%", width:"16px", height:"16px", background:"radial-gradient(circle at 35% 35%, #40FFB0 0%, #00CC77 100%)", boxShadow:"0 0 10px 4px rgba(0,255,150,0.7), 0 0 20px 6px rgba(0,200,100,0.3)" }} />
        <div className="pointer-events-none absolute rounded-full" style={{ top:"62%", left:"8%", width:"10px", height:"10px", background:"radial-gradient(circle, #9B59F5 0%, #6B21E8 100%)", boxShadow:"0 0 8px 3px rgba(155,89,245,0.8)", animation:"orb-pulse-b 3.2s ease-in-out infinite 0.5s" }} />
        <div className="pointer-events-none absolute rounded-full" style={{ top:"15%", left:"30%", width:"8px", height:"8px", background:"radial-gradient(circle, #00DDFF 0%, #0099CC 100%)", boxShadow:"0 0 6px 2px rgba(0,220,255,0.8)", animation:"orb-pulse-a 2.6s ease-in-out infinite 1.4s" }} />
      </div>

      {/* Ground glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width:"60%", height:"40px", background:"radial-gradient(ellipse, rgba(100,200,255,0.15) 0%, transparent 70%)", filter:"blur(10px)" }} />
    </div>
  );
}
