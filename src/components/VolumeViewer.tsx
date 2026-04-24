// @ts-nocheck
/// <reference types="@react-three/fiber" />
import React, { Suspense } from 'react';
import { Canvas, ThreeElements, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, Decal, Float, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface Highlight {
  label: string;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  confidence: number;
}

interface VolumeViewerProps {
  imageSrc: string;
  highlights: Highlight[];
}

function ScanPlane({ imageSrc, highlights }: VolumeViewerProps) {
  const texture = useTexture(imageSrc);
  const scannerRef = React.useRef<THREE.Mesh>(null);
  const particlesRef = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    if (scannerRef.current) {
      // Periodic scanning beam
      const speed = 2.5;
      const range = 6;
      scannerRef.current.position.y = Math.sin(state.clock.elapsedTime * speed) * (range / 2);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Lightbox Slide */}
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[5, 6]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          opacity={0.95}
          side={THREE.DoubleSide}
          emissive={new THREE.Color('#ffffff')}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Frame / Border with subtle glow */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[5.25, 6.25, 0.1]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Scanning Beam */}
      <mesh ref={scannerRef} position={[0, 0, 0.02]}>
        <planeGeometry args={[5, 0.05]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.6} />
      </mesh>

      {/* Decorative Particles Background */}
      <group ref={particlesRef}>
        {[...Array(50)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 12,
              (Math.random() - 0.5) * 5 - 2
            ]}
          >
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>

      {/* Highlights */}
      {highlights.map((h, i) => {
        // Convert [0-1000] to [-2.5, 2.5] (width 5) and [3, -3] (height 6)
        // Three.js Y is up, [0-1000] Y is down
        const width = (h.xmax - h.xmin) / 1000 * 5;
        const height = (h.ymax - h.ymin) / 1000 * 6;
        const x = (h.xmin / 1000 * 5) - 2.5 + (width / 2);
        const y = 3 - (h.ymin / 1000 * 6) - (height / 2);

        return (
          <group key={i} position={[x, y, 0.01]}>
            {/* 3D Border Box on the slide */}
            <mesh>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial 
                color="#0ea5e9" 
                transparent 
                opacity={0.2} 
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh>
              <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
              <lineBasicMaterial color="#0ea5e9" linewidth={2} />
            </mesh>
            
            {/* Floating Label */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <group position={[0, height/2 + 0.3, 0.1]}>
                 <Text
                    fontSize={0.15}
                    color="#ffffff"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCOjl5wqnPZFGVpk8VcdfZnwC4.ttf"
                    anchorX="center"
                    anchorY="middle"
                 >
                    {h.label}
                 </Text>
                 <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[0.8, 0.25]} />
                    <meshBasicMaterial color="#0ea5e9" />
                 </mesh>
              </group>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

export const VolumeViewer: React.FC<VolumeViewerProps> = ({ imageSrc, highlights }) => {
  return (
    <div className="w-full h-full bg-[#020617] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <ScanPlane imageSrc={imageSrc} highlights={highlights} />
          </Float>
          <Environment preset="city" />
        </Suspense>

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={3} 
          maxDistance={15}
        />
      </Canvas>
      
      {/* 3D Controls Legend */}
      <div className="absolute bottom-4 right-4 pointer-events-none flex flex-col gap-1 items-end">
        <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-md border border-white/5">
           Orbit: Left Click
        </span>
        <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-md border border-white/5">
           Zoom: Scroll
        </span>
         <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-md border border-white/5">
           Pan: Right Click
        </span>
      </div>
    </div>
  );
};
