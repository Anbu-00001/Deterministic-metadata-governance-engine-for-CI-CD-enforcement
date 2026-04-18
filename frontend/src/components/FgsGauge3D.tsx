'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, ContactShadows } from '@react-three/drei';
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
    if (score >= 80) return "#10B981"; // Stable Green
    if (score >= 50) return "#F59E0B"; // Warning Amber
    return "#EF4444"; // Error Red
  }, [score]);

  return (
    <group rotation={[Math.PI / 8, 0, 0]}>
      {/* Background Ring - Subtle Track */}
      <mesh>
        <torusGeometry args={[1.5, 0.04, 16, 100]} />
        <meshBasicMaterial color="#1a1f26" transparent opacity={0.6} />
      </mesh>
      
      {/* Progress Ring - Clean Glass/Chrome look */}
      <mesh ref={meshRef}>
        <torusGeometry args={[1.5, 0.08, 16, 100, (score / 100) * Math.PI * 2]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Center Sphere - Calm Distorted Glass */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[0.9, 64, 64]} />
          <MeshDistortMaterial 
            color="#0B0F14" 
            speed={1} 
            distort={0.4} 
            roughness={0} 
            metalness={1}
            clearcoat={1}
          />
        </mesh>
      </Float>
      
      <ContactShadows 
         position={[0, -2, 0]} 
         opacity={0.3} 
         scale={10} 
         blur={2.5} 
         far={4} 
      />
    </group>
  );
}

export const FgsGauge3D: React.FC<FgsGauge3DProps> = ({ score }) => {
  return (
    <div className="w-full h-full relative cursor-default">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} intensity={1.5} angle={0.2} penumbra={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <GaugeRing score={score} />
      </Canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[64px] font-bold tracking-tighter text-white tabular-nums leading-none">
          {score.toFixed(0)}
        </span>
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#64707D] mt-4 uppercase">
           Index Rating
        </span>
      </div>
    </div>
  );
};
