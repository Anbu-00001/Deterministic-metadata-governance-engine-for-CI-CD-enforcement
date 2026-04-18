'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, Points, PointMaterial, Line } from '@react-three/drei';
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

function GraphScene({ nodes, edges }: { nodes: NodeData[], edges: EdgeData[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <Float key={node.id} speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
          <mesh position={node.pos}>
            <sphereGeometry args={[0.08 + node.impact * 0.05, 16, 16]} />
            <meshStandardMaterial 
              color={node.impact > 0.5 ? "#ff5b5b" : "#00f0ff"} 
              emissive={node.impact > 0.5 ? "#ff5b5b" : "#00f0ff"}
              emissiveIntensity={1}
            />
          </mesh>
          <Text
            position={[node.pos[0], node.pos[1] + 0.2, node.pos[2]]}
            fontSize={0.06}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {node.name}
          </Text>
        </Float>
      ))}
      
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={[edge.start, edge.end]}
          color="#1a2230"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}

      {/* Background Starfield */}
      <Points limit={1000}>
        <PointMaterial 
          transparent 
          vertexColors 
          size={0.05} 
          sizeAttenuation={true} 
          depthWrite={false} 
        />
        {useMemo(() => {
          const positions = new Float32Array(1000 * 3);
          for (let i = 0; i < 1000; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
          }
          return positions;
        }, [])}
      </Points>
    </group>
  );
}

export const BlastRadius3D: React.FC<{ data?: any }> = ({ data }) => {
  const nodes = useMemo(() => {
    // Generate some mock nodes if no data provided, or parse data
    const mockNodes: NodeData[] = [
      { id: '1', name: 'USERS', pos: [0, 0, 0], impact: 0.8 },
      { id: '2', name: 'ORDERS', pos: [1, 1, -1], impact: 0.4 },
      { id: '3', name: 'PRODUCTS', pos: [-1, 0.5, 1], impact: 0.2 },
      { id: '4', name: 'PAYMENTS', pos: [0.5, -1, 0.5], impact: 0.6 },
      { id: '5', name: 'LOGS', pos: [-1.2, -0.8, -0.5], impact: 0.1 },
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
    <div className="w-full h-full min-h-[300px] relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <GraphScene nodes={nodes} edges={edges} />
      </Canvas>
    </div>
  );
};
