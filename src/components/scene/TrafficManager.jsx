import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import TrafficCar from './TrafficCar';
import { GameState } from '../../gameState';

const MODELS = [
  '/CochesCirculacion/Bus.glb',
  '/CochesCirculacion/Jeep.glb',
  '/CochesCirculacion/Pickup Truck.glb',
  '/CochesCirculacion/Police Car.glb',
  '/CochesCirculacion/Red Car.glb',
  '/CochesCirculacion/Sports Car.glb',
];

const SPAWN_Z_FRONT = -60;
const SPAWN_Z_BACK = 20; 
const DESPAWN_Z_BACK = 25;
const DESPAWN_Z_FRONT = -80;
const COLLISION_DISTANCE_Z = 2.8;
const COLLISION_DISTANCE_X = 1.3;

export default function TrafficManager() {
  // Store the actual car data in a ref so we can update it without triggering React renders
  const carsRef = useRef([]);
  // Only use this state to tell React when to mount/unmount components (spawn/despawn)
  const [activeCars, setActiveCars] = useState([]);
  
  const spawnTimer = useRef(0);

  useFrame((_, delta) => {
    if (GameState.isGameOver || GameState.isPaused) return;

    GameState.distance += GameState.speed * delta * 0.1;

    let needsRender = false;

    // --- SPAWN LOGIC ---
    const spawnRate = Math.max(1, GameState.speed * 0.2); 
    spawnTimer.current += delta * spawnRate;
    
    if (spawnTimer.current > 2.5) {
      spawnTimer.current = 0;
      
      const isLeftLane = Math.random() > 0.5;
      const direction = isLeftLane ? 'oncoming' : 'same';
      const laneX = isLeftLane ? -1.2 : 1.2;
      const modelPath = MODELS[Math.floor(Math.random() * MODELS.length)];
      
      let carSpeed = 0;
      let spawnZ = SPAWN_Z_FRONT;

      if (direction === 'same') {
        carSpeed = 11;
        if (GameState.speed < carSpeed) spawnZ = SPAWN_Z_BACK;
      } else {
        carSpeed = 16;
      }
      
      const MIN_GAP_SAME_LANE = 35;
      const MIN_GAP_OPPOSITE_LANE = 18;
      
      const checkSafe = (targetX, targetZ) => {
        return !carsRef.current.some(car => {
          if (car.x === targetX) {
            return Math.abs(car.z - targetZ) < MIN_GAP_SAME_LANE;
          } else {
            return Math.abs(car.z - targetZ) < MIN_GAP_OPPOSITE_LANE;
          }
        });
      };

      let spawned = false;
      if (checkSafe(laneX, spawnZ)) {
        carsRef.current.push({ id: Math.random().toString(), x: laneX, z: spawnZ, modelPath, direction, speed: carSpeed, meshRef: React.createRef() });
        spawned = true;
      } else {
        // Try opposite lane
        const oppLaneX = laneX === -1.2 ? 1.2 : -1.2;
        const oppDirection = oppLaneX === -1.2 ? 'oncoming' : 'same';
        let oppCarSpeed = oppDirection === 'same' ? 11 : 16;
        let oppSpawnZ = SPAWN_Z_FRONT;
        if (oppDirection === 'same' && GameState.speed < oppCarSpeed) oppSpawnZ = SPAWN_Z_BACK;

        if (checkSafe(oppLaneX, oppSpawnZ)) {
          carsRef.current.push({ id: Math.random().toString(), x: oppLaneX, z: oppSpawnZ, modelPath, direction: oppDirection, speed: oppCarSpeed, meshRef: React.createRef() });
          spawned = true;
        }
      }

      if (spawned) {
        needsRender = true;
      } else {
        spawnTimer.current = 2.0; // Retry soon
      }
    }

    // --- MOVE LOGIC ---
    let collided = false;
    for (let i = carsRef.current.length - 1; i >= 0; i--) {
      const car = carsRef.current[i];
      let approachSpeed = car.direction === 'oncoming' ? GameState.speed + car.speed : GameState.speed - car.speed;
      
      car.z += approachSpeed * delta;

      // Update actual Three.js mesh position directly! (0 React renders)
      if (car.meshRef.current) {
        car.meshRef.current.position.z = car.z;
      }

      // Collision check
      if (Math.abs(car.z) < COLLISION_DISTANCE_Z && Math.abs(car.x - GameState.playerX) < COLLISION_DISTANCE_X) {
        collided = true;
      }

      // Despawn check
      if (car.z >= DESPAWN_Z_BACK || car.z <= DESPAWN_Z_FRONT) {
        carsRef.current.splice(i, 1);
        needsRender = true;
      }
    }

    if (collided) {
      GameState.isGameOver = true;
    }

    // Only tell React to render if the NUMBER of cars changed
    if (needsRender) {
      setActiveCars([...carsRef.current]);
    }
  });

  return (
    <group>
      {activeCars.map(car => {
        const rotationY = car.direction === 'oncoming' ? 0 : Math.PI;
        return (
          <group key={car.id} ref={car.meshRef} position={[car.x, -0.66, car.z]} rotation={[0, rotationY, 0]}>
            <TrafficCar modelPath={car.modelPath} />
          </group>
        );
      })}
    </group>
  );
}
