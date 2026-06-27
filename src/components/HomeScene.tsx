"use client";

import { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── Particles ──────────────────────────────────────────────────────────────────
function CavaltecParticles({ count = 70 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9;

      if (i % 3 === 0) {
        // gold
        colors[i * 3 + 0] = 0.94;
        colors[i * 3 + 1] = 0.71;
        colors[i * 3 + 2] = 0.16;
      } else {
        // blue
        colors[i * 3 + 0] = 0.1;
        colors[i * 3 + 1] = 0.38;
        colors[i * 3 + 2] = 0.75;
      }
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y = t * 0.014;
    mesh.current.rotation.x = t * 0.007;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.038}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.55}
      />
    </points>
  );
}

// ── Camera rig with ScrollTrigger ──────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.8,
      },
    });

    tl.to(camera.position, { z: 3.0, y: -0.7, ease: "power2.inOut" });
    tl.to(camera.rotation, { x: 0.13, ease: "power2.inOut" }, "<");

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [camera]);

  return null;
}

// ── Loading spinner ────────────────────────────────────────────────────────────
function CanvasLoader() {
  return (
    <Html center>
      <div style={{
        width: "36px", height: "36px",
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

// ── Placeholder if home.glb not found ─────────────────────────────────────────
function PlaceholderModel({ hovered }: { hovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;
    groupRef.current.rotation.y += hovered ? 0.018 : 0.008;
    groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.06;
    const base = hovered ? 1.08 : 1.0;
    const breath = Math.sin(t * 1.2) * 0.015;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, base + breath, 0.08)
    );
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.5) * 2;
      lightRef.current.position.y = Math.cos(t * 0.3) * 1.5;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity, hovered ? 5 : 3.5, 0.05
      );
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} color="#f0b429" distance={18} decay={2} position={[2, 1, 3]} />
      <pointLight position={[0, 0, -5]} intensity={8} color="#1a60c0" distance={20} decay={2} />
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.8, 1.0, 1.6, 6]} />
          <meshStandardMaterial color="#1a3a5c" metalness={0.8} roughness={0.2} emissive="#0d2744" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.80, 1.62, 6]} />
          <meshStandardMaterial color="#f0b429" metalness={0.9} roughness={0.1} emissive="#f0b429" emissiveIntensity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ── Real home.glb model ────────────────────────────────────────────────────────
function HomeModel() {
  const { scene } = useGLTF("/home.glb");
  const groupRef = useRef<THREE.Group>(null);
  const mainLightRef = useRef<THREE.PointLight>(null);
  
  const hoveredRef = useRef(false);
  const isAnimatingRef = useRef(false);

  // CORRECCIÓN DE OPACIDAD: Ajustamos el material del modelo clonado 
  // para que reaccione a luces normales sin depender de descargas de internet
  const cloned = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Reducimos el metalness para evitar que se vea opaco/negro
        child.material.metalness = Math.min(child.material.metalness, 0.5);
        child.material.needsUpdate = true;
      }
    });
    return model;
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (mainLightRef.current) {
      mainLightRef.current.position.x = Math.sin(t * 0.5) * 2.2;
      mainLightRef.current.position.y = Math.cos(t * 0.3) * 1.5;
      mainLightRef.current.intensity = THREE.MathUtils.lerp(
        mainLightRef.current.intensity,
        hoveredRef.current ? 5.5 : 3.8,
        0.05
      );
    }

    if (groupRef.current && !isAnimatingRef.current) {
      groupRef.current.rotation.y += hoveredRef.current ? 0.018 : 0.008;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.06;
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.04;

      const base = hoveredRef.current ? 2.35 : 2.2;
      const breath = Math.sin(t * 1.2) * 0.03;
      const target = new THREE.Vector3(base + breath, base + breath, base + breath);
      groupRef.current.scale.lerp(target, 0.08);
    }
  });

  // CORRECCIÓN DEL HOVER: Recibimos "e" y detenemos la propagación del rayo
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    hoveredRef.current = true;
    document.body.style.cursor = "crosshair";
    
    if (isAnimatingRef.current || !groupRef.current) return;
    isAnimatingRef.current = true;
    gsap.to(groupRef.current.rotation, {
      y: groupRef.current.rotation.y + Math.PI,
      duration: 1.0,
      ease: "power3.inOut",
      onComplete: () => { isAnimatingRef.current = false; },
    });
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    hoveredRef.current = false;
    document.body.style.cursor = "auto";
  };

  return (
    <group>
      <pointLight ref={mainLightRef} color="#f0c040" distance={18} decay={2} position={[2, 1, 3]} />
      <pointLight position={[0, 0, -6]} intensity={9} color="#1a60c0" distance={22} decay={2} />
      <pointLight position={[0, -3, 2]} intensity={2} color="#f0b429" distance={12} decay={2} />

      <group
        ref={groupRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <primitive object={cloned} position={[0, -0.3, 0]} />
      </group>
    </group>
  );
}

// ── Smart loader: HEAD-checks the GLB before attempting to load ───────────────
function SmartLoader() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    fetch("/home.glb", { method: "HEAD" })
      .then((r) => setAvailable(r.ok))
      .catch(() => setAvailable(false));
  }, []);

  if (available === null) return <CanvasLoader />;
  if (!available) return <PlaceholderModel hovered={hovered} />;

  return (
    <Suspense fallback={<CanvasLoader />}>
      <HomeModel />
    </Suspense>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function HomeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      dpr={[1, 2]}
      className="w-full h-full"
    >
      <fog attach="fog" args={["#060f1e", 6, 14]} />

      <ambientLight intensity={1.5} />
      <hemisphereLight args={["#ffffff", "#060f1e", 1.5]} />
      <directionalLight position={[8, 8, 6]} intensity={2.5} color="#d0e8ff" castShadow />
      <directionalLight position={[-8, 5, -6]} intensity={1.5} color="#f0b429" />

      <Suspense fallback={<CanvasLoader />}>
        <CavaltecParticles count={70} />
        <SmartLoader />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}