'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

interface IronManModelProps {
  spin?: number;
  y?: number;
  scale?: number;
  rotationY?: number;
  getRotationY?: () => number;
  getScale?:     () => number;
  getY?:         () => number;
}

export default function IronManModel({
  spin = 0.22,
  y = -0.6,
  scale = 1.4,
  rotationY,
  getRotationY,
  getScale,
  getY,
}: IronManModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF('/iron_man.glb');

  useFrame((_, delta) => {
    if (!group.current) return;

    if (getRotationY) {
      const target = getRotationY();
      group.current.rotation.y += (target - group.current.rotation.y) * 0.08;
    } else if (typeof rotationY === 'number') {
      group.current.rotation.y += (rotationY - group.current.rotation.y) * 0.08;
    } else if (spin) {
      group.current.rotation.y += spin * delta;
    }

    if (getScale) group.current.scale.setScalar(getScale());
    if (getY)     group.current.position.y = getY();
  });

  return (
    <group ref={group} position={[0, y, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/iron_man.glb');
