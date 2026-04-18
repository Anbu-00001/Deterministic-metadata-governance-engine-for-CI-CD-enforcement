'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, Points, PointMaterial, Line, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface NodeData {
  id: string;
  name: string;
  pos: [number, number, number];
  impact: number;
}

interface EdgeData {
  start: [number, number, number];
  end: [number, number, number];
}

function GraphScene({ nodes, edges, onSelectNode }: { nodes: NodeData[], edges: EdgeData[], onSelectNode?: (n: NodeData) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008; // Subtle pivot rotation
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <Float key={node.id} speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh 
            position={node.pos} 
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode?.(node);
            }}
            onPointerOver={() => { document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
          >
            <sphereGeometry args={[0.08 + node.impact * 0.05, 32, 32]} />
            <meshStandardMaterial 
              color={node.impact > 0.5 ? "#F59E0B" : "#00A3FF"} 
              roughness={0.05}
              metalness={0.9}
            />
          </mesh>
          <Text
            position={[node.pos[0], node.pos[1] + 0.25, node.pos[2]]}
            fontSize={0.07}
            color="#8A949E"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter-Medium.ttf" // Placeholder for project level font
          >
            {node.name}
          </Text>
        </Float>
      ))}
      
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={[edge.start, edge.end]}
          color="#8A949E"
          lineWidth={0.5}
          transparent
          opacity={0.1}
        />
      ))}

      {/* Subtle Starfield - Reduced Noise */}
      <Points limit={1000}>
        <PointMaterial 
          transparent 
          color="#64707D"
          size={0.02} 
          sizeAttenuation={true} 
          depthWrite={false} 
          opacity={0.3}
        />
        {useMemo(() => {
          const positions = new Float32Array(1000 * 3);
          for (let i = 0; i < 1000; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
          }
          return positions;
        }, [])}
      </Points>
    </group>
  );
}

export const BlastRadius3D: React.FC<{ data?: any }> = ({ data }) => {
  const nodes = useMemo(() => {
    const mockNodes: NodeData[] = [
      { id: '1', name: 'CORE_USERS', pos: [0, 0, 0], impact: 0.9 },
      { id: '2', name: 'BILLING_DATA', pos: [1.2, 0.8, -1.2], impact: 0.6 },
      { id: '3', name: 'INV_CATALOG', pos: [-1.2, 0.6, 1], impact: 0.3 },
      { id: '4', name: 'AUTH_TRAIL', pos: [0.6, -1, 0.6], impact: 0.7 },
      { id: '5', name: 'AUDIT_LOG_V2', pos: [-1.5, -0.8, -0.6], impact: 0.1 },
    ];
    return mockNodes;
  }, [data]);

  const edges = useMemo(() => {
    const mockEdges: EdgeData[] = [];
    nodes.forEach((node, i) => {
      if (i > 0) {
        mockEdges.push({ start: nodes[0].pos, end: node.pos });
      }
    });
    return mockEdges;
  }, [nodes]);

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <GraphScene 
           nodes={nodes} 
           edges={edges} 
           onSelectNode={(n) => {}} 
        />
      </Canvas>
    </div>
  );
};
