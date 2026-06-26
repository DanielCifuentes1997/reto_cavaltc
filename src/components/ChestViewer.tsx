"use client";

import {
  Suspense,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useStore } from "@/lib/store/useStore";

// ── Model path logic ────────────────────────────────────────────────────────
// Files must be placed in /public/: 0.glb, 25.glb, 50.glb, 75.glb, 100.glb
export function getModelPath(score: number): string {
  if (score <= 20)  return "/0.glb";
  if (score <= 50)  return "/20.glb";
  if (score <= 70)  return "/40.glb";
  if (score <= 99)  return "/60.glb";
  return "/100.glb";
}

const STAGE_LABELS: Record<string, { label: string; sub: string }> = {
  "/0.glb":   { label: "Cofre dañado",      sub: "Estado inicial — sin protección"    },
  "/20.glb":  { label: "En reparación",     sub: "Primeras medidas implementadas"     },
  "/40.glb":  { label: "Reconstruyéndose",  sub: "Avance significativo"               },
  "/60.glb":  { label: "Casi fortalecido",  sub: "Brechas menores pendientes"         },
  "/100.glb": { label: "Fortaleza total",   sub: "Cumplimiento Ley 1581 alcanzado"    },
};

// ── Loading indicator inside Canvas ────────────────────────────────────────
function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", userSelect: "none" }}>
        <div style={{ fontSize: "22px", fontWeight: "800", color: "#f0b429" }}>
          {Math.round(progress)}%
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
          Cargando modelo...
        </div>
      </div>
    </Html>
  );
}

// ── Fallback geometry (shown when GLB files are not uploaded yet) ───────────
function PlaceholderChest({ score }: { score: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.45;
  });

  const mainColor = score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";
  const bodyColor = "#1a3a5c";
  const lidColor = "#243f66";

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[1.6, 0.75, 1.0]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={mainColor}
          emissiveIntensity={0.08}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.32, -0.12]} castShadow>
        <boxGeometry args={[1.6, 0.38, 0.76]} />
        <meshStandardMaterial
          color={lidColor}
          emissive={mainColor}
          emissiveIntensity={0.12}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>
      {/* Lock body */}
      <mesh position={[0, -0.08, 0.52]}>
        <boxGeometry args={[0.22, 0.26, 0.06]} />
        <meshStandardMaterial color={mainColor} emissive={mainColor} emissiveIntensity={0.4} metalness={0.8} />
      </mesh>
      {/* Lock shackle */}
      <mesh position={[0, 0.14, 0.52]}>
        <torusGeometry args={[0.1, 0.025, 8, 16, Math.PI]} />
        <meshStandardMaterial color={mainColor} emissive={mainColor} emissiveIntensity={0.3} metalness={0.9} />
      </mesh>
      {/* Corner bands */}
      {([-0.75, 0.75] as number[]).map((x) => (
        <mesh key={x} position={[x, -0.07, 0]} castShadow>
          <boxGeometry args={[0.06, 0.85, 1.06]} />
          <meshStandardMaterial color={mainColor} emissive={mainColor} emissiveIntensity={0.2} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── Real GLB model ──────────────────────────────────────────────────────────
function ChestModel({ path, score }: { path: string; score: number }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);

  // Deep clone so each instance has independent materials
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.38;
  });

  // Scale-in pop + emissive glow on mount
  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    group.scale.set(0.02, 0.02, 0.02);
    gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 0.65, ease: "back.out(1.5)" });

    const emissiveHex = score >= 80 ? 0x22c55e : score >= 50 ? 0xf0b429 : 0x1a3a5c;
    const emissiveIntensity = (score / 100) * 0.28;

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (mat.emissive !== undefined) {
          mat.emissive.setHex(emissiveHex);
          mat.emissiveIntensity = emissiveIntensity;
          mat.needsUpdate = true;
        }
      });
    });
  }, [cloned, score]);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ── Smart loader — checks if GLB exists before loading ──────────────────────
// useGLTF throws through R3F's Suspense layer, bypassing React ErrorBoundary.
// A HEAD check upfront avoids the throw entirely.
function SmartChestLoader({ path, score }: { path: string; score: number }) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setAvailable(null);
    fetch(path, { method: "HEAD" })
      .then((r) => setAvailable(r.ok))
      .catch(() => setAvailable(false));
  }, [path]);

  if (available === null) return <CanvasLoader />;
  if (!available) return <PlaceholderChest score={score} />;

  return (
    <Suspense fallback={<CanvasLoader />}>
      <ChestModel path={path} score={score} />
    </Suspense>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function ChestViewer() {
  const score = useStore((s) => s.score);
  const modelPath = getModelPath(score);
  const stageInfo = STAGE_LABELS[modelPath];

  return (
    <div className="flex flex-col gap-2">
      {/* Canvas */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          height: "240px",
          background: "linear-gradient(160deg, #0d1f33 0%, #1a3a5c 100%)",
        }}
      >
        <Canvas
          camera={{ position: [0, 1.0, 3.5], fov: 44 }}
          gl={{ antialias: true, alpha: false }}
          shadows
        >
          <color attach="background" args={["#0d1f33"]} />

          <ambientLight intensity={0.45} />
          <directionalLight
            position={[4, 6, 4]}
            intensity={1.3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-3, 2, 2]} intensity={0.9} color="#f0b429" />
          <pointLight position={[3, -1, 3]} intensity={0.3} color="#4080c0" />

          {/* key remounts SmartChestLoader on path change (resets the HEAD check) */}
          <SmartChestLoader key={modelPath} path={modelPath} score={score} />
        </Canvas>
      </div>

      {/* Stage label */}
      <div className="text-center px-2">
        <p className="text-cavaltec-gold text-xs font-bold leading-snug">{stageInfo.label}</p>
        <p className="text-slate-400 text-xs">{stageInfo.sub}</p>
      </div>
    </div>
  );
}
