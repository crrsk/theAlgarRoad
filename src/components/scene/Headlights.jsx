import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../../gameState';
import { useMemo, useEffect } from 'react';

export default function Headlights({ isTraffic = false, bounds }) {
  const leftLight = useRef();
  const rightLight = useRef();
  
  // Creamos los objetos objetivo (targets) para las luces
  const targetL = useMemo(() => new THREE.Object3D(), []);
  const targetR = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    // Vinculamos los focos a sus objetivos cuando se montan
    if (leftLight.current) leftLight.current.target = targetL;
    if (rightLight.current) rightLight.current.target = targetR;
  }, [targetL, targetR]);

  useFrame(() => {
    if (!leftLight.current || !rightLight.current) return;
    
    let isNightTarget = false;
    if (GameState.targetBiome === 'retrowave' || GameState.sceneTheme === 'night') {
        isNightTarget = true;
    }
    let isNightCurrent = false;
    if (GameState.currentBiome === 'retrowave' || GameState.sceneTheme === 'night') {
        isNightCurrent = true;
    }

    const t = GameState.transitionProgress;
    const intensityA = isNightCurrent ? 15.0 : 0;
    const intensityB = isNightTarget ? 15.0 : 0;
    const currentIntensity = THREE.MathUtils.lerp(intensityA, intensityB, t);

    leftLight.current.intensity = currentIntensity;
    rightLight.current.intensity = currentIntensity;
  });

  const b = bounds || { frontZ: 1.6, leftX: -0.6, rightX: 0.6, y: 0.5 };

  return (
    <group>
      {/* Apuntamos mucho más hacia abajo y más cerca para que el cono toque el asfalto inmediatamente desde el morro */}
      <primitive object={targetL} position={[b.leftX, b.y - 1.5, b.frontZ + 5.0]} />
      <primitive object={targetR} position={[b.rightX, b.y - 1.5, b.frontZ + 5.0]} />

      <spotLight 
        ref={leftLight}
        position={[b.leftX, b.y, b.frontZ]}
        angle={0.55} // Ángulo más ancho para abarcar desde el suelo inmediato
        penumbra={0.4}
        distance={40}
        intensity={0}
        color={0xfff0dd}
        castShadow={!isTraffic}
      />
      <spotLight 
        ref={rightLight}
        position={[b.rightX, b.y, b.frontZ]}
        angle={0.55} // Ángulo más ancho para abarcar desde el suelo inmediato
        penumbra={0.4}
        distance={40}
        intensity={0}
        color={0xfff0dd}
        castShadow={!isTraffic}
      />
    </group>
  );
}
