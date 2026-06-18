import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import TrafficCar, { VEHICLE_CONFIG } from './TrafficCar';
import { GameState } from '../../gameState';

const SPAWN_Z_FRONT = -60;
const SPAWN_Z_BACK = 20; 
const DESPAWN_Z_BACK = 40;
const DESPAWN_Z_FRONT = -80;
const COLLISION_DISTANCE_Z = 2.8;
const COLLISION_DISTANCE_X = 1.3;

const NUM_LANES = 2; // 0 = Left (Oncoming), 1 = Right (Same)
const BASE_GAP = 2.2; 
const JITTER = 0.4; 
const MIN_SAFE_DISTANCE_SAME = 35;
const MIN_SAFE_DISTANCE_ONCOMING = 18;

const SPAWN_PATTERNS = [
  { name: 'solo_left',     spawns: [{ lane: 0, delay: 0 }] },
  { name: 'solo_right',    spawns: [{ lane: 1, delay: 0 }] },
  { name: 'convoy_right',  spawns: [{ lane: 1, delay: 0 }, { lane: 1, delay: 2.8 }] },
  { name: 'staggered_lr',  spawns: [{ lane: 0, delay: 0 }, { lane: 1, delay: 0.8 }] },
  { name: 'staggered_rl',  spawns: [{ lane: 1, delay: 0 }, { lane: 0, delay: 0.8 }] },
  { name: 'double_left',   spawns: [{ lane: 0, delay: 0 }, { lane: 0, delay: 0.6 }] }, 
  { name: 'dense',         spawns: [{ lane: 0, delay: 0 }, { lane: 1, delay: 0.3 }, { lane: 0, delay: 0.8 }, { lane: 1, delay: 1.5 }] },
];

export default function TrafficManager() {
  // Store the actual car data in a ref so we can update it without triggering React renders
  const carsRef = useRef([]);
  // Only use this state to tell React when to mount/unmount components (spawn/despawn)
  const [activeCars, setActiveCars] = useState([]);
  
  const patternQueue = useRef([]);
  const patternCooldown = useRef(2.0);

  useFrame((_, delta) => {
    if (GameState.isMenu || GameState.isGameOver || GameState.isPaused) return;

    GameState.distance += GameState.speed * delta * 0.1;

    let needsRender = false;

    // --- POLICE SPAWN LOGIC ---
    if (GameState.policeRequested) {
      GameState.policeRequested = false;
      GameState.policeActive = true;
      
      const policePath = '/CochesCirculacion/Police Car.glb';
      // Mismo carril aproximado que el jugador
      const laneX = GameState.playerX > 0 ? 1.2 : -1.2;
      const spawnZ = 35; // Más lejos para dar tiempo de reacción (antes 20)
      const carSpeed = Math.max(18, GameState.speed + 4); // Aún más equilibrado (antes 22 y +7)
      
      carsRef.current.push({ 
        id: 'police_' + Math.random().toString(), 
        x: laneX, 
        z: spawnZ, 
        modelPath: policePath, 
        direction: 'same', 
        speed: carSpeed, 
        isPolice: true,
        meshRef: React.createRef() 
      });
      needsRender = true;
    }

    // --- SPAWN LOGIC ---
    // Nivel de dificultad basado en los km recorridos (GameState.distance en metros)
    const difficultyLevel = Math.min(4, Math.floor(GameState.distance / 500));
    
    const trySpawnInLane = (laneIndex) => {
      const isLeftLane = laneIndex === 0;
      const direction = isLeftLane ? 'oncoming' : 'same';
      const laneX = isLeftLane ? -1.2 : 1.2;
      
      const randomConfig = VEHICLE_CONFIG[Math.floor(Math.random() * VEHICLE_CONFIG.length)];
      const modelPath = randomConfig.path;
      
      let carSpeed = direction === 'same' ? 11 : 16;
      let spawnZ = SPAWN_Z_FRONT;
      if (direction === 'same' && GameState.speed < carSpeed) spawnZ = SPAWN_Z_BACK;

      const safeDistance = isLeftLane ? MIN_SAFE_DISTANCE_ONCOMING : MIN_SAFE_DISTANCE_SAME;

      const tooClose = carsRef.current.some(car => {
        return car.x === laneX && Math.abs(car.z - spawnZ) < safeDistance;
      });

      if (!tooClose) {
        carsRef.current.push({ 
          id: Math.random().toString(), 
          x: laneX, 
          z: spawnZ, 
          modelPath, 
          direction, 
          speed: carSpeed, 
          meshRef: React.createRef() 
        });
        needsRender = true;
      }
    };

    if (patternQueue.current.length > 0) {
      // Process active pattern queue
      for (let i = patternQueue.current.length - 1; i >= 0; i--) {
        const spawnItem = patternQueue.current[i];
        spawnItem.delay -= delta;
        if (spawnItem.delay <= 0) {
          trySpawnInLane(spawnItem.lane);
          patternQueue.current.splice(i, 1);
        }
      }
    } else {
      // Wait for cooldown then pick new pattern
      patternCooldown.current -= delta;
      if (patternCooldown.current <= 0) {
        // Reset cooldown with jitter based on difficulty
        const currentBaseGap = Math.max(0.8, BASE_GAP - (difficultyLevel * 0.3)); 
        patternCooldown.current = currentBaseGap + (Math.random() - 0.5) * 2 * currentBaseGap * JITTER;
        
        // Pick pattern
        const availablePatterns = SPAWN_PATTERNS.slice(0, 4 + difficultyLevel);
        const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        
        // Deep copy the pattern spawns into the queue
        patternQueue.current = pattern.spawns.map(s => ({ ...s }));
      }
    }

    // --- MOVE LOGIC ---
    let collided = false;
    let tailgating = false;
    
    for (let i = carsRef.current.length - 1; i >= 0; i--) {
      const car = carsRef.current[i];
      let approachSpeed = car.direction === 'oncoming' ? GameState.speed + car.speed : GameState.speed - car.speed;
      
      car.z += approachSpeed * delta;

      // Detect if player is tailgating this car
      if (!car.isPolice && car.direction === 'same' && Math.abs(car.x - GameState.playerX) < 1.2) {
        // Z is negative if the car is in front of the player
        if (car.z < -2 && car.z > -35) {
          tailgating = true;
        }
      }

      // Update actual Rapier kinematic position directly! (0 React renders)
      if (car.meshRef.current) {
        car.meshRef.current.setNextKinematicTranslation({ x: car.x, y: -0.66, z: car.z });
      }

      // Collision check is now handled by Rapier's onCollisionEnter in ControllableCar
      
      // Despawn check
      if (car.z >= DESPAWN_Z_BACK || car.z <= DESPAWN_Z_FRONT) {
        if (car.isPolice) GameState.policeActive = false;
        carsRef.current.splice(i, 1);
        needsRender = true;
      }
    }

    if (collided) {
      GameState.isGameOver = true;
    }

    GameState.isTailgating = tailgating;

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
          <RigidBody 
            key={car.id} 
            ref={car.meshRef} 
            name={car.isPolice ? "police_car" : "traffic_car"}
            type="kinematicPosition" 
            colliders="hull" 
            position={[car.x, -0.66, car.z]} 
            rotation={[0, rotationY, 0]}
          >
            <TrafficCar modelPath={car.modelPath} />
          </RigidBody>
        );
      })}
    </group>
  );
}
