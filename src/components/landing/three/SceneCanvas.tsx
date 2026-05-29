'use client';

/**
 * SceneCanvas — a thin wrapper around <Canvas> that gives every 3D scene
 * on the landing page the same cinematic baseline:
 *   - linear color space + ACES tone mapping (filmic)
 *   - rim light from below-left (warm amber, like a fire)
 *   - key light from above-right (cool, like moonlight)
 *   - black void background
 *
 * Children pass their model in. The canvas is intentionally dumb — it
 * does NOT know about the model's animations or scroll progress.
 */

import { Canvas } from '@react-three/fiber';
import { Suspense, type ReactNode } from 'react';
import { ACESFilmicToneMapping } from 'three';

interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  /** Show the amber rim light? Defaults true. Turn off for clean studio shots. */
  ember?: boolean;
}

export default function SceneCanvas({
  children,
  className = 'w-full h-full',
  cameraPosition = [0, 0.6, 4],
  cameraFov = 38,
  ember = true,
}: SceneCanvasProps) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{ position: cameraPosition, fov: cameraFov }}
      >
        {/* key — cool */}
        <directionalLight position={[6, 8, 4]} intensity={1.5} color="#cfe2ff" />
        {/* fill — neutral */}
        <directionalLight position={[-4, 2, 3]} intensity={0.4} color="#ffffff" />
        {/* rim — amber, like the FIRECTRL brand */}
        {ember && (
          <directionalLight
            position={[-2, -3, -4]}
            intensity={2.2}
            color="#E05A2B"
          />
        )}
        <ambientLight intensity={0.18} />

        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
