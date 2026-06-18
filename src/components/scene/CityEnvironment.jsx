import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Instances } from '@react-three/drei';
import { BuildingInstance, WindowInstance, TreePineInstance, TreeRoundInstance, StreetLightPoleInstance } from './CityInstances';
import { createRoadTexture, createSidewalkTexture, createGlobalFacadeTexture } from '../../utils/cityTextures';
import { GameState } from '../../gameState';

const BUILDING_PALETTE = [0x3b4350, 0x46505f, 0x2f3948, 0x56606b, 0x394a5a];
const DISTANT_PALETTE = [0x485564, 0x596775, 0x3f4d5d];
const BUILDING_LOOP_LENGTH = 55;
const ROAD_WIDTH = 4.6;
const SIDEWALK_WIDTH = 1.35;
const SIDEWALK_X = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2 + 0.25;
const SIDEWALK_EDGE_X = ROAD_WIDTH / 2 + SIDEWALK_WIDTH;

function createSideBuildings() {
  const sides = [-1, 1];
  const lanes = [0, 1, 2];

  return sides.flatMap((side) => (
    lanes.flatMap((lane) => (
      Array.from({ length: 6 }, (_, index) => {
        const seed = Math.abs(side * 31 + lane * 17 + index * 5);

        const width = 3.5 + (seed % 4) * 1.0;
        const xOffset = SIDEWALK_EDGE_X + 0.8 + (width / 2) + lane * 7.5 + ((index + lane) % 2) * 0.4;

        return {
          isTree: false,
          color: BUILDING_PALETTE[(index + lane + seed) % BUILDING_PALETTE.length],
          depth: 2.5 + (seed % 3) * 1.0,
          height: 8 + lane * 4 + (seed % 5) * 1.5,
          loopLength: BUILDING_LOOP_LENGTH,
          rotation: 0,
          seed,
          width,
          x: side * xOffset,
          z: -4.8 - index * 6.0 - lane * 1.5,
        };
      }).flat()
    ))
  )).filter(Boolean);
}

function createGapTrees() {
  const sides = [-1, 1];
  return sides.flatMap((side) => (
    Array.from({ length: 22 }, (_, index) => {
      const seed = Math.abs(side * 88 + index * 19);
      // El bloque de edificios termina en z = -38 aprox. El siguiente empieza en z = -55
      // Repartimos los árboles en este hueco (z entre -39 y -54)
      const zOffset = -39 - (index * 0.65) - (Math.random() * 0.5);
      
      // Esparcirlos a lo ancho desde la acera hacia adentro
      const xOffset = side * (3.8 + Math.random() * 5.0);
      
      return {
        isTree: true,
        seed,
        loopLength: BUILDING_LOOP_LENGTH,
        position: [xOffset, -0.66, zOffset],
      };
    })
  ));
}

function createStreetLights() {
  const sides = [-1, 1];
  return sides.flatMap((side) => (
    Array.from({ length: 8 }, (_, index) => {
      return {
        side,
        loopLength: BUILDING_LOOP_LENGTH,
        position: [side * (SIDEWALK_X - 0.2), -0.66, -index * 7],
      };
    })
  ));
}

