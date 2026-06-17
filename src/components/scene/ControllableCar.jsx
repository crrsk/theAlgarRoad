import { Suspense, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import CarModel from './CarModel';
import { GameState } from '../../gameState';
import { useKeyboardMovement } from '../../hooks/useKeyboardMovement';

const MOVEMENT_BOUNDS = {
  maxX: 1.75,
  minX: -1.75,
};

const STEERING_SPEED = 5.5; // Mejor giro a altas velocidades
const MAX_SPEED = 30; // 30 * 10 = 300 km/h
const ACCEL = 25; // Alta aceleración (muchos caballos)
const BRAKE = 50; // Frenos de alto rendimiento
const FRICTION = 8; // Fricción y resistencia del aire

export default function ControllableCar() {
  const groupRef = useRef(null);
  const rigidBodyRef = useRef(null);
  const pressedKeysRef = useKeyboardMovement();

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (GameState.isMenu || GameState.isPaused) return;

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
      // Dynamic steering using velocity
      if (rigidBodyRef.current) {
          const linvel = rigidBodyRef.current.linvel();
          const targetVelX = steerDir * 15 * (GameState.speed / MAX_SPEED);
          linvel.x = THREE.MathUtils.lerp(linvel.x, targetVelX, delta * STEERING_SPEED * 3);
          rigidBodyRef.current.setLinvel(linvel);
      }
    } else {
      if (rigidBodyRef.current) {
          const linvel = rigidBodyRef.current.linvel();
          linvel.x = THREE.MathUtils.lerp(linvel.x, 0, delta * 10);
          rigidBodyRef.current.setLinvel(linvel);
      }
    }
    
    // Boundary enforcement
    if (rigidBodyRef.current) {
       const currentPos = rigidBodyRef.current.translation();
       if (currentPos.x > MOVEMENT_BOUNDS.maxX) {
           rigidBodyRef.current.setTranslation({ x: MOVEMENT_BOUNDS.maxX, y: currentPos.y, z: currentPos.z });
           rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 });
       } else if (currentPos.x < MOVEMENT_BOUNDS.minX) {
           rigidBodyRef.current.setTranslation({ x: MOVEMENT_BOUNDS.minX, y: currentPos.y, z: currentPos.z });
           rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 });
       }
       GameState.playerX = currentPos.x;
    }

    // Tilt (roll) - apply to visual group only
    const targetTilt = steerDir * 0.15;
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -targetTilt, delta * 10);
    
    // Yaw - apply to visual group only
    const targetYaw = steerDir * 0.2;
    // Assuming car in .glb faces +Z, we rotate by Math.PI to make it face -Z (away from camera)
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -targetYaw + Math.PI, delta * 8);
  });

  const handleCollision = (e) => {
    const otherName = e.other?.rigidBodyObject?.name || "Sin nombre";
    
    // Ignore collision with the ground
    if (otherName === "ground") {
      return;
    }
    
    console.log("💥 COLISIÓN DETECTADA CON:", otherName);
    
    // If it hits a traffic car, trigger Game Over
    GameState.isGameOver = true;
  };

  return (
    <RigidBody 
      ref={rigidBodyRef} 
      type="dynamic" 
      colliders="hull" 
      position={[GameState.playerX || 0, -0.66, 0]}
      enabledTranslations={[true, true, false]} // Lock Z so it doesn't get pushed back infinitely
      enabledRotations={[false, false, false]} // Lock physical rotations to prevent flip bugs
      canSleep={false}
      onCollisionEnter={handleCollision}
      mass={1500}
    >
      <group ref={groupRef} rotation={[0, Math.PI, 0]}>
        <Suspense fallback={null}>
          <CarModel />
        </Suspense>
      </group>
    </RigidBody>
  );
}
