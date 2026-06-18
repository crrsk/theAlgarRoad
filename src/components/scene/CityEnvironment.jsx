import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Instances } from '@react-three/drei';
import { BuildingInstance, WindowInstance, TreePineInstance, TreeRoundInstance, StreetLightPoleInstance } from './CityInstances';
import { createRoadTexture, createSidewalkTexture, createGlobalFacadeTexture } from '../../utils/cityTextures';
import { GameState } from '../../gameState';

const BUILDING_PALETTE = [0x3b4350, 0x46505f, 0x2f3948, 0x56606b, 0x394a5a];
const DISTANT_PALETTE = [0x485564, 0x596775, 0x3f4d5d];
const BUILDING_LOOP_LENGTH = 42;
const ROAD_WIDTH = 4.6;
const SIDEWALK_WIDTH = 1.35;
const SIDEWALK_X = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2 + 0.25;
const BUILDING_START_X = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 2;

function createSideBuildings() {
  const sides = [-1, 1];
  const lanes = [0, 1, 2];

  return sides.flatMap((side) => (
    lanes.flatMap((lane) => (
      Array.from({ length: 6 }, (_, index) => {
        const seed = Math.abs(side * 31 + lane * 17 + index * 5);

        // Dejar un 20% de solares vacíos en las filas de atrás para mayor realismo
        if (lane > 0 && seed % 5 === 0) {
          // Llenar el solar vacío con 1 o 2 árboles para que no se vea desierto
          return Array.from({ length: (seed % 2) + 1 }, (_, treeIdx) => ({
            isTree: true,
            seed: seed + treeIdx,
            loopLength: BUILDING_LOOP_LENGTH,
            position: [
              side * (BUILDING_START_X + lane * 2.5 + ((index + lane) % 2) * 0.5 + (treeIdx * 1.5 - 0.75)),
              -0.66,
              -4.8 - index * 4.0 - lane * 1.05 + (Math.random() * 1.5 - 0.75)
            ],
          }));
        }

        return {
          isTree: false,
          color: BUILDING_PALETTE[(index + lane + seed) % BUILDING_PALETTE.length],
          depth: 1.5 + (seed % 3) * 0.5,
          height: 6 + lane * 2 + (seed % 5) * 1.0,
          loopLength: BUILDING_LOOP_LENGTH,
          rotation: side * -0.045 + (seed % 3 === 0 ? (Math.random() * 0.1 - 0.05) : 0),
          seed,
          width: 1.5 + (seed % 4) * 0.5,
          x: side * (BUILDING_START_X + lane * 2.5 + ((index + lane) % 2) * 0.5),
          z: -4.8 - index * 4.0 - lane * 1.05,
        };
      }).flat()
    ))
  )).filter(Boolean);
}

function createStreetTrees() {
  const sides = [-1, 1];
  return sides.flatMap((side) => (
    Array.from({ length: 12 }, (_, index) => {
      const seed = Math.abs(side * 42 + index * 7);
      // Mantener los árboles estrictamente cerca de la acera para que no atraviesen los edificios
      const xOffset = Math.random() * 0.4; 
      return {
        seed,
        loopLength: BUILDING_LOOP_LENGTH,
        position: [side * (SIDEWALK_X + 0.4 + xOffset), -0.66, -index * 4.0],
      };
    })
  ));
}

function createStreetLights() {
  const sides = [-1, 1];
  return sides.flatMap((side) => (
    Array.from({ length: 6 }, (_, index) => {
      return {
        side,
        loopLength: BUILDING_LOOP_LENGTH,
        position: [side * (SIDEWALK_X - 0.2), -0.66, -index * 7],
      };
    })
  ));
}

function createDistantBuildings() {
  return Array.from({ length: 13 }, (_, index) => {
    const center = index - 6;
    const seed = index * 9 + 3;

    return {
      color: DISTANT_PALETTE[index % DISTANT_PALETTE.length],
      depth: 1.5,
      height: 12 + (seed % 6) * 2,
      loopLength: BUILDING_LOOP_LENGTH,
      rotation: 0,
      seed,
      width: 1.8 + (seed % 4) * 0.5,
      x: center * 3.0,
      z: -25.0 - (index % 3) * 1.5,
    };
  }).filter((building) => Math.abs(building.x) > 4);
}

