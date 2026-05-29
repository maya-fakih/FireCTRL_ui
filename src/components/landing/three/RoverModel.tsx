'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

interface RoverModelProps {
  spin?: number;
  y?: number;
  scale?: number;
  rotationY?: number;
}

export default function RoverModel({
  spin = 0.12,
  y = -1.2,
  scale = 1.2,
  rotationY,
}: RoverModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF('/rover.glb');

  useFrame((_, delta) => {
    if (!group.current) return;
    if (typeof rotationY === 'number') {
      group.current.rotation.y += (rotationY - group.current.rotation.y) * 0.08;
    } else if (spin) {
      group.current.rotation.y += spin * delta;
    }
  });

  return (
    <group ref={group} position={[0, y, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/rover.glb');
