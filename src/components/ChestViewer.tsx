"use client";

import {
  Suspense,
  useEffect,
  useState,
  useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Html, Clone, Environment } from "@react-three/drei";
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
  "/0.glb":   { label: "Así se ve tu seguridad en este momento",        sub: "Tu organización requiere atención urgente — empieza hoy"     },
  "/20.glb":  { label: "Tu seguridad está empezando a mejorar",         sub: "Vas por buen camino, pero aún quedan brechas importantes"   },
  "/40.glb":  { label: "Buen progreso — tu seguridad se fortalece",     sub: "Ya superaste la mitad del camino hacia el cumplimiento"     },
  "/60.glb":  { label: "Casi fortalecido — ¡estás muy cerca!",          sub: "Solo unas pocas brechas más y tu organización estará segura" },
  "/100.glb": { label: "¡Tu organización está completamente protegida!", sub: "Cumplimiento total Ley 1581 — ¡felicitaciones!"              },
};

// ── Loading indicator inside Canvas ────────────────────────────────────────
function CanvasLoader() {
  return (
    <Html center>
      <div style={{
        width: "32px", height: "32px",
        border: "3px solid rgba(240,180,41,0.2)",
        borderTopColor: "#f0b429",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <group ref={groupRef} scale={[1.9, 1.9, 1.9]}>
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
      <mesh position={[0, -0.08, 0.52]}>
        <boxGeometry args={[0.22, 0.26, 0.06]} />
        <meshStandardMaterial color={mainColor} emissive={mainColor} emissiveIntensity={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.14, 0.52]}>
        <torusGeometry args={[0.1, 0.025, 8, 16, Math.PI]} />
        <meshStandardMaterial color={mainColor} emissive={mainColor} emissiveIntensity={0.3} metalness={0.9} />
      </mesh>
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
function ChestModel({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);

  // Auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.38;
  });

  // Scale-in pop on mount
  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    group.scale.set(0.02, 0.02, 0.02);
    gsap.to(group.scale, { x: 1.9, y: 1.9, z: 1.9, duration: 0.65, ease: "back.out(1.5)" });
  }, []);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Clone de drei: clona geometría con texturas correctamente referenciadas */}
      <Clone object={scene} />
    </group>
  );
}

// Silencia el error de texturas KTX2/comprimidas que el browser no puede decodificar.
THREE.DefaultLoadingManager.onError = (url: string) => {
  if (url.startsWith("blob:")) return;
  console.error("THREE LoadingManager error:", url);
};

// ── Smart loader — bypass HEAD check ──────────────────────
function SmartChestLoader({ path, score }: { path: string; score: number }) {
  // Eliminamos el fetch HEAD que causaba el bloque azul falso negativo.
  // Cargamos directamente el GLB. Si falla (ej: archivo no existe), muestra el spinner o falla limpiamente.
  return (
    <Suspense fallback={<CanvasLoader />}>
      <ChestModel path={path} />
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
          height: "420px",
          background: "linear-gradient(160deg, #0d1f33 0%, #1a3a5c 100%)",
        }}
      >
        <Canvas
          camera={{ position: [0, 0.5, 3.8], fov: 58 }}
          gl={{ antialias: true, alpha: false }}
          shadows
        >
          <color attach="background" args={["#0d1f33"]} />
          
          <Environment preset="studio" />

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