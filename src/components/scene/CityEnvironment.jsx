import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import CityBuilding from './CityBuilding';
import { createRoadTexture, createSidewalkTexture } from '../../utils/cityTextures';
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

        return {
          color: BUILDING_PALETTE[(index + lane + seed) % BUILDING_PALETTE.length],
          depth: 1.5 + (seed % 3) * 0.5,
          height: 6 + lane * 2 + (seed % 5) * 1.0,
          loopLength: BUILDING_LOOP_LENGTH,
          rotation: side * -0.045,
          seed,
          width: 1.5 + (seed % 4) * 0.5,
          x: side * (BUILDING_START_X + lane * 2.5 + ((index + lane) % 2) * 0.5),
          z: -4.8 - index * 4.0 - lane * 1.05,
        };
      })
    ))
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
  const buildings = useMemo(() => [
    ...createSideBuildings(),
    ...createDistantBuildings(),
  ], []);

  useFrame((_, delta) => {
    if (GameState.isGameOver || GameState.isPaused) return;
    roadTexture.offset.y -= GameState.speed * delta * 0.1;
    sidewalkTexture.offset.y -= GameState.speed * delta * 0.1;
  });

  return (
    <group>
      <mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={0x151821} roughness={0.94} metalness={0.01} />
      </mesh>

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

      {buildings.map((building) => (
        <CityBuilding
          key={`${building.x}-${building.z}-${building.height}`}
          building={building}
          theme={theme}
        />
      ))}
    </group>
  );
}
