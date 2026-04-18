'use client';

import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, Points, PointMaterial, Line, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ZoomIn, ZoomOut, Maximize2, Tag, Camera, Loader2 } from 'lucide-react';

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

function GraphScene({ nodes, edges, showLabels }: { nodes: NodeData[], edges: EdgeData[], showLabels: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0005;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <Float key={node.id} speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={node.pos}>
            <sphereGeometry args={[0.08 + (node.impact * 0.1), 32, 32]} />
            <meshStandardMaterial 
              color={node.impact > 0.5 ? "#F59E0B" : "#00A3FF"} 
              roughness={0.1} 
              metalness={0.9}
            />
          </mesh>
          {showLabels && (
            <Text
              position={[node.pos[0], node.pos[1] + 0.3, node.pos[2]]}
              fontSize={0.08}
              color="#FFFFFF"
              anchorX="center"
              maxWidth={1}
            >
              {node.name}
            </Text>
          )}
        </Float>
      ))}
      
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={[edge.start, edge.end]}
          color="#00A3FF"
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}

      <Points limit={1000}>
        <PointMaterial transparent color="#64707D" size={0.015} opacity={0.3} />
        {useMemo(() => {
          const positions = new Float32Array(1000 * 3);
          for (let i = 0; i < 1000; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
          }
          return positions;
        }, [])}
      </Points>
    </group>
  );
}

export const BlastRadius3D: React.FC<{ data?: any }> = ({ data }) => {
  const [showLabels, setShowLabels] = useState(true);
  const controlsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { nodes, edges } = useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], edges: [] };

    // Standard radial layout for dependency tree visualization
    const mappedNodes: NodeData[] = data.nodes.map((n: any, i: number) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const radius = i === 0 ? 0 : 2.5;
      return {
        id: n.id,
        name: n.name,
        impact: n.impact || 0.5,
        pos: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (Math.random() - 0.5) * 1.5 // Added depth for 3D topology
        ]
      };
    });

    const mappedEdges: EdgeData[] = (data.edges || []).map((e: any) => {
      const startNode = mappedNodes.find(n => n.id === e.start);
      const endNode = mappedNodes.find(n => n.id === e.end);
      return {
        start: startNode?.pos || [0,0,0],
        end: endNode?.pos || [0,0,0]
      };
    });

    return { nodes: mappedNodes, edges: mappedEdges };
  }, [data]);

  const handleZoomIn = () => controlsRef.current?.zoomIn(1.2);
  const handleZoomOut = () => controlsRef.current?.zoomOut(1.2);
  const handleFit = () => {
    controlsRef.current?.reset();
    // In a complete implementation we'd calculate bounding sphere, but reset is standard
  };

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `lineage_snapshot_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, []);

  if (!data?.nodes || data.nodes.length === 0) {
    return (
       <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
          <Maximize2 className="w-12 h-12" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-center">No lineage data available<br/>Engine sweep required</span>
       </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] relative group bg-[#0B0F14]/20">
      
      {/* GRAPH CONTROLS (PHASE 7) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
         <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg bg-[#0B0F14] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-[#8A949E] hover:text-white" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
         </button>
         <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg bg-[#0B0F14] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-[#8A949E] hover:text-white" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
         </button>
         <button onClick={handleFit} className="w-8 h-8 rounded-lg bg-[#0B0F14] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-[#8A949E] hover:text-white" title="Fit to Screen">
            <Maximize2 className="w-3.5 h-3.5" />
         </button>
         <div className="w-full h-px bg-white/5 my-1" />
         <button onClick={() => setShowLabels(!showLabels)} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${showLabels ? 'bg-[#00A3FF]/10 border-[#00A3FF]/20 text-[#00A3FF]' : 'bg-[#0B0F14] border-white/5 text-[#8A949E] hover:text-white'}`} title="Toggle Labels">
            <Tag className="w-3.5 h-3.5" />
         </button>
         <button onClick={handleExport} className="w-8 h-8 rounded-lg bg-[#0B0F14] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-[#8A949E] hover:text-white" title="Export PNG">
            <Camera className="w-3.5 h-3.5" />
         </button>
      </div>

      <Canvas 
        ref={canvasRef}
        gl={{ preserveDrawingBuffer: true }} // Required for Export PNG
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 7]} />
        <OrbitControls 
          ref={controlsRef} 
          enableDamping 
          dampingFactor={0.05}
          maxDistance={15}
          minDistance={2}
        />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <GraphScene nodes={nodes} edges={edges} showLabels={showLabels} />
      </Canvas>
    </div>
  );
};
