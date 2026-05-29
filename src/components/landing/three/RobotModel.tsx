'use client';

/**
 * RobotModel — loads /robot_assembly.glb and rotates it slowly.
 * Exposes `rotationY`, `scale`, and `targetY` props so scroll-driven
 * parents can animate the robot through the story acts.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

interface RobotModelProps {
  /** Auto-rotate speed in rad/s. Set to 0 to lock and let scroll drive. */
  spin?: number;
  /** Vertical position offset. */
  y?: number;
  /** Uniform scale. */
  scale?: number;
  /** Override rotation Y (radians). When set, spin is ignored. */
  rotationY?: number;
  /** Called every frame for live values — used by scroll-driven scenes. */
  getRotationY?: () => number;
  getScale?:     () => number;
  getY?:         () => number;
}

export default function RobotModel({
  spin = 0.18,
  y = -1.0,
  scale = 1.0,
  rotationY,
  getRotationY,
  getScale,
  getY,
}: RobotModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF('/robot_assembly.glb');

  useFrame((_, delta) => {
    if (!group.current) return;

    // rotation
    if (getRotationY) {
      const target = getRotationY();
      group.current.rotation.y += (target - group.current.rotation.y) * 0.08;
    } else if (typeof rotationY === 'number') {
      group.current.rotation.y += (rotationY - group.current.rotation.y) * 0.08;
    } else if (spin) {
      group.current.rotation.y += spin * delta;
    }

    // scale + y — only if a getter is provided (cheap to skip otherwise)
    if (getScale) {
      const s = getScale();
      group.current.scale.setScalar(s);
    }
    if (getY) {
      group.current.position.y = getY();
    }
  });

  return (
    <group ref={group} position={[0, y, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/robot_assembly.glb');
