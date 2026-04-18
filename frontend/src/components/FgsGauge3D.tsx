'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface FgsGauge3DProps {
  score: number;
}

function GaugeRing({ score }: { score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = (score / 100) * Math.PI * 2;
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z, 
        targetRotation, 
        0.05
      );
    }
  });

  const color = useMemo(() => {
    if (score >= 80) return "#39ff14"; // Green (safe)
    if (score >= 50) return "#f8e81c"; // Yellow (warning)
    return "#ff5b5b"; // Red (danger)
  }, [score]);

  return (
    <group>
      {/* Background Ring */}
      <mesh>
        <torusGeometry args={[1.5, 0.05, 16, 100]} />
        <meshBasicMaterial color="#0a1a2a" transparent opacity={0.5} />
      </mesh>
      
      {/* Progress Ring */}
      <mesh ref={meshRef}>
        <torusGeometry args={[1.5, 0.08, 16, 100, (score / 100) * Math.PI * 2]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={2} 
        />
      </mesh>

      {/* Decorative center sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <MeshDistortMaterial 
            color="#06090e" 
            speed={2} 
            distort={0.3} 
            roughness={0} 
            metalness={1}
          />
        </mesh>
      </Float>
    </group>
  );
}

export const FgsGauge3D: React.FC<FgsGauge3DProps> = ({ score }) => {
  return (
    <div className="w-full h-full min-h-[250px] relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <GaugeRing score={score} />
      </Canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-5xl font-black text-white glow-text">{score.toFixed(1)}</span>
        <span className="text-[9px] font-bold tracking-[0.2em] text-[#6B7A90] mt-2 italic">OPTIMIZED</span>
      </div>
    </div>
  );
};
