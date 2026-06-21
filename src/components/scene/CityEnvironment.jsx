import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Instances } from '@react-three/drei';
import * as THREE from 'three';
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

const BIOME_MATERIALS = {
  city: {
    ground: new THREE.Color(0x151821),
    road: new THREE.Color(0xffffff),
    sidewalk: new THREE.Color(0xffffff),
    facade: new THREE.Color(0xffffff),
    window: new THREE.Color(0x000000), // Black base to prevent light wash-out
    windowEmissive: new THREE.Color(0xffe6a3), // Original pale yellow color
    windowEmissiveInt: 1.0, // base multiplier
    pineTrunk: new THREE.Color(0x3d2817),
    pineLeaves: new THREE.Color(0x1e3f20),
    pineEmissive: new THREE.Color(0x000000),
    pineEmissiveInt: 0,
    roundTrunk: new THREE.Color(0x3d2817),
    roundLeaves: new THREE.Color(0x2d4c2b),
    roundEmissive: new THREE.Color(0x000000),
    roundEmissiveInt: 0,
    lightPole: new THREE.Color(0x2a2d34),
  },
  retrowave: {
    ground: new THREE.Color(0x020104), // Almost pitch black
    road: new THREE.Color(0x050208), // Extremely dark purple
    sidewalk: new THREE.Color(0x020104), // Extremely dark purple
    facade: new THREE.Color(0x1a1a2a), // Darker buildings
    window: new THREE.Color(0x000000), // Black base
    windowEmissive: new THREE.Color(0xff00ff), // Magenta glow
    windowEmissiveInt: 2.0,
    pineTrunk: new THREE.Color(0x111115),
    pineLeaves: new THREE.Color(0x001111),
    pineEmissive: new THREE.Color(0x00ffff), // Cyan wireframe glow
    pineEmissiveInt: 8.0,
    roundTrunk: new THREE.Color(0x111115),
    roundLeaves: new THREE.Color(0x110011),
    roundEmissive: new THREE.Color(0xff00ff), // Magenta glow
    roundEmissiveInt: 8.0,
    lightPole: new THREE.Color(0x0a0a10),
  }
};

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
    Array.from({ length: 30 }, (_, index) => {
      const seed = Math.abs(side * 88 + index * 19);
      // Bosque profundo en la coordenada Z (-41 a -53), lejos de los edificios (que van de -4.8 a -37.8)
      const zOffset = -41 - (index * 0.4);
      // Esparcidos ampliamente en el eje X para crear volumen de bosque (desde 3.8 hasta 12.0)
      const xOffset = side * (3.8 + (seed % 82) * 0.1);
      
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
    Array.from({ length: 4 }, (_, index) => {
      return {
        side,
        loopLength: BUILDING_LOOP_LENGTH,
        position: [side * (SIDEWALK_X - 0.2), -0.66, -index * 13.5],
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
          if (row === 0) return null;
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
  }, []);
  
  const pineTrees = useMemo(() => trees.filter(t => t.isPine), [trees]);
  const roundTrees = useMemo(() => trees.filter(t => !t.isPine), [trees]);
  const lights = useMemo(() => createStreetLights(), []);

  const matRefs = {
    ground: useRef(null),
    road: useRef(null),
    roadLine: useRef(null),
    sidewalk: useRef(null),
    sidewalkR: useRef(null),
    facade: useRef(null),
    window: useRef(null),
    pineTrunk: useRef(null),
    pineLeaves: useRef(null),
    roundTrunk: useRef(null),
    roundLeaves: useRef(null),
    lightPole: useRef(null),
    lightBulb: useRef(null),
  };

  useFrame((_, delta) => {
    if (GameState.isGameOver || GameState.isPaused || GameState.isMenu) return;
    
    roadTexture.offset.y += GameState.speed * delta * 0.225;
    sidewalkTexture.offset.y += GameState.speed * delta * 0.275;

    // Biome material interpolation
    const matA = BIOME_MATERIALS[GameState.currentBiome] || BIOME_MATERIALS.city;
    const matB = BIOME_MATERIALS[GameState.targetBiome] || BIOME_MATERIALS.city;
    const t = GameState.transitionProgress;

    if (matRefs.ground.current) matRefs.ground.current.color.lerpColors(matA.ground, matB.ground, t);
    if (matRefs.road.current) matRefs.road.current.color.lerpColors(matA.road, matB.road, t);
    if (matRefs.roadLine.current) {
      const lineA = GameState.currentBiome === 'retrowave' ? new THREE.Color(0x050208) : new THREE.Color(0xd7d3bd);
      const lineB = GameState.targetBiome === 'retrowave' ? new THREE.Color(0x050208) : new THREE.Color(0xd7d3bd);
      matRefs.roadLine.current.color.lerpColors(lineA, lineB, t);
    }
    if (matRefs.sidewalk.current) matRefs.sidewalk.current.color.lerpColors(matA.sidewalk, matB.sidewalk, t);
    if (matRefs.sidewalkR.current) matRefs.sidewalkR.current.color.lerpColors(matA.sidewalk, matB.sidewalk, t);
    if (matRefs.facade.current) matRefs.facade.current.color.lerpColors(matA.facade, matB.facade, t);
    
    if (matRefs.window.current) {
      matRefs.window.current.color.lerpColors(matA.window, matB.window, t);
      matRefs.window.current.emissive.lerpColors(matA.windowEmissive, matB.windowEmissive, t);
      const intensity = THREE.MathUtils.lerp(matA.windowEmissiveInt, matB.windowEmissiveInt, t);
      // Soften the theme multiplier so day blooms and night doesn't blind
      const themeFactor = 0.8 + (theme.buildingLight * 0.2);
      matRefs.window.current.emissiveIntensity = intensity * themeFactor;
    }

    if (matRefs.pineTrunk.current) matRefs.pineTrunk.current.color.lerpColors(matA.pineTrunk, matB.pineTrunk, t);
    if (matRefs.pineLeaves.current) {
      matRefs.pineLeaves.current.color.lerpColors(matA.pineLeaves, matB.pineLeaves, t);
      matRefs.pineLeaves.current.emissive.lerpColors(matA.pineEmissive, matB.pineEmissive, t);
      matRefs.pineLeaves.current.emissiveIntensity = THREE.MathUtils.lerp(matA.pineEmissiveInt, matB.pineEmissiveInt, t);
    }

    if (matRefs.roundTrunk.current) matRefs.roundTrunk.current.color.lerpColors(matA.roundTrunk, matB.roundTrunk, t);
    if (matRefs.roundLeaves.current) {
      matRefs.roundLeaves.current.color.lerpColors(matA.roundLeaves, matB.roundLeaves, t);
      matRefs.roundLeaves.current.emissive.lerpColors(matA.roundEmissive, matB.roundEmissive, t);
      matRefs.roundLeaves.current.emissiveIntensity = THREE.MathUtils.lerp(matA.roundEmissiveInt, matB.roundEmissiveInt, t);
    }

    if (matRefs.lightPole.current) matRefs.lightPole.current.color.lerpColors(matA.lightPole, matB.lightPole, t);
    
    if (matRefs.lightBulb.current) {
      const isNightCurrent = theme.type === 'night' || GameState.currentBiome === 'retrowave';
      const isNightTarget = theme.type === 'night' || GameState.targetBiome === 'retrowave';
      const emitA = isNightCurrent ? new THREE.Color(0xffbb55) : new THREE.Color(0x000000);
      const emitB = isNightTarget ? new THREE.Color(0xff00ff) : new THREE.Color(0x000000); // Magenta bulb in retrowave
      matRefs.lightBulb.current.emissive.lerpColors(emitA, emitB, t);
      matRefs.lightBulb.current.emissiveIntensity = isNightCurrent || isNightTarget ? 12.0 : 0;
    }
  });

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid" name="ground">
        <mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial ref={matRefs.ground} color={0x151821} roughness={0.94} metalness={0.01} />
        </mesh>
      </RigidBody>

      <mesh position={[0, -0.655, 1.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, 80]} />
        <meshStandardMaterial ref={matRefs.road} map={roadTexture} roughness={0.9} />
      </mesh>

      <mesh position={[0, -0.65, 1.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 80]} />
        <meshStandardMaterial ref={matRefs.roadLine} color={0xd7d3bd} roughness={0.7} />
      </mesh>

      <mesh position={[-SIDEWALK_X, -0.645, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, 80]} />
        <meshStandardMaterial ref={matRefs.sidewalk} map={sidewalkTexture} roughness={0.94} />
      </mesh>

      <mesh position={[SIDEWALK_X, -0.645, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, 80]} />
        <meshStandardMaterial ref={matRefs.sidewalkR} map={sidewalkTexture} roughness={0.94} />
      </mesh>

      {/* INSTANCED BUILDINGS */}
      <Instances frustumCulled={false} limit={100}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial ref={matRefs.facade} map={globalFacadeTexture} roughness={0.86} metalness={0.03} />
        {buildings.map((b, i) => <BuildingInstance key={i} data={b} />)}
      </Instances>

      {/* INSTANCED WINDOWS */}
      <Instances frustumCulled={false} limit={3500}>
        <planeGeometry args={[0.25, 0.45]} />
        <meshStandardMaterial ref={matRefs.window} color={0x000000} emissive={0xffe6a3} emissiveIntensity={theme.buildingLight} toneMapped={false} />
        {allWindows.map((w, i) => <WindowInstance key={i} data={w} />)}
      </Instances>

      {/* INSTANCED PINE TREES */}
      <group>
        <Instances frustumCulled={false} limit={100} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 1, 6]} />
          <meshStandardMaterial ref={matRefs.pineTrunk} color={0x3d2817} roughness={0.9} />
          {pineTrees.map((t, i) => <TreePineInstance key={`trunk-${i}`} data={{...t, position: [t.position[0], t.position[1] + 0.5 * t.scale, t.position[2]]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <coneGeometry args={[0.85, 1.5, 7]} />
          <meshStandardMaterial ref={matRefs.pineLeaves} color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-1-${i}`} data={{...t, position: [t.position[0], t.position[1] + 1.3 * t.scale, t.position[2]]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <coneGeometry args={[0.65, 1.3, 7]} />
          <meshStandardMaterial ref={matRefs.pineLeaves} color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-2-${i}`} data={{...t, position: [t.position[0], t.position[1] + 2.0 * t.scale, t.position[2]]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <coneGeometry args={[0.45, 1.1, 7]} />
          <meshStandardMaterial ref={matRefs.pineLeaves} color={0x1e3f20} roughness={0.8} />
          {pineTrees.map((t, i) => <TreePineInstance key={`leaves-3-${i}`} data={{...t, position: [t.position[0], t.position[1] + 2.7 * t.scale, t.position[2]]}} />)}
        </Instances>
      </group>

      {/* INSTANCED ROUND TREES */}
      <group>
        <Instances frustumCulled={false} limit={100} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
          <meshStandardMaterial ref={matRefs.roundTrunk} color={0x3d2817} roughness={0.9} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`trunk-${i}`} data={{...t, position: [t.position[0], t.position[1] + 0.6 * t.scale, t.position[2]]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial ref={matRefs.roundLeaves} color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-main-${i}`} data={{...t, position: [t.position[0], t.position[1] + 1.8 * t.scale, t.position[2]]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial ref={matRefs.roundLeaves} color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-side1-${i}`} data={{...t, position: [t.position[0] + 0.5 * t.scale, t.position[1] + 1.5 * t.scale, t.position[2] + 0.3 * t.scale]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <dodecahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial ref={matRefs.roundLeaves} color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-side2-${i}`} data={{...t, position: [t.position[0] - 0.4 * t.scale, t.position[1] + 1.6 * t.scale, t.position[2] - 0.4 * t.scale]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={100} castShadow>
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial ref={matRefs.roundLeaves} color={0x2d4c2b} roughness={0.8} />
          {roundTrees.map((t, i) => <TreeRoundInstance key={`leaves-top-${i}`} data={{...t, position: [t.position[0] + 0.1 * t.scale, t.position[1] + 2.4 * t.scale, t.position[2] - 0.2 * t.scale]}} />)}
        </Instances>
      </group>

      {/* INSTANCED STREETLIGHTS */}
      <group>
        <Instances frustumCulled={false} limit={50} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 4, 5]} />
          <meshStandardMaterial ref={matRefs.lightPole} color={0x2a2d34} roughness={0.6} metalness={0.8} />
          {lights.map((l, i) => <StreetLightPoleInstance key={`pole-${i}`} data={{...l, position: [l.position[0], l.position[1] + 2, l.position[2]]}} />)}
        </Instances>
        <Instances frustumCulled={false} limit={50}>
          <cylinderGeometry args={[0.03, 0.05, 0.8, 5]} />
          <meshStandardMaterial ref={matRefs.lightPole} color={0x2a2d34} roughness={0.6} metalness={0.8} />
          {lights.map((l, i) => {
            const rotZ = Math.PI / 2;
            const xOff = l.side === 1 ? -0.4 : 0.4;
            return <StreetLightPoleInstance key={`arm-${i}`} data={{...l, position: [l.position[0] + xOff, l.position[1] + 3.9, l.position[2]], rotation: [0, l.side === 1 ? Math.PI : 0, rotZ]}} />
          })}
        </Instances>
        <Instances frustumCulled={false} limit={50}>
          <boxGeometry args={[0.3, 0.1, 0.15]} />
          <meshStandardMaterial ref={matRefs.lightBulb} color={0xfff5e6} emissive={0x000000} emissiveIntensity={0} toneMapped={false} />
          {lights.map((l, i) => {
            const xOff = l.side === 1 ? -0.7 : 0.7;
            return <StreetLightPoleInstance key={`bulb-${i}`} data={{...l, position: [l.position[0] + xOff, l.position[1] + 3.85, l.position[2]]}} />
          })}
        </Instances>
      </group>
    </group>
  );
}
