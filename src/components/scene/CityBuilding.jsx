import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createFacadeTexture } from '../../utils/cityTextures';
import { GameState } from '../../gameState';

function getBuildingWindows(building) {
  const windowRows = Math.max(3, Math.floor(building.height / 0.48));
  const windowColumns = Math.max(2, Math.floor(building.width / 0.34));

  return Array.from({ length: windowRows }, (_, row) => (
    Array.from({ length: windowColumns }, (_, column) => {
      switch ((row + column + building.seed) % 3) {
        case 0:
          return null;

        default:
          return {
            key: `${row}-${column}`,
            x: ((column + 0.5) / windowColumns - 0.5) * building.width * 0.72,
            y: (row + 0.5) * 0.42 - building.height / 2 + 0.25,
          };
      }
    })
  )).flat().filter(Boolean);
}

export default function CityBuilding({ building, theme }) {
  const groupRef = useRef(null);

  const facadeTexture = useMemo(
    () => createFacadeTexture(building.color, building.seed),
    [building.color, building.seed],
  );
  const windows = useMemo(() => getBuildingWindows(building), [building]);

  useFrame((_, delta) => {
    if (!groupRef.current || GameState.isGameOver || GameState.isPaused) return;
    groupRef.current.position.z += GameState.speed * delta;
    if (groupRef.current.position.z > 5) {
      groupRef.current.position.z -= building.loopLength;
    }
  });

  return (
    <group ref={groupRef} position={[building.x, building.height / 2 - 0.64, building.z]} rotation={[0, building.rotation, 0]}>
      <mesh>
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <meshStandardMaterial map={facadeTexture} roughness={0.86} metalness={0.03} />
      </mesh>
      {windows.map((window) => (
        <mesh key={window.key} position={[window.x, window.y, building.depth / 2 + 0.006]}>
          <planeGeometry args={[0.08, 0.16]} />
          <meshStandardMaterial
            color={0xffe6a3}
            emissive={0xffc35a}
            emissiveIntensity={theme.buildingLight}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
