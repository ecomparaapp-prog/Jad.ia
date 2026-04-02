import { useRef, useMemo, useEffect, useState, Component } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── WebGL Error Boundary ────────────────────────────────────────
class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── CSS Fallback: animated neural network SVG ───────────────────
function NeuralFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full max-w-xs max-h-xs"
        style={{ filter: "drop-shadow(0 0 24px rgba(0,137,123,0.4))" }}
      >
        <defs>
          <radialGradient id="glow-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#26C6B0" stopOpacity="1"/>
            <stop offset="100%" stopColor="#004D40" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="glow-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFA726" stopOpacity="1"/>
            <stop offset="100%" stopColor="#FF8C00" stopOpacity="0"/>
          </radialGradient>

          {/* Pulse animations */}
          <style>{`
            @keyframes pulse-node {
              0%, 100% { r: 4; opacity: 0.5; }
              50% { r: 6; opacity: 1; }
            }
            @keyframes dash-flow1 {
              0% { stroke-dashoffset: 200; opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { stroke-dashoffset: 0; opacity: 0; }
            }
            @keyframes dash-flow2 {
              0% { stroke-dashoffset: 160; opacity: 0; }
              20% { opacity: 0.8; }
              80% { opacity: 0.8; }
              100% { stroke-dashoffset: 0; opacity: 0; }
            }
            @keyframes head-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            @keyframes spin-ring {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .head-group {
              animation: head-float 4s ease-in-out infinite;
              transform-origin: center;
            }
            .node-a { animation: pulse-node 2.1s ease-in-out infinite; }
            .node-b { animation: pulse-node 1.8s ease-in-out infinite 0.4s; }
            .node-c { animation: pulse-node 2.5s ease-in-out infinite 0.9s; }
            .node-d { animation: pulse-node 1.6s ease-in-out infinite 1.3s; }
            .node-e { animation: pulse-node 2.2s ease-in-out infinite 0.6s; }
            .edge-pulse-1 {
              stroke-dasharray: 8 4;
              animation: dash-flow1 2.4s linear infinite;
            }
            .edge-pulse-2 {
              stroke-dasharray: 8 4;
              animation: dash-flow2 1.9s linear infinite 0.7s;
            }
            .edge-pulse-3 {
              stroke-dasharray: 8 4;
              animation: dash-flow1 2.8s linear infinite 1.2s;
            }
            .edge-pulse-4 {
              stroke-dasharray: 8 4;
              animation: dash-flow2 2.1s linear infinite 0.3s;
            }
          `}</style>
        </defs>

        {/* Ambient glow background */}
        <ellipse cx="200" cy="210" rx="90" ry="110" fill="url(#glow-green)" opacity="0.08"/>
        <ellipse cx="200" cy="210" rx="70" ry="90" fill="url(#glow-orange)" opacity="0.05"/>

        {/* ── HEAD OUTLINE GROUP ── */}
        <g className="head-group">
          {/* Skull outline */}
          <ellipse cx="200" cy="185" rx="85" ry="100" fill="none" stroke="#00897B" strokeWidth="1.2" strokeOpacity="0.25"/>

          {/* ── Dim edges (skeleton) ── */}
          {/* Top crown */}
          <line x1="200" y1="85" x2="160" y2="105" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="200" y1="85" x2="240" y2="105" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="160" y1="105" x2="130" y2="140" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="240" y1="105" x2="270" y2="140" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="130" y1="140" x2="120" y2="185" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="270" y1="140" x2="280" y2="185" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="120" y1="185" x2="130" y2="230" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="280" y1="185" x2="270" y2="230" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="130" y1="230" x2="160" y2="260" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="270" y1="230" x2="240" y2="260" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="160" y1="260" x2="200" y2="275" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          <line x1="240" y1="260" x2="200" y2="275" stroke="#004D40" strokeWidth="1" opacity="0.3"/>
          {/* Cross connections */}
          <line x1="160" y1="105" x2="200" y2="115" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="240" y1="105" x2="200" y2="115" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="130" y1="140" x2="170" y2="150" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="270" y1="140" x2="230" y2="150" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="170" y1="150" x2="200" y2="145" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="230" y1="150" x2="200" y2="145" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="120" y1="185" x2="160" y2="185" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="280" y1="185" x2="240" y2="185" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="160" y1="185" x2="200" y2="190" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="240" y1="185" x2="200" y2="190" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          {/* Face features */}
          <line x1="175" y1="165" x2="165" y2="175" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="225" y1="165" x2="235" y2="175" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="200" y1="200" x2="190" y2="215" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="200" y1="200" x2="210" y2="215" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="180" y1="235" x2="200" y2="240" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          <line x1="220" y1="235" x2="200" y2="240" stroke="#004D40" strokeWidth="1" opacity="0.25"/>
          {/* Neck */}
          <line x1="185" y1="275" x2="185" y2="305" stroke="#004D40" strokeWidth="1" opacity="0.2"/>
          <line x1="215" y1="275" x2="215" y2="305" stroke="#004D40" strokeWidth="1" opacity="0.2"/>
          <line x1="185" y1="305" x2="215" y2="305" stroke="#004D40" strokeWidth="1" opacity="0.2"/>

          {/* ── Animated pulse edges ── */}
          <line className="edge-pulse-1" x1="200" y1="85" x2="160" y2="105" stroke="#26C6B0" strokeWidth="2"/>
          <line className="edge-pulse-2" x1="130" y1="140" x2="120" y2="185" stroke="#FFA726" strokeWidth="2"/>
          <line className="edge-pulse-3" x1="240" y1="185" x2="270" y2="230" stroke="#26C6B0" strokeWidth="2"/>
          <line className="edge-pulse-4" x1="175" y1="165" x2="200" y2="190" stroke="#FFA726" strokeWidth="2"/>
          <line className="edge-pulse-1" x1="130" y1="230" x2="160" y2="260" stroke="#26C6B0" strokeWidth="2" style={{ animationDelay: "1s" }}/>
          <line className="edge-pulse-2" x1="160" y1="185" x2="130" y2="140" stroke="#FFA726" strokeWidth="2" style={{ animationDelay: "0.5s" }}/>
          <line className="edge-pulse-3" x1="200" y1="145" x2="160" y2="185" stroke="#26C6B0" strokeWidth="2" style={{ animationDelay: "1.5s" }}/>
          <line className="edge-pulse-4" x1="200" y1="275" x2="215" y2="305" stroke="#FFA726" strokeWidth="2" style={{ animationDelay: "0.8s" }}/>

          {/* ── Nodes ── */}
          <circle className="node-a" cx="200" cy="85" r="5" fill="#26C6B0"/>
          <circle className="node-b" cx="160" cy="105" r="4" fill="#26C6B0" opacity="0.7"/>
          <circle className="node-b" cx="240" cy="105" r="4" fill="#26C6B0" opacity="0.7"/>
          <circle className="node-c" cx="130" cy="140" r="4" fill="#004D40" opacity="0.5"/>
          <circle className="node-c" cx="270" cy="140" r="4" fill="#004D40" opacity="0.5"/>
          <circle className="node-d" cx="120" cy="185" r="3.5" fill="#004D40" opacity="0.4"/>
          <circle className="node-d" cx="280" cy="185" r="3.5" fill="#004D40" opacity="0.4"/>
          <circle className="node-e" cx="200" cy="115" r="4" fill="#26C6B0" opacity="0.6"/>
          <circle className="node-a" cx="170" cy="150" r="3.5" fill="#004D40" opacity="0.5" style={{ animationDelay: "0.3s" }}/>
          <circle className="node-a" cx="230" cy="150" r="3.5" fill="#004D40" opacity="0.5" style={{ animationDelay: "0.6s" }}/>
          <circle className="node-b" cx="200" cy="145" r="4.5" fill="#26C6B0" opacity="0.65"/>
          <circle className="node-c" cx="160" cy="185" r="4" fill="#26C6B0" opacity="0.55"/>
          <circle className="node-c" cx="240" cy="185" r="4" fill="#26C6B0" opacity="0.55"/>
          <circle className="node-e" cx="200" cy="190" r="5" fill="#FFA726" opacity="0.8"/>
          {/* Eye nodes */}
          <circle className="node-a" cx="175" cy="165" r="4.5" fill="#FFA726" opacity="0.9" style={{ animationDelay: "0.2s" }}/>
          <circle className="node-a" cx="225" cy="165" r="4.5" fill="#FFA726" opacity="0.9" style={{ animationDelay: "0.7s" }}/>
          {/* Mouth / chin */}
          <circle className="node-b" cx="180" cy="235" r="3.5" fill="#26C6B0" opacity="0.5" style={{ animationDelay: "0.5s" }}/>
          <circle className="node-b" cx="220" cy="235" r="3.5" fill="#26C6B0" opacity="0.5" style={{ animationDelay: "1s" }}/>
          <circle className="node-d" cx="200" cy="240" r="4" fill="#004D40" opacity="0.45"/>
          <circle className="node-e" cx="130" cy="230" r="3.5" fill="#004D40" opacity="0.4" style={{ animationDelay: "0.4s" }}/>
          <circle className="node-e" cx="270" cy="230" r="3.5" fill="#004D40" opacity="0.4" style={{ animationDelay: "0.9s" }}/>
          <circle className="node-c" cx="160" cy="260" r="4" fill="#26C6B0" opacity="0.5"/>
          <circle className="node-c" cx="240" cy="260" r="4" fill="#26C6B0" opacity="0.5"/>
          <circle className="node-a" cx="200" cy="275" r="5" fill="#26C6B0" opacity="0.7"/>
          <circle className="node-d" cx="185" cy="305" r="3.5" fill="#004D40" opacity="0.35"/>
          <circle className="node-d" cx="215" cy="305" r="3.5" fill="#004D40" opacity="0.35"/>

          {/* Glow rings on key nodes */}
          <circle cx="200" cy="85" r="10" fill="none" stroke="#26C6B0" strokeWidth="1" opacity="0.2"/>
          <circle cx="175" cy="165" r="9" fill="none" stroke="#FFA726" strokeWidth="1" opacity="0.25"/>
          <circle cx="225" cy="165" r="9" fill="none" stroke="#FFA726" strokeWidth="1" opacity="0.25"/>
          <circle cx="200" cy="190" r="10" fill="none" stroke="#FFA726" strokeWidth="1" opacity="0.2"/>
        </g>
      </svg>
    </div>
  );
}

