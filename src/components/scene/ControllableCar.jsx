import { Suspense, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CarModel from './CarModel';
import { GameState } from '../../gameState';
import { useKeyboardMovement } from '../../hooks/useKeyboardMovement';

const MOVEMENT_BOUNDS = {
  maxX: 1.75,
  minX: -1.75,
};

const STEERING_SPEED = 4.5;
const MAX_SPEED = 20;
const ACCEL = 10;
const BRAKE = 25;
const FRICTION = 4;

export default function ControllableCar() {
  const groupRef = useRef(null);
  const pressedKeysRef = useKeyboardMovement();

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (GameState.isPaused) return;

    if (GameState.isGameOver) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * 5);
      return;
    }

    const keys = pressedKeysRef.current;
    
    // Speed control
    if (keys.KeyW) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, MAX_SPEED, delta * (ACCEL / MAX_SPEED));
    } else if (keys.KeyS) {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * (BRAKE / MAX_SPEED));
    } else {
      GameState.speed = THREE.MathUtils.lerp(GameState.speed, 0, delta * (FRICTION / MAX_SPEED));
    }

    // Steering control
    const steerDir = Number(keys.KeyD) - Number(keys.KeyA);
    const isMoving = GameState.speed > 0.5;

    if (isMoving && steerDir !== 0) {
      const moveDelta = steerDir * STEERING_SPEED * delta * (GameState.speed / MAX_SPEED);
      group.position.x += moveDelta;
      group.position.x = THREE.MathUtils.clamp(group.position.x, MOVEMENT_BOUNDS.minX, MOVEMENT_BOUNDS.maxX);
    }

    // Tilt (roll)
    const targetTilt = steerDir * 0.15;
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -targetTilt, delta * 10);
    
    // Yaw
    const targetYaw = steerDir * 0.2;
    // Assuming car in .glb faces +Z, we rotate by Math.PI to make it face -Z (away from camera)
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -targetYaw + Math.PI, delta * 8);

    GameState.playerX = group.position.x;
  });

  return (
    <group ref={groupRef} position={[0, -0.66, 0]} rotation={[0, Math.PI, 0]}>
      <Suspense fallback={null}>
        <CarModel />
      </Suspense>
    </group>
  );
}
