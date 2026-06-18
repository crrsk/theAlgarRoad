import { useMemo, useRef, useEffect } from 'react';
import { Instances } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingInstance, TreeRoundInstance } from './CityInstances';
import { GameState } from '../../gameState';

const BUILDING_LOOP_LENGTH = 55;
const SIDEWALK_EDGE_X = 4.6 / 2 + 1.35;

function createRetrowaveRings() {
  return Array.from({ length: 6 }, (_, index) => {
    return {
      x: 0,
      z: -10 - index * 9.16, // spread evenly over 55
      width: 1,
      height: 1,
      depth: 1,
      color: 0x000000,
      rotation: 0,
      loopLength: BUILDING_LOOP_LENGTH,
    };
  });
}

function createRetrowaveBuildings() {
  const sides = [-1, 1];
  return sides.flatMap((side) => (
    Array.from({ length: 12 }, (_, index) => {
      const zOffset = -2 - index * 4.5;
      const xOffset = side * (SIDEWALK_EDGE_X + 2.5 + Math.random() * 2);
      const height = 15 + Math.random() * 20;
      
      return {
        isTree: false,
        color: 0x050510,
        depth: 1.5,
        height,
        loopLength: BUILDING_LOOP_LENGTH,
        rotation: 0,
        width: 1.5,
        x: xOffset,
        z: zOffset,
      };
    })
  ));
}

function createRetrowaveTrees() {
  const sides = [-1, 1];
  return sides.flatMap((side) => (
    Array.from({ length: 30 }, (_, index) => {
      const zOffset = -3 - index * 2.0;
      const isFar = index % 2 !== 0; // Half of them are in the background
      const xDistance = isFar ? 15 + Math.random() * 25 : SIDEWALK_EDGE_X + 2.5 + Math.random() * 5.5;
      const xOffset = side * xDistance;
      
      return {
        scale: (isFar ? 1.5 : 0.8) + Math.random() * 1.0, // Far ones are bigger
        position: [xOffset, -0.66 + (isFar ? 5 : 1.5), zOffset], // Flotando
        loopLength: BUILDING_LOOP_LENGTH,
      };
    })
  ));
}

function RetroSun() {
  const ref = useRef();
  const initialScale = GameState.currentBiome === 'retrowave' ? 1 : 0;
  
  useFrame(() => {
    const isRetrowave = GameState.currentBiome === 'retrowave' || (GameState.targetBiome === 'retrowave' && GameState.transitionPhase >= 2);
    const targetY = isRetrowave ? 30 : -120; // Baja por debajo del suelo totalmente
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.05);
  });

  return (
    <mesh ref={ref} position={[0, -120, -180]} scale={[1, 1, 1]}>
      <circleGeometry args={[50, 64]} />
      {/* Magenta to match palette */}
      <meshBasicMaterial color={0xff00ff} fog={false} />
    </mesh>
  );
}

function AnimatedGrid() {
  const gridRef = useRef();

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.material.transparent = true;
      gridRef.current.material.opacity = GameState.currentBiome === 'retrowave' ? 1 : 0;
      gridRef.current.visible = gridRef.current.material.opacity > 0.01;
    }
  }, []);

  useFrame((_, delta) => {
    if (GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    
    const isRetrowave = GameState.currentBiome === 'retrowave' || (GameState.targetBiome === 'retrowave' && GameState.transitionPhase >= 2);
    
    // Ocultar si estamos lejos en la ciudad
    if (!gridRef.current.material.transparent) {
      gridRef.current.material.transparent = true;
    }
    gridRef.current.material.opacity = THREE.MathUtils.lerp(
      gridRef.current.material.opacity,
      isRetrowave ? 1 : 0,
      0.05
    );
    
    gridRef.current.visible = gridRef.current.material.opacity > 0.01;

    if (gridRef.current.visible) {
      gridRef.current.position.z += GameState.speed * delta;
      if (gridRef.current.position.z > 2) {
        gridRef.current.position.z -= 2;
      }
    }
  });

  return (
    <gridHelper 
      ref={gridRef}
      args={[200, 100, 0xff00ff, 0xff00ff]} 
      position={[0, -0.63, -50]} 
    />
  );
}