// ─── 3D Neural Scene ─────────────────────────────────────────────
const HEAD_POINTS = [
  [0, 1.4, 0.2], [0.35, 1.25, 0.3], [-0.35, 1.25, 0.3],
  [0.6, 1.0, 0.3], [-0.6, 1.0, 0.3], [0.72, 0.7, 0.2], [-0.72, 0.7, 0.2],
  [0, 1.35, 0.55], [0.3, 1.15, 0.58], [-0.3, 1.15, 0.58],
  [0.5, 0.85, 0.6], [-0.5, 0.85, 0.6],
  [0, 0.9, 0.72], [0.25, 0.8, 0.74], [-0.25, 0.8, 0.74],
  [0.45, 0.65, 0.68], [-0.45, 0.65, 0.68],
  [0.35, 0.5, 0.72], [-0.35, 0.5, 0.72],
  [0.55, 0.48, 0.62], [-0.55, 0.48, 0.62],
  [0.2, 0.52, 0.73], [-0.2, 0.52, 0.73],
  [0, 0.35, 0.75], [0.12, 0.2, 0.74], [-0.12, 0.2, 0.74],
  [0, 0.1, 0.72], [0.18, 0.08, 0.68], [-0.18, 0.08, 0.68],
  [0.62, 0.3, 0.52], [-0.62, 0.3, 0.52],
  [0.7, 0.1, 0.38], [-0.7, 0.1, 0.38],
  [0.65, -0.1, 0.3], [-0.65, -0.1, 0.3],
  [0, -0.05, 0.73], [0.2, -0.08, 0.72], [-0.2, -0.08, 0.72],
  [0.35, -0.15, 0.65], [-0.35, -0.15, 0.65],
  [0, -0.28, 0.7], [0.2, -0.32, 0.65], [-0.2, -0.32, 0.65],
  [0.4, -0.3, 0.55], [-0.4, -0.3, 0.55],
  [0, -0.55, 0.6], [0.2, -0.5, 0.58], [-0.2, -0.5, 0.58],
  [0.4, -0.55, 0.45], [-0.4, -0.55, 0.45],
  [0.8, 0.3, 0.0], [-0.8, 0.3, 0.0],
  [0.82, 0.1, -0.05], [-0.82, 0.1, -0.05],
  [0.8, -0.1, 0.0], [-0.8, -0.1, 0.0],
  [0, 1.2, -0.45], [0.35, 1.0, -0.5], [-0.35, 1.0, -0.5],
  [0.6, 0.7, -0.45], [-0.6, 0.7, -0.45],
  [0.7, 0.3, -0.35], [-0.7, 0.3, -0.35],
  [0.55, -0.2, -0.3], [-0.55, -0.2, -0.3],
  [0, -0.6, -0.2], [0.3, -0.6, -0.2], [-0.3, -0.6, -0.2],
  [0.22, -0.75, 0.18], [-0.22, -0.75, 0.18],
  [0.22, -0.75, -0.1], [-0.22, -0.75, -0.1],
  [0, -0.95, 0.1],
];