function createDistantBuildings() {
  return Array.from({ length: 19 }, (_, index) => {
    const center = index - 9;
    const seed = index * 9 + 3;

    return {
      color: DISTANT_PALETTE[index % DISTANT_PALETTE.length],
      depth: 2.5,
      height: 18 + (seed % 6) * 3,
      loopLength: BUILDING_LOOP_LENGTH,
      rotation: 0,
      seed,
      width: 4.0 + (seed % 4) * 1.0,
      x: center * 8.0,
      z: -35.0 - (index % 3) * 2.0,
    };
  }).filter((building) => Math.abs(building.x) - building.width / 2 > SIDEWALK_EDGE_X + 1.0);
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
      const windowRows = Math.max(3, Math.floor(building.height / 1.2));
      const windowColumns = Math.max(2, Math.floor(building.width / 0.8));
      
      return Array.from({ length: windowRows }, (_, row) => (
        Array.from({ length: windowColumns }, (_, column) => {
          if (row === 0) return null; // Skip ground floor windows for realism
          if ((row + column + building.seed) % 3 === 0) return null;
          
          const localX = ((column + 0.5) / windowColumns - 0.5) * building.width * 0.8;
          const localY = (row + 0.5) * 1.2 - building.height / 2 + 0.5;
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
    const rawTrees = createGapTrees();
    return rawTrees.map(t => ({
      ...t,
      scale: 0.7 + (t.seed % 5) * 0.1,
      isPine: t.seed % 2 === 0
    }));
  }, [allBlocks]);
  
  const pineTrees = useMemo(() => trees.filter(t => t.isPine), [trees]);
  const roundTrees = useMemo(() => trees.filter(t => !t.isPine), [trees]);
  
  const lights = useMemo(() => createStreetLights(), []);

  useFrame((_, delta) => {
    if (GameState.isGameOver || GameState.isPaused) return;
    // Sincronización exacta: multiplicador = repeat.y / longitud_del_plano
    // Road: repeat.y = 18, longitud = 80 -> 18/80 = 0.225
    // Sidewalk: repeat.y = 22, longitud = 80 -> 22/80 = 0.275
    roadTexture.offset.y += GameState.speed * delta * 0.225;
    sidewalkTexture.offset.y += GameState.speed * delta * 0.275;
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
      <Instances limit={3500}>
        <planeGeometry args={[0.25, 0.45]} />
        <meshStandardMaterial color={0xffe6a3} emissive={0xffc35a} emissiveIntensity={theme.buildingLight} toneMapped={false} />
        {allWindows.map((w, i) => <WindowInstance key={i} data={w} />)}
      </Instances>

      {/* INSTANCED PINE TREES */}
      <group>
        <Instances limit={100} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 1, 6]} />
          <meshStandardMaterial color={0x3d2817} roughness={0.9} />
          {pineTrees.map((t, i) => <TreePineInstance key={`trunk-${i}`} data={{...t, position: [t.position[0], t.position[1] + 0.5 * t.scale, t.position[2]]}} />)}
        </Instances>
        {/* Tier 1 (Base) */}
        <Instances limit={100} castShadow>
          <coneGeometry args={[0.85, 1.5, 7]} />
          <meshStandardMaterial color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-1-${i}`} data={{...t, position: [t.position[0], t.position[1] + 1.3 * t.scale, t.position[2]]}} />)}
        </Instances>
        {/* Tier 2 (Middle) */}
        <Instances limit={100} castShadow>
          <coneGeometry args={[0.65, 1.3, 7]} />
          <meshStandardMaterial color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-2-${i}`} data={{...t, position: [t.position[0], t.position[1] + 2.0 * t.scale, t.position[2]]}} />)}
        </Instances>
        {/* Tier 3 (Top) */}
        <Instances limit={100} castShadow>
          <coneGeometry args={[0.45, 1.1, 7]} />
          <meshStandardMaterial color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-3-${i}`} data={{...t, position: [t.position[0], t.position[1] + 2.7 * t.scale, t.position[2]]}} />)}
        </Instances>
      </group>

      {/* INSTANCED ROUND TREES */}
      <group>
        <Instances limit={100} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
          <meshStandardMaterial color={0x3d2817} roughness={0.9} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`trunk-${i}`} data={{...t, position: [t.position[0], t.position[1] + 0.6 * t.scale, t.position[2]]}} />)}
        </Instances>
        {/* Main Cluster */}
        <Instances limit={100} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-main-${i}`} data={{...t, position: [t.position[0], t.position[1] + 1.8 * t.scale, t.position[2]]}} />)}
        </Instances>
        {/* Side Cluster 1 */}
        <Instances limit={100} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-side1-${i}`} data={{...t, position: [t.position[0] + 0.5 * t.scale, t.position[1] + 1.5 * t.scale, t.position[2] + 0.3 * t.scale]}} />)}
        </Instances>
        {/* Side Cluster 2 */}
        <Instances limit={100} castShadow>
          <dodecahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-side2-${i}`} data={{...t, position: [t.position[0] - 0.4 * t.scale, t.position[1] + 1.6 * t.scale, t.position[2] - 0.4 * t.scale]}} />)}
        </Instances>
        {/* Top Cluster */}
        <Instances limit={100} castShadow>
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-top-${i}`} data={{...t, position: [t.position[0] + 0.1 * t.scale, t.position[1] + 2.4 * t.scale, t.position[2] - 0.2 * t.scale]}} />)}
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