function SynthMountains() {
  const ref = useRef();
  const initialScale = GameState.currentBiome === 'retrowave' ? 1 : 0;
  
  useFrame(() => {
    const isRetrowave = GameState.currentBiome === 'retrowave' || (GameState.targetBiome === 'retrowave' && GameState.transitionPhase >= 2);
    const targetY = isRetrowave ? 0 : -100; // Se hunde en la niebla
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.05);
  });

  return (
    <group ref={ref} position={[0, -100, 0]} scale={[1, 1, 1]}>
      {/* Centrales originales */}
      <mesh position={[-60, 5, -100]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[30, 40, 4]} />
        <meshBasicMaterial color={0x00ffff} wireframe fog={false} />
      </mesh>
      <mesh position={[60, 5, -120]} rotation={[0, -Math.PI / 4, 0]}>
        <coneGeometry args={[40, 50, 4]} />
        <meshBasicMaterial color={0x00ffff} wireframe fog={false} />
      </mesh>
      <mesh position={[-80, -5, -140]} rotation={[0, 0, 0]}>
        <coneGeometry args={[35, 30, 4]} />
        <meshBasicMaterial color={0xff00ff} wireframe fog={false} />
      </mesh>
      <mesh position={[80, 0, -90]} rotation={[0, 0, 0]}>
        <coneGeometry args={[25, 40, 4]} />
        <meshBasicMaterial color={0xff00ff} wireframe fog={false} />
      </mesh>

      {/* Extra Laterales Izquierdos */}
      <mesh position={[-130, 10, -160]} rotation={[0, Math.PI / 6, 0]}>
        <coneGeometry args={[50, 60, 4]} />
        <meshBasicMaterial color={0x00ffff} wireframe fog={false} />
      </mesh>
      <mesh position={[-180, -10, -130]} rotation={[0, -Math.PI / 8, 0]}>
        <coneGeometry args={[40, 45, 4]} />
        <meshBasicMaterial color={0xff00ff} wireframe fog={false} />
      </mesh>
      <mesh position={[-250, 15, -180]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[65, 80, 4]} />
        <meshBasicMaterial color={0x00ffff} wireframe fog={false} />
      </mesh>

      {/* Extra Laterales Derechos */}
      <mesh position={[140, -5, -150]} rotation={[0, -Math.PI / 6, 0]}>
        <coneGeometry args={[45, 50, 4]} />
        <meshBasicMaterial color={0x00ffff} wireframe fog={false} />
      </mesh>
      <mesh position={[190, 5, -170]} rotation={[0, Math.PI / 8, 0]}>
        <coneGeometry args={[55, 65, 4]} />
        <meshBasicMaterial color={0xff00ff} wireframe fog={false} />
      </mesh>
      <mesh position={[260, -15, -140]} rotation={[0, -Math.PI / 4, 0]}>
        <coneGeometry args={[40, 40, 4]} />
        <meshBasicMaterial color={0xff00ff} wireframe fog={false} />
      </mesh>
    </group>
  );
}

export default function RetrowaveEnvironment() {
  const rings = useMemo(() => createRetrowaveRings(), []);
  const buildings = useMemo(() => createRetrowaveBuildings(), []);
  const trees = useMemo(() => createRetrowaveTrees(), []);

  return (
    <group>
      {/* ELEMENTOS DE FONDO (Sol, Cuadrícula y Montañas) */}
      <RetroSun />
      <AnimatedGrid />
      <SynthMountains />

      {/* EDIFICIOS DE CUADRÍCULA (Wireframe Buildings) */}
      <Instances frustumCulled={false} limit={50}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={0x020205} roughness={0.5} metalness={0.8} emissive={0x00ffff} emissiveIntensity={1.0} wireframe />
        {buildings.map((b, i) => <BuildingInstance key={`bld-${i}`} data={b} biome="retrowave" />)}
      </Instances>

      {/* ANILLOS DE NEÓN TÚNEL (Torus) */}
      <Instances frustumCulled={false} limit={20}>
        <torusGeometry args={[12, 0.2, 16, 64]} />
        <meshStandardMaterial color={0xff00ff} emissive={0xff00ff} emissiveIntensity={2.0} toneMapped={false} />
        {rings.map((r, i) => (
          <BuildingInstance key={`ring-${i}`} data={{...r, y: 3.5, width: 1, height: 1, depth: 1}} biome="retrowave" />
        ))}
      </Instances>

      {/* PIRÁMIDES FLOTANTES (Trees) */}
      <Instances frustumCulled={false} limit={100}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={0x110022} roughness={0.3} emissive={0x00ffff} emissiveIntensity={2.0} wireframe />
        {trees.map((t, i) => <TreeRoundInstance key={`tree-${i}`} data={t} biome="retrowave" />)}
      </Instances>
    </group>
  );
}