function buildConnections(pts: number[][], maxDist: number, maxPerNode: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    let count = 0;
    const sorted = pts
      .map((p, j) => ({ j, d: Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]) }))
      .filter(({ j, d }) => j !== i && d < maxDist && d > 0.01)
      .sort((a, b) => a.d - b.d);
    for (const { j } of sorted) {
      if (count >= maxPerNode) break;
      if (!edges.find((e) => e[0] === j && e[1] === i)) {
        edges.push([i, j]);
        count++;
      }
    }
  }
  return edges;
}

interface PulseState { edge: number; t: number; speed: number; color: THREE.Color; }

function NeuralScene({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const groupRef = useRef<THREE.Group>(null!);

  const points = useMemo(() => HEAD_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])), []);
  const connections = useMemo(() => buildConnections(HEAD_POINTS, 0.55, 4), []);

  const nodeGeo = useMemo(() => new THREE.SphereGeometry(0.022, 6, 6), []);
  const greenMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#00897B") }), []);
  const dimMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#004D40"), opacity: 0.5, transparent: true }), []);

  const lineGeometries = useMemo(() =>
    connections.map(([a, b]) => new THREE.BufferGeometry().setFromPoints([points[a], points[b]])),
    [connections, points]);

  const lineMats = useMemo(() =>
    connections.map(() => new THREE.LineBasicMaterial({ color: new THREE.Color("#004D40"), opacity: 0.25, transparent: true })),
    [connections]);

  const pulseLineMats = useMemo(() =>
    connections.map(() => new THREE.LineBasicMaterial({ color: new THREE.Color("#00897B"), opacity: 0, transparent: true })),
    [connections]);

  const pulses = useRef<PulseState[]>([]);
  const pulseTimer = useRef(0);

  useEffect(() => {
    return () => {
      nodeGeo.dispose();
      greenMat.dispose();
      dimMat.dispose();
      lineGeometries.forEach((g) => g.dispose());
      lineMats.forEach((m) => m.dispose());
      pulseLineMats.forEach((m) => m.dispose());
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.18;
    const targetX = mouse.current[1] * 0.25;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;

    pulseTimer.current += delta;
    if (pulseTimer.current > 0.08) {
      pulseTimer.current = 0;
      const edgeIdx = Math.floor(Math.random() * connections.length);
      pulses.current.push({
        edge: edgeIdx,
        t: 0,
        speed: 1.2 + Math.random() * 1.6,
        color: new THREE.Color(Math.random() < 0.35 ? "#FFA726" : "#26C6B0"),
      });
    }
    pulses.current = pulses.current.filter((p) => p.t <= 1.0);
    for (const p of pulses.current) {
      p.t += delta * p.speed;
      const mat = pulseLineMats[p.edge];
      const alpha = p.t < 0.5 ? p.t * 2 : (1 - p.t) * 2;
      mat.color.copy(p.color);
      mat.opacity = Math.max(0, alpha * 0.95);
      mat.needsUpdate = true;
    }
    for (let i = 0; i < pulseLineMats.length; i++) {
      if (!pulses.current.find((p) => p.edge === i)) {
        if (pulseLineMats[i].opacity > 0) {
          pulseLineMats[i].opacity = 0;
          pulseLineMats[i].needsUpdate = true;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {connections.map((_, i) => (
        <line key={`dim-${i}`} geometry={lineGeometries[i]} material={lineMats[i]} />
      ))}
      {connections.map((_, i) => (
        <line key={`pulse-${i}`} geometry={lineGeometries[i]} material={pulseLineMats[i]} />
      ))}
      {points.map((pt, i) => (
        <mesh key={`node-${i}`} geometry={nodeGeo} material={i % 5 === 0 ? greenMat : dimMat} position={pt} />
      ))}
    </group>
  );
}

function ThreeCanvas({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <NeuralScene mouse={mouse} />
    </Canvas>
  );
}

// ─── Public component ─────────────────────────────────────────────
export function NeuralHead({ className = "" }: { className?: string }) {
  const mouse = useRef<[number, number]>([0, 0]);
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, failIfMajorPerformanceCaveat: false });
      renderer.dispose();
      setWebGLSupported(true);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouse.current = [x, y];
  }

  // While detecting
  if (webGLSupported === null) {
    return <div className={className}><NeuralFallback /></div>;
  }

  if (!webGLSupported) {
    return <div className={className}><NeuralFallback /></div>;
  }

  return (
    <div className={className} onMouseMove={handleMouseMove} onMouseLeave={() => { mouse.current = [0, 0]; }}>
      <WebGLErrorBoundary fallback={<NeuralFallback />}>
        <ThreeCanvas mouse={mouse} />
      </WebGLErrorBoundary>
    </div>
  );
}