export default function CityEnvironment({ theme }) {
  const roadTexture = useMemo(() => createRoadTexture(theme.street), [theme.street]);
  const sidewalkTexture = useMemo(() => createSidewalkTexture(), []);
  const globalFacadeTexture = useMemo(() => createGlobalFacadeTexture(), []);

  const allBlocks = useMemo(() => createSideBuildings(), []);
  
  const buildings = useMemo(() => [
    ...allBlocks.filter(b => !b.isTree),
    ...createDistantBuildings(),
  ], [allBlocks]);
  
  const allWindows = useMemo(() => {
    return buildings.flatMap(building => {
      const windowRows = Math.max(3, Math.floor(building.height / 0.48));
      const windowColumns = Math.max(2, Math.floor(building.width / 0.34));
      
      return Array.from({ length: windowRows }, (_, row) => (
        Array.from({ length: windowColumns }, (_, column) => {
          if ((row + column + building.seed) % 3 === 0) return null;
          
          const localX = ((column + 0.5) / windowColumns - 0.5) * building.width * 0.72;
          const localY = (row + 0.5) * 0.42 - building.height / 2 + 0.25;
          const localZ = building.depth / 2 + 0.006;
          
          const cos = Math.cos(building.rotation);
          const sin = Math.sin(building.rotation);
          const rotatedX = localX * cos - localZ * sin;
          const rotatedZ = localX * sin + localZ * cos;

          return {
            globalX: building.x + rotatedX,
            globalY: building.height / 2 - 0.64 + localY,
            globalZ: building.z + rotatedZ,
            rotation: building.rotation,
            zOffset: rotatedZ,
            loopLength: building.loopLength
          };
        })
      )).flat().filter(Boolean);
    });
  }, [buildings]);

  const trees = useMemo(() => {
    const rawTrees = [
      ...allBlocks.filter(b => b.isTree),
      ...createStreetTrees(),
    ];
    return rawTrees.map(t => ({
      ...t,
      scale: 0.8 + (t.seed % 5) * 0.1,
      isPine: t.seed % 2 === 0
    }));
  }, [allBlocks]);
  
  const pineTrees = useMemo(() => trees.filter(t => t.isPine), [trees]);
  const roundTrees = useMemo(() => trees.filter(t => !t.isPine), [trees]);
  
  const lights = useMemo(() => createStreetLights(), []);

  useFrame((_, delta) => {
    if (GameState.isGameOver || GameState.isPaused) return;
    roadTexture.offset.y += GameState.speed * delta * 0.1;
    sidewalkTexture.offset.y += GameState.speed * delta * 0.1;
  });

  const isNightOrGolden = theme.type === 'night' || theme.type === 'golden';

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid" name="ground">
        <mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color={0x151821} roughness={0.94} metalness={0.01} />
        </mesh>
      </RigidBody>

      <mesh position={[0, -0.655, 1.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, 80]} />
        <meshStandardMaterial map={roadTexture} roughness={0.9} />
      </mesh>

      <mesh position={[0, -0.65, 1.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 80]} />
        <meshStandardMaterial color={0xd7d3bd} roughness={0.7} />
      </mesh>

      <mesh position={[-SIDEWALK_X, -0.645, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, 80]} />
        <meshStandardMaterial map={sidewalkTexture} roughness={0.94} />
      </mesh>

      <mesh position={[SIDEWALK_X, -0.645, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, 80]} />
        <meshStandardMaterial map={sidewalkTexture} roughness={0.94} />
      </mesh>

      {/* INSTANCED BUILDINGS */}
      <Instances limit={100}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={globalFacadeTexture} roughness={0.86} metalness={0.03} />
        {buildings.map((b, i) => <BuildingInstance key={i} data={b} />)}
      </Instances>

      {/* INSTANCED WINDOWS */}
      <Instances limit={1500}>
        <planeGeometry args={[0.08, 0.16]} />
        <meshStandardMaterial color={0xffe6a3} emissive={0xffc35a} emissiveIntensity={theme.buildingLight} toneMapped={false} />
        {allWindows.map((w, i) => <WindowInstance key={i} data={w} />)}
      </Instances>

      {/* INSTANCED PINE TREES */}
      <group>
        <Instances limit={100} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 1, 5]} />
          <meshStandardMaterial color={0x3d2817} roughness={0.9} />
          {pineTrees.map((t, i) => <TreePineInstance key={`trunk-${i}`} data={{...t, position: [t.position[0], t.position[1] + 0.5, t.position[2]]}} />)}
        </Instances>
        <Instances limit={100} castShadow>
          <coneGeometry args={[0.8, 2.5, 5]} />
          <meshStandardMaterial color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-${i}`} data={{...t, position: [t.position[0], t.position[1] + 2, t.position[2]]}} />)}
        </Instances>
      </group>

      {/* INSTANCED ROUND TREES */}
      <group>
        <Instances limit={100} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 1, 5]} />
          <meshStandardMaterial color={0x3d2817} roughness={0.9} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`trunk-${i}`} data={{...t, position: [t.position[0], t.position[1] + 0.5, t.position[2]]}} />)}
        </Instances>
        <Instances limit={100} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-${i}`} data={{...t, position: [t.position[0], t.position[1] + 1.8, t.position[2]]}} />)}
        </Instances>
      </group>

      {/* INSTANCED STREETLIGHTS */}
      <group>
        {/* Poles */}
        <Instances limit={50} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 4, 5]} />
          <meshStandardMaterial color={0x2a2d34} roughness={0.6} metalness={0.8} />
          {lights.map((l, i) => <StreetLightPoleInstance key={`pole-${i}`} data={{...l, position: [l.position[0], l.position[1] + 2, l.position[2]]}} />)}
        </Instances>
        {/* Arms */}
        <Instances limit={50}>
          <cylinderGeometry args={[0.03, 0.05, 0.8, 5]} />
          <meshStandardMaterial color={0x2a2d34} roughness={0.6} metalness={0.8} />
          {lights.map((l, i) => {
            const rotZ = Math.PI / 2;
            const xOff = l.side === 1 ? -0.4 : 0.4;
            return <StreetLightPoleInstance key={`arm-${i}`} data={{...l, position: [l.position[0] + xOff, l.position[1] + 3.9, l.position[2]], rotation: [0, l.side === 1 ? Math.PI : 0, rotZ]}} />
          })}
        </Instances>
        {/* Bulbs */}
        <Instances limit={50}>
          <boxGeometry args={[0.3, 0.1, 0.15]} />
          <meshStandardMaterial color={isNightOrGolden ? 0xfff5e6 : 0x888888} emissive={isNightOrGolden ? 0xffbb55 : 0x000000} emissiveIntensity={isNightOrGolden ? 2 : 0} toneMapped={false} />
          {lights.map((l, i) => {
            const xOff = l.side === 1 ? -0.7 : 0.7;
            return <StreetLightPoleInstance key={`bulb-${i}`} data={{...l, position: [l.position[0] + xOff, l.position[1] + 3.85, l.position[2]]}} />
          })}
        </Instances>
      </group>
    </group>
  );
}
