import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance } from '@react-three/drei';
import { GameState } from '../../gameState';

export function BuildingInstance({ data }) {
  const ref = useRef();
  
  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 5) ref.current.position.z -= data.loopLength;
  });

  return (
    <Instance 
      ref={ref}
      position={[data.x, data.height / 2 - 0.64, data.z]} 
      rotation={[0, data.rotation, 0]}
      scale={[data.width, data.height, data.depth]}
      color={data.color}
    />
  );
}

export function WindowInstance({ data }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 5 + data.zOffset) {
      ref.current.position.z -= data.loopLength;
    }
  });

  return (
    <Instance
      ref={ref}
      position={[data.globalX, data.globalY, data.globalZ]}
      rotation={[0, data.rotation, 0]}
    />
  );
}

export function TreePineInstance({ data }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 5) ref.current.position.z -= data.loopLength;
  });

  return (
    <Instance
      ref={ref}
      position={data.position}
      scale={[data.scale, data.scale, data.scale]}
    />
  );
}

export function TreeRoundInstance({ data }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 5) ref.current.position.z -= data.loopLength;
  });

  return (
    <Instance
      ref={ref}
      position={data.position}
      scale={[data.scale, data.scale, data.scale]}
    />
  );
}

export function StreetLightPoleInstance({ data }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 5) ref.current.position.z -= data.loopLength;
  });

  return (
    <Instance
      ref={ref}
      position={data.position}
      rotation={data.rotation || [0, data.side === 1 ? Math.PI : 0, 0]}
    />
  );
}
