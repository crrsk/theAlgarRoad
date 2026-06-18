import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance } from '@react-three/drei';
import { GameState } from '../../gameState';

export function BuildingInstance({ data, biome = 'city' }) {
  const ref = useRef();
  
  const targetY = data.y !== undefined ? data.y : data.height / 2 - 0.64;
  const hiddenY = -1000;
  const initialY = GameState.currentBiome === biome ? targetY : hiddenY;

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 18) {
      ref.current.position.z -= data.loopLength;
      if (GameState.currentBiome === biome && GameState.transitionPhase === 0) {
        ref.current.position.y = targetY;
      } else {
        ref.current.position.y = hiddenY;
      }
    }

    if (GameState.currentBiome === biome) {
      if (biome === 'retrowave') {
        const spawnZ = 18 - data.loopLength;
        const spawnProgress = Math.min(1, Math.max(0, (ref.current.position.z - spawnZ) / 10.0));
        const easeOut = 1 - Math.pow(1 - spawnProgress, 3);
        ref.current.scale.set(data.width * easeOut, data.height * easeOut, data.depth * easeOut);
      } else {
        ref.current.scale.set(data.width, data.height, data.depth);
      }
    }
  });

  return (
    <Instance 
      ref={ref}
      position={[data.x, initialY, data.z]} 
      rotation={[0, data.rotation, 0]}
      scale={[data.width, data.height, data.depth]}
      color={data.color}
    />
  );
}

export function WindowInstance({ data, biome = 'city' }) {
  const ref = useRef();
  
  const targetY = data.globalY;
  const hiddenY = -1000;
  const initialY = GameState.currentBiome === biome ? targetY : hiddenY;

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 18 + data.zOffset) {
      ref.current.position.z -= data.loopLength;
      if (GameState.currentBiome === biome && GameState.transitionPhase === 0) {
        ref.current.position.y = targetY;
      } else {
        ref.current.position.y = hiddenY;
      }
    }

    if (GameState.currentBiome === biome) {
      if (biome === 'retrowave') {
        const spawnZ = 18 + data.zOffset - data.loopLength;
        const spawnProgress = Math.min(1, Math.max(0, (ref.current.position.z - spawnZ) / 10.0));
        const easeOut = 1 - Math.pow(1 - spawnProgress, 3);
        ref.current.scale.set(easeOut, easeOut, easeOut);
      } else {
        ref.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <Instance
      ref={ref}
      position={[data.globalX, initialY, data.globalZ]}
      rotation={[0, data.rotation, 0]}
    />
  );
}

export function TreePineInstance({ data, biome = 'city' }) {
  const ref = useRef();

  const targetY = data.position[1];
  const hiddenY = -1000;
  const initialY = GameState.currentBiome === biome ? targetY : hiddenY;

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 18) {
      ref.current.position.z -= data.loopLength;
      if (GameState.currentBiome === biome && GameState.transitionPhase === 0) {
        ref.current.position.y = targetY;
      } else {
        ref.current.position.y = hiddenY;
      }
    }

    if (GameState.currentBiome === biome) {
      if (biome === 'retrowave') {
        const spawnZ = 18 - data.loopLength;
        const spawnProgress = Math.min(1, Math.max(0, (ref.current.position.z - spawnZ) / 10.0));
        const easeOut = 1 - Math.pow(1 - spawnProgress, 3);
        ref.current.scale.set(data.scale * easeOut, data.scale * easeOut, data.scale * easeOut);
      } else {
        ref.current.scale.set(data.scale, data.scale, data.scale);
      }
    }
  });

  return (
    <Instance
      ref={ref}
      position={[data.position[0], initialY, data.position[2]]}
      scale={[data.scale, data.scale, data.scale]}
    />
  );
}

export function TreeRoundInstance({ data, biome = 'city' }) {
  const ref = useRef();

  const targetY = data.position[1];
  const hiddenY = -1000;
  const initialY = GameState.currentBiome === biome ? targetY : hiddenY;

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 18) {
      ref.current.position.z -= data.loopLength;
      if (GameState.currentBiome === biome && GameState.transitionPhase === 0) {
        ref.current.position.y = targetY;
      } else {
        ref.current.position.y = hiddenY;
      }
    }

    if (GameState.currentBiome === biome) {
      if (biome === 'retrowave') {
        const spawnZ = 18 - data.loopLength;
        const spawnProgress = Math.min(1, Math.max(0, (ref.current.position.z - spawnZ) / 10.0));
        const easeOut = 1 - Math.pow(1 - spawnProgress, 3);
        ref.current.scale.set(data.scale * easeOut, data.scale * easeOut, data.scale * easeOut);
      } else {
        ref.current.scale.set(data.scale, data.scale, data.scale);
      }
    }
  });

  return (
    <Instance
      ref={ref}
      position={[data.position[0], initialY, data.position[2]]}
      scale={[data.scale, data.scale, data.scale]}
    />
  );
}

export function StreetLightPoleInstance({ data, biome = 'city' }) {
  const ref = useRef();

  const targetY = data.position[1];
  const hiddenY = -1000;
  const initialY = GameState.currentBiome === biome ? targetY : hiddenY;

  useFrame((_, delta) => {
    if (!ref.current || GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;
    ref.current.position.z += GameState.speed * delta;
    if (ref.current.position.z > 18) {
      ref.current.position.z -= data.loopLength;
      if (GameState.currentBiome === biome && GameState.transitionPhase === 0) {
        ref.current.position.y = targetY;
      } else {
        ref.current.position.y = hiddenY;
      }
    }

    if (GameState.currentBiome === biome) {
      if (biome === 'retrowave') {
        const spawnZ = 18 - data.loopLength;
        const spawnProgress = Math.min(1, Math.max(0, (ref.current.position.z - spawnZ) / 10.0));
        const easeOut = 1 - Math.pow(1 - spawnProgress, 3);
        ref.current.scale.set(easeOut, easeOut, easeOut);
      } else {
        ref.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <Instance
      ref={ref}
      position={[data.position[0], initialY, data.position[2]]}
      rotation={data.rotation || [0, data.side === 1 ? Math.PI : 0, 0]}
    />
  );
}
